const supabase = require("../config/supabaseClient");

exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all events
    const { data: events } = await supabase
      .from("events")
      .select("*");

    // Get user registrations
    const { data: registrations } = await supabase
      .from("registrations")
      .select("event_id")
      .eq("user_id", userId);

    const registeredIds = registrations.map(r => r.event_id);

    const eventsWithStatus = events.map(event => ({
      ...event,
      registered: registeredIds.includes(event.id)
    }));

    const myEvents = events.filter(e =>
      registeredIds.includes(e.id)
    );

    // Get announcements
    const { data: announcements } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    res.json({
      events: eventsWithStatus,
      myEvents,
      announcements
    });

  } catch (err) {
    res.status(500).json({ message: "Dashboard error" });
  }
};