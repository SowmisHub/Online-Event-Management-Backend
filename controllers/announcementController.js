const { supabaseAdmin } = require("../config/supabaseClient");

/* GET ANNOUNCEMENTS */

exports.getAnnouncements = async (req, res) => {

  const { data } =
    await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

  res.json(data || []);

};


/* CREATE ANNOUNCEMENT */

exports.createAnnouncement = async (req, res) => {

  const { title, content, type } = req.body;

  const { error } =
    await supabaseAdmin
      .from("announcements")
      .insert({ title, content, type });

  if (error)
    return res.status(400).json({ message: error.message });

  res.json({ message: "Created" });

};


/* UPDATE ANNOUNCEMENT */

exports.updateAnnouncement = async (req, res) => {

  const { id } = req.params;

  const { error } =
    await supabaseAdmin
      .from("announcements")
      .update(req.body)
      .eq("id", id);

  if (error)
    return res.status(400).json({ message: error.message });

  res.json({ message: "Updated" });

};


/* DELETE ANNOUNCEMENT */

exports.deleteAnnouncement = async (req, res) => {

  const { id } = req.params;

  const { error } =
    await supabaseAdmin
      .from("announcements")
      .delete()
      .eq("id", id);

  if (error)
    return res.status(400).json({ message: error.message });

  res.json({ message: "Deleted" });

};