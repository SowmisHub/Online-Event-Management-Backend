const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= USER SUBMIT FEEDBACK ================= */

exports.submitFeedback = async (req, res) => {

  try {

    const {
      event_id,
      overall,
      content,
      speaker,
      comment
    } = req.body;

    if (!event_id || !overall || !content || !speaker) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    const { error } = await supabaseAdmin
      .from("feedback")
      .insert({
        user_id: req.user.id,
        event_id,
        overall_rating: overall,
        content_rating: content,
        speaker_rating: speaker,
        comment: comment || null
      });

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    res.json({
      message: "Feedback submitted successfully"
    });

  } catch (err) {

    console.log("Feedback error:", err);

    res.status(500).json({
      message: "Feedback submission failed"
    });

  }

};


/* ================= ADMIN FETCH FEEDBACK ================= */

exports.getFeedback = async (req, res) => {

  try {

    const { eventId } = req.query;

    let query = supabaseAdmin
      .from("feedback")
      .select(`
        *,
        events(title),
        profiles(name)
      `)
      .order("created_at", { ascending: false });

    if (eventId && eventId !== "all") {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    res.json(data || []);

  } catch (err) {

    console.log("Admin feedback fetch error:", err);

    res.status(500).json({
      message: "Failed to fetch feedback"
    });

  }

};