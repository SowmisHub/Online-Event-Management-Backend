const { supabaseAdmin } = require("../config/supabaseClient");

/* ================= ADMIN CREATE EVENT ================= */

exports.createEvent = async (req, res) => {
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
};


/* ================= ADMIN DELETE EVENT ================= */

exports.deleteEvent = async (req, res) => {
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
};


/* ================= ADMIN UPDATE EVENT ================= */

exports.updateEvent = async (req, res) => {
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
};


/* ================= ADMIN GET USERS ================= */

exports.getUsers = async (req, res) => {

  try {

    const search = req.query.search || "";

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, approved")
      .ilike("name", `%${search}%`);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

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

    const formatted = profiles.map(profile => {

      const authUser =
        authUsers.find(user => user.id === profile.id);

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

};


/* ================= GET NON SPEAKER USERS ================= */

exports.getUsersForSpeaker = async (req, res) => {

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

};


/* ================= ASSIGN SPEAKER ROLE ================= */

exports.makeSpeaker = async (req, res) => {

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

};


/* ================= REMOVE SPEAKER ROLE ================= */

exports.removeSpeaker = async (req, res) => {

  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: "attendee" })
    .eq("id", id);

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Speaker role removed" });

};