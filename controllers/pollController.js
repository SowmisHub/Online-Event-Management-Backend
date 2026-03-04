const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= ADMIN POLLS ================= */

// Get all polls
exports.getPolls = async (req, res) => {
  try {
    const search = req.query.search || "";

    const { data: polls, error } = await supabaseAdmin
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

    res.json(polls || []);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch polls" });
  }
};


// Create poll
exports.createPoll = async (req, res) => {
  try {
    const { event_id, question, options } = req.body;

    if (!event_id || !question || !options || options.length < 2) {
      return res.status(400).json({ message: "Minimum 2 options required" });
    }

    const { data: poll, error } = await supabaseAdmin
      .from("polls")
      .insert({
        event_id,
        question,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    const optionRows = options.map(opt => ({
      poll_id: poll.id,
      option_text: opt
    }));

    await supabaseAdmin.from("poll_options").insert(optionRows);

    res.json({ message: "Poll created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Create failed" });
  }
};


// Update poll
exports.updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_id, question, options } = req.body;

    await supabaseAdmin
      .from("polls")
      .update({ event_id, question })
      .eq("id", id);

    await supabaseAdmin
      .from("poll_options")
      .delete()
      .eq("poll_id", id);

    const optionRows = options.map(opt => ({
      poll_id: id,
      option_text: opt
    }));

    await supabaseAdmin.from("poll_options").insert(optionRows);

    res.json({ message: "Poll updated successfully" });

  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};


// Delete poll
exports.deletePoll = async (req, res) => {
  try {
    const { id } = req.params;

    await supabaseAdmin.from("poll_votes").delete().eq("poll_id", id);
    await supabaseAdmin.from("poll_options").delete().eq("poll_id", id);
    await supabaseAdmin.from("polls").delete().eq("id", id);

    res.json({ message: "Poll deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};


/* ================= VOTE ON POLL ================= */

exports.votePoll = async (req, res) => {
  try {

    const { pollId, optionId } = req.body;
    const userId = req.user.id;

    await supabaseAdmin
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", userId);

    const { error } = await supabaseAdmin
      .from("poll_votes")
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Vote recorded" });

  } catch (err) {
    res.status(500).json({ message: "Vote failed" });
  }
};