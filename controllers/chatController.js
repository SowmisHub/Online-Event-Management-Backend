const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= ADMIN DELETE CHAT MESSAGE ================= */

exports.deleteMessage = async (req, res) => {

  try {

    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("chats")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Message deleted successfully" });

  } catch (err) {

    res.status(500).json({ message: "Delete failed" });

  }

};


/* ================= ADMIN CLEAR EVENT CHAT ================= */

exports.clearEventChat = async (req, res) => {

  try {

    const { eventId } = req.params;

    await supabaseAdmin
      .from("chats")
      .delete()
      .eq("event_id", eventId);

    res.json({ message: "Chat cleared successfully" });

  } catch (err) {

    res.status(500).json({ message: "Clear failed" });

  }

};