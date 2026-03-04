const { supabaseAdmin } = require("../config/supabaseClient");

/* =========================================================
   ADMIN ADVANCED ANALYTICS
   ========================================================= */

exports.getAnalytics = async (req, res) => {
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

    const monthlyTrend = Object.entries(monthlyMap)
      .map(([month, value]) => ({ month, value }));

    /* ===== CATEGORY DISTRIBUTION ===== */

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("category");

    const categoryMap = {};

    events?.forEach(e => {

      const cat = e.category || "Other";

      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

    });

    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }));

    /* ===== FEEDBACK BREAKDOWN ===== */

    const { data: feedback } = await supabaseAdmin
      .from("feedback")
      .select("overall_rating");

    const ratingMap = { 1:0,2:0,3:0,4:0,5:0 };

    feedback?.forEach(f => {

      ratingMap[f.overall_rating]++;

    });

    const ratingData = Object.entries(ratingMap)
      .map(([name, value]) => ({ name, value }));

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
};