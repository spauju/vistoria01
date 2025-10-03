import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Get SMTP credentials from Firebase environment configuration
// You need to set these using the Firebase CLI:
// firebase functions:config:set smtp.user="your-email@hotmail.com"
// firebase functions:config:set smtp.pass="your-app-password"
const smtpUser = functions.config().smtp.user;
const smtpPass = functions.config().smtp.pass;

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "hotmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

/**
 * Cloud Function to send an email when a new document is created in the 'mail' collection.
 */
export const sendEmailOnDocCreate = functions
  .region("southamerica-east1") // Deploy to the same region as your Firestore DB
  .firestore.document("mail/{mailId}")
  .onCreate(async (snap, context) => {
    const mailData = snap.data();

    // The 'to', 'message.subject', and 'message.html' fields are expected in the document.
    const mailOptions = {
      from: `CanaControl <${smtpUser}>`,
      to: mailData.to,
      subject: mailData.message.subject,
      html: mailData.message.html,
    };

    try {
      await transporter.sendMail(mailOptions);
      functions.logger.log("Email sent successfully to:", mailData.to);
      // Optionally, you can update the document to mark it as sent.
      return snap.ref.update({ "delivery.state": "SUCCESS" });
    } catch (error) {
      functions.logger.error("Error sending email:", error);
      // Update the document to mark it as failed.
      return snap.ref.update({
        "delivery.state": "ERROR",
        "delivery.error": (error as Error).message,
      });
    }
  });

    