const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= GET PROFILE ================= */

exports.getProfile = async (req, res) => {
  try {

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role, approved")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(400).json({ message: "Profile not found" });
    }

    res.json(profile);

  } catch (err) {

    res.status(500).json({ message: "Failed to fetch profile" });

  }
};