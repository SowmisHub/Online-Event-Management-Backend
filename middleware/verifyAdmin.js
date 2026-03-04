const { supabaseAdmin } = require("../config/supabaseClient");

const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile || profile.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();

  } catch (err) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

module.exports = verifyAdmin;