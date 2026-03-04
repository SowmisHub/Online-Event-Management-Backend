const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= USER DASHBOARD ================= */

exports.userDashboard = async (req, res) => {
  try {

    const userId = req.user.id;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name, role, bio")
      .eq("id", userId)
      .single();

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: myRegistrations } = await supabaseAdmin
      .from("registrations")
      .select("event_id")
      .eq("user_id", userId);

    const registeredIds = (myRegistrations || []).map(r => r.event_id);

    const eventsWithFlag = (events || []).map(event => ({
      ...event,
      registered: registeredIds.includes(event.id)
    }));

    const myEvents = (events || []).filter(event =>
      registeredIds.includes(event.id)
    );

    /* ======== SESSIONS WITH SPEAKER NAME ======== */

    let sessions = [];

    if (registeredIds.length > 0) {

      const { data: sessionData } = await supabaseAdmin
        .from("sessions")
        .select("*")
        .in("event_id", registeredIds)
        .order("start_time", { ascending: true });

      if (sessionData && sessionData.length > 0) {

        const speakerIds = [
          ...new Set(sessionData.map(s => s.speaker_id).filter(Boolean))
        ];

        const { data: speakers } = await supabaseAdmin
          .from("profiles")
          .select("id, name")
          .in("id", speakerIds);

        sessions = sessionData.map(session => {

          const speaker =
            speakers?.find(s => s.id === session.speaker_id);

          return {
            ...session,
            event_title: events?.find(e => e.id === session.event_id)?.title,
            speaker_name: speaker?.name || null
          };

        });
      }
    }

    /* ======== POLLS ======== */

    let polls = [];

    if (registeredIds.length > 0) {

      const { data: pollData } = await supabaseAdmin
        .from("polls")
        .select(`
          id,
          question,
          event_id,
          events(title),
          poll_options (
            id,
            option_text
          )
        `)
        .in("event_id", registeredIds);

      for (let poll of pollData || []) {

        const { data: votes } = await supabaseAdmin
          .from("poll_votes")
          .select("option_id")
          .eq("poll_id", poll.id);

        const voteCountMap = {};

        votes?.forEach(v => {

          voteCountMap[v.option_id] =
            (voteCountMap[v.option_id] || 0) + 1;

        });

        polls.push({
          ...poll,
          event_title: poll.events?.title,
          options: poll.poll_options.map(opt => ({
            ...opt,
            votes: voteCountMap[opt.id] || 0
          })),
          totalVotes: votes?.length || 0
        });

      }
    }

    const { data: announcements } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    res.json({
      events: eventsWithFlag || [],
      myEvents: myEvents || [],
      announcements: announcements || [],
      sessions: sessions || [],
      polls: polls || []
    });

  } catch (err) {

    console.error("User dashboard error:", err);

    res.status(500).json({ message: "Dashboard error" });

  }
};


/* ================= ADMIN DASHBOARD ================= */

exports.adminDashboard = async (req, res) => {
  try {

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    const { count: registrationCount } = await supabaseAdmin
      .from("registrations")
      .select("*", { count: "exact", head: true });

    const { count: announcementCount } = await supabaseAdmin
      .from("announcements")
      .select("*", { count: "exact", head: true });

    const { count: pollCount } = await supabaseAdmin
      .from("polls")
      .select("*", { count: "exact", head: true });

    const { data: announcements } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    res.json({
      totalEvents: events?.length || 0,
      totalRegistrations: registrationCount || 0,
      totalAnnouncements: announcementCount || 0,
      totalPolls: pollCount || 0,
      events: events || [],
      announcements: announcements || []
    });

  } catch (err) {

    res.status(500).json({ message: "Admin dashboard error" });

  }
};