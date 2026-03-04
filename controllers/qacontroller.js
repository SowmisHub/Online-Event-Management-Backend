const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= GET ALL Q&A ================= */

exports.getQA = async (req, res) => {
  try {

    const { data, error } = await supabaseAdmin
      .from("qa")
      .select(`
        *,
        profiles(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(data || []);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch Q&A" });
  }
};


/* ================= CREATE Q&A ================= */

exports.createQA = async (req, res) => {
  try {

    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "All fields required" });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "speaker")) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { error } = await supabaseAdmin
      .from("qa")
      .insert({
        question,
        answer,
        created_by: req.user.id
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Q&A created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Create failed" });
  }
};


/* ================= DELETE Q&A ================= */

exports.deleteQA = async (req, res) => {
  try {

    const { id } = req.params;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "speaker")) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { error } = await supabaseAdmin
      .from("qa")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};