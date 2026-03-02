require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

/* ================= EMAIL CONFIG ================= */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify mail server connection
transporter.verify(function (error, success) {
  if (error) {
    console.log("❌ Mail server error:", error);
  } else {
    console.log("✅ Mail server ready");
  }
});

const app = express();
app.use(cors());
app.use(express.json());

/* ================= SUPABASE CLIENT ================= */

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* ================= AUTH MIDDLEWARE ================= */

const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { data, error } =
      await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = data.user;
    next();

  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
/* ================= ADMIN MIDDLEWARE ================= */

const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile || profile.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();

  } catch (err) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

/* ================= SIGNUP ================= */

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (error) return res.status(400).json({ message: error.message });

    const userId = data.user.id;

    await supabaseAdmin.from("profiles").insert({
      id: userId,
      name,
      role,
      approved: role === "speaker" ? false : true,
    });

    res.json({ message: "Account created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LOGIN ================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } =
      await supabasePublic.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

    if (profileError) {
      return res.status(400).json({ message: "Profile not found" });
    }

    res.json({
      token: data.session.access_token,
      role: profile.role,
      approved: profile.approved,
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= GET PROFILE ================= */

app.get("/api/profile", verifyUser, async (req, res) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role, approved")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(400).json({ message: "Profile not found" });
    }

    res.json(profile);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

/* ================= GET EVENTS ================= */

app.get("/api/events", async (req, res) => {
  const { data, error } =
    await supabaseAdmin
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ message: error.message });

  res.json(data);
});

/* ================= GET SINGLE EVENT ================= */

app.get("/api/events/:id", async (req, res) => {
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
});


/* ================= ADMIN CREATE EVENT ================= */

app.post("/api/admin/events", verifyUser, verifyAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      date,
      end_date,
      price,
      image_url,
      speaker_id
    } = req.body;

    const { error } = await supabaseAdmin
      .from("events")
      .insert({
        title,
        description,
        category,
        location,
        date,
        end_date,
        price,
        image_url,
        speaker_id
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Event created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Create event failed" });
  }
});


/* ================= ADMIN DELETE EVENT ================= */

app.delete("/api/admin/events/:id", verifyUser, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Event deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

/* ================= ADMIN UPDATE EVENT ================= */

app.put("/api/admin/events/:id", verifyUser, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      category,
      location,
      date,
      end_date,
      price,
      image_url,
      speaker_id
    } = req.body;

    const { error } = await supabaseAdmin
      .from("events")
      .update({
        title,
        description,
        category,
        location,
        date,
        end_date,
        price,
        image_url,
        speaker_id
      })
      .eq("id", id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Event updated successfully" });

  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});


/* ================= ADMIN GET USERS ================= */

app.get("/api/admin/users", verifyUser, verifyAdmin, async (req, res) => {
  try {
    const search = req.query.search || "";

    // 1️⃣ Fetch profiles
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, approved")
      .ilike("name", `%${search}%`);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // 2️⃣ Fetch ALL auth users properly
    const { data: usersData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });

    if (authError) {
      console.log("Auth fetch error:", authError);
      return res.status(500).json({ message: "Auth fetch failed" });
    }

    const authUsers = usersData.users;

    // 3️⃣ Merge profiles + auth users
    const formatted = profiles.map(profile => {
      const authUser = authUsers.find(
        user => user.id === profile.id
      );

      return {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        approved: profile.approved,
        email: authUser ? authUser.email : "",
        created_at: authUser ? authUser.created_at : null
      };
    });

    res.json(formatted);

  } catch (err) {
    console.log("Admin users error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ================= GET NON SPEAKER USERS ================= */

app.get("/api/admin/users-for-speaker", verifyUser, verifyAdmin, async (req, res) => {
  try {

    const search = req.query.search || "";

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role")
      .neq("role", "speaker")
      .ilike("name", `%${search}%`);

    if (error) return res.status(400).json({ message: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ================= ASSIGN SPEAKER ROLE ================= */

app.put("/api/admin/make-speaker/:id", verifyUser, verifyAdmin, async (req, res) => {
  try {

    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        role: "speaker",
        approved: true
      })
      .eq("id", id);

    if (error) return res.status(400).json({ message: error.message });

    res.json({ message: "User promoted to speaker" });

  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});


/* ================= ASSIGN SESSION ================= */

app.post("/api/admin/assign-session", verifyUser, verifyAdmin, async (req, res) => {
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
        speaker_id,   // IMPORTANT
        title,
        description,
        type,
        room_name: location || "Virtual",
        meeting_url: meeting_url || null,
        start_time,
        end_time
      });

    if (error) {
      console.log(error);
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Session assigned successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Session assignment failed" });
  }
});


/* ================= GET SPEAKERS WITH SESSION COUNT ================= */

app.get("/api/admin/speakers", verifyUser, verifyAdmin,async (req, res) => {
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
});

/* ================= GET SPEAKER SESSIONS ================= */

app.get("/api/admin/speaker-sessions/:id", verifyUser, verifyAdmin, async (req, res) => {
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
});


/* ================= DELETE SESSION ================= */

app.delete("/api/admin/delete-session/:id", verifyUser, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("sessions")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Session deleted" });
});


/* ================= UPDATE SESSION ================= */
app.put("/api/admin/update-session/:id", verifyUser, verifyAdmin, async (req, res) => {

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
});


/* ================= GET ALL SESSIONS (ADMIN PAGE) ================= */

app.get("/api/admin/all-sessions", verifyUser, verifyAdmin, async (req, res) => {
  try {

    const { data: sessions, error } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      console.log(error);
      return res.status(400).json({ message: error.message });
    }

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
    console.log(err);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
});
/* ================= REMOVE SPEAKER ROLE ================= */

app.put("/api/admin/remove-speaker/:id", verifyUser, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: "attendee" })
    .eq("id", id);

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Speaker role removed" });
});


/* ================= REGISTER ================= */

app.post("/api/register/:eventId", verifyUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, phone } = req.body;

    const userId = req.user.id;
    const email = req.user.email;

    if (!name || !phone) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check if already registered
    const { data: existing } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existing) {
      return res.json({ message: "Already registered" });
    }

    // Insert registration
    const { error } = await supabaseAdmin
      .from("registrations")
      .insert({
        user_id: userId,
        event_id: eventId,
        name,
        email,
        phone,
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Fetch event details
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    // 🔥 SEND EMAIL
    try {
      await transporter.sendMail({
        from: `"Event Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🎉 Registration Confirmed - ${event.title}`,
        html: `
          <div style="font-family: Arial; padding: 20px;">
            <h2>🎉 Registration Confirmed!</h2>
            <p>Hello ${name},</p>
            <p>You have successfully registered for:</p>

            <div style="background:#f3f4f6; padding:15px; border-radius:8px;">
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toDateString()}</p>
              <p><strong>Category:</strong> ${event.category}</p>
              <p><strong>Price:</strong> ${
                event.price == 0 ? "Free" : `$${event.price}`
              }</p>
            </div>

            <p style="margin-top:15px;">
              We look forward to seeing you!
            </p>

            <p style="margin-top:20px; font-size:12px; color:gray;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        `,
      });

      console.log("✅ Registration email sent");

    } catch (mailError) {
      console.error("❌ EMAIL ERROR:", mailError);
    }

    res.json({ message: "Registered successfully" });

  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ================= DELETE REGISTRATION ================= */

app.delete("/api/register/:eventId", verifyUser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Check if registration exists
    const { data: existingReg } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (!existingReg) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // 2️⃣ Delete registration
    const { error: regError } = await supabaseAdmin
      .from("registrations")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (regError) {
      return res.status(400).json({ message: regError.message });
    }

    // 3️⃣ Also delete ticket if it exists (for paid events)
    await supabaseAdmin
      .from("tickets")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    res.json({
      message: "Registration cancelled and ticket invalidated successfully"
    });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

/* ================= CREATE TICKET (MOCK PAYMENT) ================= */

app.post("/api/tickets", verifyUser, async (req, res) => {
  try {
    const { eventId, ticketCode } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!eventId || !ticketCode) {
      return res.status(400).json({ message: "Missing data" });
    }

    // 1️⃣ Check event exists
    const { data: event, error: eventError } =
      await supabaseAdmin
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (eventError || !event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 2️⃣ Create ticket if not exists
    const { data: existingTicket } =
      await supabaseAdmin
        .from("tickets")
        .select("id")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .maybeSingle();

    if (!existingTicket) {
      await supabaseAdmin
        .from("tickets")
        .insert({
          user_id: userId,
          event_id: eventId,
          ticket_code: ticketCode,
          status: "paid",
        });
    }

    // 3️⃣ ENSURE registration exists
    const { data: existingRegistration } =
      await supabaseAdmin
        .from("registrations")
        .select("id")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .maybeSingle();

    if (!existingRegistration) {
      await supabaseAdmin
        .from("registrations")
        .insert({
          user_id: userId,
          event_id: eventId,
          name: "Paid User",
          email,
          phone: "0000000000",
        });
    }

    res.json({ message: "Ticket + Registration confirmed" });

  } catch (err) {
    res.status(500).json({ message: "Ticket creation failed" });
  }
});


/* ================= USER DASHBOARD ================= */

app.get("/api/dashboard/user", verifyUser, async (req, res) => {
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
          const speaker = speakers?.find(s => s.id === session.speaker_id);

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
});


/* ================= ADMIN DASHBOARD ================= */

app.get("/api/dashboard/admin", verifyUser, verifyAdmin, async (req, res) => {
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
});

/* ================= ADMIN ANNOUNCEMENTS ================= */

app.get("/api/admin/announcements", verifyUser, verifyAdmin, async (req, res) => {
  const { data } = await supabaseAdmin
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  res.json(data || []);
});

app.post("/api/admin/announcements", verifyUser, verifyAdmin, async (req, res) => {
  const { title, content, type } = req.body;

  const { error } = await supabaseAdmin
    .from("announcements")
    .insert({ title, content, type });

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Created" });
});

app.put("/api/admin/announcements/:id", verifyUser, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("announcements")
    .update(req.body)
    .eq("id", id);

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Updated" });
});

app.delete("/api/admin/announcements/:id", verifyUser, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Deleted" });
});

/* ================= ADMIN POLLS ================= */
// Get all polls with options + votes + event title
app.get("/api/admin/polls", verifyUser, verifyAdmin, async (req, res) => {
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
});

// Create poll
app.post("/api/admin/polls", verifyUser, verifyAdmin, async (req, res) => {
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
});

// Update poll
app.put("/api/admin/polls/:id", verifyUser, verifyAdmin, async (req, res) => {
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
});

// Delete poll
app.delete("/api/admin/polls/:id", verifyUser, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await supabaseAdmin.from("poll_votes").delete().eq("poll_id", id);
    await supabaseAdmin.from("poll_options").delete().eq("poll_id", id);
    await supabaseAdmin.from("polls").delete().eq("id", id);

    res.json({ message: "Poll deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});
/* ================= FORGOT PASSWORD ================= */

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  const { error } =
    await supabasePublic.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.FRONTEND_URL + "/reset-password",
    });

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Password reset email sent" });
});

/* ================= VOTE ON POLL ================= */

app.post("/api/polls/vote", verifyUser, async (req, res) => {
  try {
    const { pollId, optionId } = req.body;
    const userId = req.user.id;

    // Remove previous vote if exists
    await supabaseAdmin
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", userId);

    // Insert new vote
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
});


/* =========================================================
   FEEDBACK ROUTES
   ========================================================= */


/* ================= USER SUBMIT FEEDBACK ================= */

app.post("/api/feedback", verifyUser, async (req, res) => {
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
});


/* ================= ADMIN FETCH FEEDBACK ================= */

app.get("/api/admin/feedback", verifyUser, verifyAdmin, async (req, res) => {
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
});

/* ================= SPEAKER DASHBOARD ================= */

app.get("/api/dashboard/speaker", verifyUser, async (req, res) => {
  try {

    const userId = req.user.id;

    // ✅ JOIN EVENTS TABLE
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

    // 🔥 FORMAT EVENT TITLE
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
});

/* ================= SPEAKER UPDATE MEETING URL ================= */

app.put("/api/speaker/update-meeting/:id", verifyUser, async (req, res) => {
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
      return res.status(404).json({ message: "Session not found or not authorized" });
    }

    res.json({ message: "Meeting URL updated successfully" });

  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

/* ================= SPEAKER POLLS ================= */

app.get("/api/speaker/polls", verifyUser, async (req, res) => {
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
});

/* ================= ADMIN DELETE CHAT MESSAGE ================= */

app.delete("/api/admin/chat/:id", verifyUser, verifyAdmin, async (req, res) => {
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
});

/* ================= ADMIN CLEAR EVENT CHAT ================= */

app.delete("/api/admin/chat/event/:eventId", verifyUser, verifyAdmin, async (req, res) => {
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
});

/* =========================================================
   Q&A ROUTES
   ========================================================= */

/* ================= GET ALL Q&A ================= */

app.get("/api/qa", verifyUser, async (req, res) => {
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
});


/* ================= CREATE Q&A (ADMIN & SPEAKER ONLY) ================= */

app.post("/api/qa", verifyUser, async (req, res) => {
  try {

    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check role
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
});

/* ================= DELETE Q&A ================= */

app.delete("/api/qa/:id", verifyUser, async (req, res) => {
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
});

/* =========================================================
   ADMIN ADVANCED ANALYTICS ROUTE (PRODUCTION STYLE)
   ========================================================= */

app.get("/api/admin/analytics", verifyUser, verifyAdmin, async (req, res) => {
  try {

    /* ===== BASIC COUNTS ===== */

    const { count: totalEvents } = await supabaseAdmin
      .from("events")
      .select("*", { count: "exact", head: true });

    const { count: totalRegistrations } = await supabaseAdmin
      .from("registrations")
      .select("*", { count: "exact", head: true });

    const { count: totalFeedback } = await supabaseAdmin
      .from("feedback")
      .select("*", { count: "exact", head: true });

    /* ===== REGISTRATIONS BY EVENT (TOP 6 ONLY) ===== */

    const { data: registrations } = await supabaseAdmin
      .from("registrations")
      .select("event_id, events(title), created_at");

    const eventMap = {};
    const monthlyMap = {};

    registrations?.forEach(r => {
      const title = r.events?.title || "Event";

      eventMap[title] = (eventMap[title] || 0) + 1;

      const month = new Date(r.created_at)
        .toLocaleString("default", { month: "short" });

      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });

    const topEvents = Object.entries(eventMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const monthlyTrend = Object.entries(monthlyMap).map(
      ([month, value]) => ({ month, value })
    );

    /* ===== CATEGORY DISTRIBUTION ===== */

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("category");

    const categoryMap = {};

    events?.forEach(e => {
      const cat = e.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categoryMap).map(
      ([name, value]) => ({ name, value })
    );

    /* ===== FEEDBACK BREAKDOWN ===== */

    const { data: feedback } = await supabaseAdmin
      .from("feedback")
      .select("overall_rating");

    const ratingMap = { 1:0,2:0,3:0,4:0,5:0 };

    feedback?.forEach(f => {
      ratingMap[f.overall_rating]++;
    });

    const ratingData = Object.entries(ratingMap).map(
      ([name, value]) => ({ name, value })
    );

    res.json({
      totalEvents: totalEvents || 0,
      totalRegistrations: totalRegistrations || 0,
      totalFeedback: totalFeedback || 0,
      topEvents,
      monthlyTrend,
      categoryData,
      ratingData
    });

  } catch (err) {
    res.status(500).json({ message: "Analytics failed" });
  }
});


/* ================= START SERVER ================= */

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
});