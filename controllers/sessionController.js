const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= ASSIGN SESSION ================= */

exports.assignSession = async (req, res) => {
  try {

    const {
      event_id,
      speaker_id,
      title,
      description,
      type,
      location,
      meeting_url,
      start_time,
      end_time
    } = req.body;

    if (!event_id || !speaker_id || !title || !start_time || !end_time) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { error } = await supabaseAdmin
      .from("sessions")
      .insert({
        event_id,
        speaker_id,
        title,
        description,
        type,
        room_name: location || "Virtual",
        meeting_url: meeting_url || null,
        start_time,
        end_time
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Session assigned successfully" });

  } catch (err) {
    res.status(500).json({ message: "Session assignment failed" });
  }
};


/* ================= GET SPEAKERS ================= */

exports.getSpeakers = async (req, res) => {
  try {

    const search = req.query.search || "";

    const { data: speakers, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role")
      .eq("role", "speaker")
      .ilike("name", `%${search}%`)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ message: error.message });

    const formatted = [];

    for (let sp of speakers || []) {

      const { count } = await supabaseAdmin
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("speaker_id", sp.id);

      formatted.push({
        ...sp,
        session_count: count ?? 0
      });
    }

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch speakers" });
  }
};


/* ================= GET SPEAKER SESSIONS ================= */

exports.getSpeakerSessions = async (req, res) => {

  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select(`
      id,
      title,
      type,
      start_time,
      end_time,
      meeting_url,
      event_id,
      events(title)
    `)
    .eq("speaker_id", id)
    .order("start_time", { ascending: true });

  if (error) return res.status(400).json({ message: error.message });

  res.json(data || []);
};


/* ================= DELETE SESSION ================= */

exports.deleteSession = async (req, res) => {

  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("sessions")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Session deleted" });
};


/* ================= UPDATE SESSION ================= */

exports.updateSession = async (req, res) => {

  const { id } = req.params;

  const {
    event_id,
    speaker_id,
    title,
    description,
    type,
    location,
    meeting_url,
    start_time,
    end_time
  } = req.body;

  const { error } = await supabaseAdmin
    .from("sessions")
    .update({
      event_id,
      speaker_id,
      title,
      description,
      type,
      room_name: location,
      meeting_url,
      start_time,
      end_time
    })
    .eq("id", id);

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Session updated successfully" });
};


/* ================= GET ALL SESSIONS ================= */

exports.getAllSessions = async (req, res) => {
  try {

    const { data: sessions, error } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) return res.status(400).json({ message: error.message });

    if (!sessions || sessions.length === 0) {
      return res.json([]);
    }

    const eventIds = [...new Set(sessions.map(s => s.event_id))];
    const speakerIds = [...new Set(sessions.map(s => s.speaker_id).filter(Boolean))];

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("id, title")
      .in("id", eventIds);

    const { data: speakers } = await supabaseAdmin
      .from("profiles")
      .select("id, name")
      .in("id", speakerIds);

    const formatted = sessions.map(s => ({
      ...s,
      event_title: events?.find(e => e.id === s.event_id)?.title || null,
      speaker_name: speakers?.find(sp => sp.id === s.speaker_id)?.name || null
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};