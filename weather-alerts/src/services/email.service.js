// Email service - sends alert emails via Nodemailer
const nodemailer = require("nodemailer");

// Configure transporter using environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send a single email notification
async function sendEmail({ to, subject, body }) {
  const mailOptions = {
    from: `"PlantPal 🌿" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    throw err;
  }
}

module.exports = { sendEmail };