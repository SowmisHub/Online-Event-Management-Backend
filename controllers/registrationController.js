const { supabaseAdmin } = require("../config/supabaseClient");
const transporter = require("../config/email");

/* ================= REGISTER EVENT ================= */

exports.registerEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, phone } = req.body;

    const userId = req.user.id;
    const email = req.user.email;

    if (!name || !phone) {
      return res.status(400).json({ message: "All fields required" });
    }

    /* ================= CHECK ALREADY REGISTERED ================= */

    const { data: existing } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existing) {
      return res.json({ message: "Already registered" });
    }

    /* ================= INSERT REGISTRATION ================= */

    const { error } = await supabaseAdmin
      .from("registrations")
      .insert({
        user_id: userId,
        event_id: eventId,
        name,
        email,
        phone
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    /* ================= FETCH EVENT DETAILS ================= */

    const { data: event } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    /* ================= SEND EMAIL ================= */

    try {

      await transporter.sendMail({
        from: `"Event Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🎉 Registration Confirmed - ${event?.title || "Event"}`,
        html: `
          <div style="font-family: Arial; padding:20px">
            
            <h2>🎉 Registration Confirmed!</h2>

            <p>Hello <b>${name}</b>,</p>

            <p>You have successfully registered for:</p>

            <div style="background:#f3f4f6;padding:15px;border-radius:8px">
              <p><strong>Event:</strong> ${event?.title}</p>
              <p><strong>Date:</strong> ${event?.date ? new Date(event.date).toDateString() : ""}</p>
              <p><strong>Category:</strong> ${event?.category || ""}</p>
              <p><strong>Location:</strong> ${event?.location || "Online"}</p>
              <p><strong>Price:</strong> ${
                event?.price == 0 ? "Free" : `$${event?.price}`
              }</p>
            </div>

            <p style="margin-top:15px">
              We look forward to seeing you!
            </p>

            <p style="margin-top:20px;font-size:12px;color:gray">
              This is an automated email. Please do not reply.
            </p>

          </div>
        `,
      });

      console.log("✅ Registration email sent");

    } catch (mailError) {

      console.error("❌ EMAIL ERROR:", mailError);

      // Don't break registration if email fails
    }

    res.json({ message: "Registered successfully" });

  } catch (err) {

    console.log("Registration error:", err);

    res.status(500).json({ message: "Registration failed" });

  }
};



/* ================= DELETE REGISTRATION ================= */

exports.deleteRegistration = async (req, res) => {
  try {

    const { eventId } = req.params;
    const userId = req.user.id;

    const { data: existing } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const { error } = await supabaseAdmin
      .from("registrations")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    await supabaseAdmin
      .from("tickets")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    res.json({
      message: "Registration cancelled and ticket invalidated successfully"
    });

  } catch (err) {

    console.log("Delete registration error:", err);

    res.status(500).json({ message: "Delete failed" });

  }
};