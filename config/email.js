const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify mail connection
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Mail server error:", error);
  } else {
    console.log("✅ Mail server ready");
  }
});

module.exports = transporter;