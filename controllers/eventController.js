const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= GET EVENTS ================= */

exports.getEvents = async (req, res) => {

  const { data, error } =
    await supabaseAdmin
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

  if (error)
    return res.status(400).json({ message: error.message });

  res.json(data);

};


/* ================= GET SINGLE EVENT ================= */

exports.getSingleEvent = async (req, res) => {

  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json(data);

};