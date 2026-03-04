const { supabaseAdmin } = require("../config/supabaseClient");
const transporter = require("../config/email");

/* ================= CREATE TICKET ================= */

exports.createTicket = async (req, res) => {

  try {

    const { eventId, ticketCode } = req.body;

    const userId = req.user.id;
    const email = req.user.email;

    if (!eventId || !ticketCode) {
      return res.status(400).json({ message: "Missing data" });
    }

    /* 1️⃣ Check event exists */

    const { data: event, error: eventError } =
      await supabaseAdmin
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (eventError || !event) {
      return res.status(404).json({ message: "Event not found" });
    }

    /* 2️⃣ Create ticket if not exists */

    const { data: existingTicket } =
      await supabaseAdmin
        .from("tickets")
        .select("id")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .maybeSingle();

    if (!existingTicket) {

      const { error: ticketError } =
        await supabaseAdmin
          .from("tickets")
          .insert({
            user_id: userId,
            event_id: eventId,
            ticket_code: ticketCode,
            status: "paid"
          });

      if (ticketError) {
        return res.status(400).json({ message: ticketError.message });
      }
    }

    /* 3️⃣ Ensure registration exists */

    const { data: existingRegistration } =
      await supabaseAdmin
        .from("registrations")
        .select("id")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .maybeSingle();

    if (!existingRegistration) {

      const { error: regError } =
        await supabaseAdmin
          .from("registrations")
          .insert({
            user_id: userId,
            event_id: eventId,
            name: "Paid User",
            email,
            phone: "0000000000"
          });

      if (regError) {
        return res.status(400).json({ message: regError.message });
      }
    }

    /* 4️⃣ SEND CONFIRMATION EMAIL */

    try {

      await transporter.sendMail({
        from: `"Event Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🎟 Ticket Confirmed - ${event.title}`,
        html: `
          <div style="font-family:Arial;padding:20px">
            
            <h2>🎉 Payment Successful!</h2>

            <p>Hello,</p>

            <p>Your ticket for the following event is confirmed:</p>

            <div style="background:#f3f4f6;padding:15px;border-radius:8px">

              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.date).toDateString()}</p>
              <p><strong>Category:</strong> ${event.category}</p>
              <p><strong>Location:</strong> ${event.location || "Online"}</p>
              <p><strong>Ticket Code:</strong> ${ticketCode}</p>

            </div>

            <p style="margin-top:15px">
              We look forward to seeing you!
            </p>

            <p style="margin-top:20px;font-size:12px;color:gray">
              This is an automated email. Please do not reply.
            </p>

          </div>
        `
      });

      console.log("✅ Ticket email sent");

    } catch (mailError) {

      console.error("❌ EMAIL ERROR:", mailError);
      // Don't stop API if email fails

    }

    res.json({ message: "Ticket + Registration confirmed" });

  } catch (err) {

    console.log("Ticket creation error:", err);

    res.status(500).json({ message: "Ticket creation failed" });

  }
};