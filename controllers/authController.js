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