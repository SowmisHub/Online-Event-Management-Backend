require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const pollRoutes = require("./routes/pollRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const qaRoutes = require("./routes/qaRoutes");
const speakerRoutes = require("./routes/speakerRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const chatRoutes = require("./routes/chatRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

app.use(cors());
app.use(express.json());

/* ================= AUTH ================= */
app.use("/api/auth", authRoutes);

/* ================= EVENTS ================= */
app.use("/api/events", eventRoutes);

/* ================= ADMIN ================= */
app.use("/api/admin", adminRoutes);
app.use("/api/admin", sessionRoutes);
app.use("/api/admin/announcements", announcementRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/chat", chatRoutes);

/* 🔥 FIXED FEEDBACK ROUTE */
app.use("/api/admin/feedback", feedbackRoutes);

/* ================= DASHBOARD ================= */
app.use("/api/dashboard", dashboardRoutes);

/* ================= PROFILE ================= */
app.use("/api/profile", profileRoutes);

/* ================= REGISTRATION ================= */
app.use("/api/register", registrationRoutes);

/* ================= TICKETS ================= */
app.use("/api/tickets", ticketRoutes);

/* ================= POLLS ================= */
app.use("/api/admin", pollRoutes);

/* ================= QA ================= */
app.use("/api/qa", qaRoutes);

/* ================= SPEAKER ================= */
app.use("/api/speaker", speakerRoutes);
app.use("/api/dashboard", speakerRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});