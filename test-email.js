import "dotenv/config";
import nodemailer from "nodemailer";

async function testEmail() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === "true";

  console.log("SMTP Config:", { host: smtpHost, port: smtpPort, user: smtpUser, secure: smtpSecure });

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified");

    const info = await transporter.sendMail({
      from: {
        name: "QRReview Test",
        address: smtpUser,
      },
      to: smtpUser, // Send to self for testing
      subject: "Test Complaint Email",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from QRReview.</p>
        <p>Rating: ★★★★★</p>
      `,
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

testEmail();
