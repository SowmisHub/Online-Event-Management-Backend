const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= SPEAKER DASHBOARD ================= */

exports.getSpeakerDashboard = async (req, res) => {

  try {

    const userId = req.user.id;

    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select(`
        id,
        title,
        start_time,
        end_time,
        meeting_url,
        event_id,
        events(title)
      `)
      .eq("speaker_id", userId)
      .order("start_time", { ascending: true });

    if (sessionError) {
      return res.status(400).json({ message: sessionError.message });
    }

    const formattedSessions = sessions?.map(s => ({
      ...s,
      event_title: s.events?.title || "Event"
    })) || [];

    const { data: announcements } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();

    res.json({
      sessions: formattedSessions,
      announcements: announcements || [],
      profile: profile || {}
    });

  } catch (err) {

    res.status(500).json({ message: "Speaker dashboard error" });

  }

};



/* ================= UPDATE MEETING URL ================= */

exports.updateMeetingURL = async (req, res) => {

  try {

    const { id } = req.params;
    const { meeting_url } = req.body;

    console.log("Updating session:", id);
    console.log("URL:", meeting_url);

    if (!meeting_url) {
      return res.status(400).json({ message: "Meeting URL required" });
    }

    const { data, error } = await supabaseAdmin
      .from("sessions")
      .update({ meeting_url })
      .eq("id", id)
      .eq("speaker_id", req.user.id)
      .select();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Session not found or not authorized"
      });
    }

    res.json({ message: "Meeting URL updated successfully" });

  } catch (err) {

    res.status(500).json({ message: "Update failed" });

  }

};



/* ================= SPEAKER POLLS ================= */

exports.getSpeakerPolls = async (req, res) => {

  try {

    const search = req.query.search || "";

    const { data, error } = await supabaseAdmin
      .from("polls")
      .select(`
        id,
        question,
        event_id,
        events(title),
        poll_options(
          id,
          option_text,
          poll_votes(id)
        )
      `)
      .ilike("question", `%${search}%`)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(data || []);

  } catch (err) {

    res.status(500).json({ message: "Failed to fetch polls" });

  }

};