const { supabaseAdmin, supabasePublic } = require("../config/supabaseClient");

/* ================= SIGNUP ================= */

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (error) return res.status(400).json({ message: error.message });

    const userId = data.user.id;

    await supabaseAdmin.from("profiles").insert({
      id: userId,
      name,
      role,
      approved: role === "speaker" ? false : true,
    });

    res.json({ message: "Account created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= LOGIN ================= */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } =
      await supabasePublic.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

    if (profileError) {
      return res.status(400).json({ message: "Profile not found" });
    }

    res.json({
      token: data.session.access_token,
      role: profile.role,
      approved: profile.approved,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GOOGLE LOGIN ================= */

exports.googleLogin = async (req, res) => {

  try {

    const { token } = req.body;

    const { data: userData, error } =
      await supabaseAdmin.auth.getUser(token);

    if (error) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const user = userData.user;

    /* Check if profile exists */

    const { data: profile } =
      await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) {

      /* create attendee profile automatically */

      await supabaseAdmin.from("profiles").insert({
        id: user.id,
        name: user.user_metadata.full_name || "Google User",
        role: "attendee",
        approved: true
      });

    }

    const { data: newProfile } =
      await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    res.json({
      token,
      role: newProfile.role,
      approved: newProfile.approved
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }

};

/* ================= FORGOT PASSWORD ================= */

exports.forgotPassword = async (req, res) => {

  const { email } = req.body;

  const { error } =
    await supabasePublic.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.FRONTEND_URL + "/reset-password",
    });

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Password reset email sent" });

};