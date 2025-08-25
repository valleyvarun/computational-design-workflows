/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const {defineSecret} = require("firebase-functions/params");
const sgMail = require("@sendgrid/mail");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// -----------------------------------------------------------------------------
// Example starter function (commented out):
// -----------------------------------------------------------------------------
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   response.send("Hello from Firebase!");
// });

// -----------------------------------------------------------------------------
// Custom Cloud Function: sendSurveyEmail
// Uses SendGrid to send an email (with optional PDF attachment).
// -----------------------------------------------------------------------------
// Params/Secrets (v2 compatible)
const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const MAIL_FROM = defineSecret("MAIL_FROM");

/**
 * HTTP handler for sending survey email via SendGrid.
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @return {Promise<void>}
 */
async function sendSurveyEmailHandler(req, res) {
  // Basic CORS setup
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ok: false, error: "Method not allowed"});
  }

  try {
    const {to, subject, text, html, pdfDataUrl} = req.body || {};

    if (!to || !(text || html)) {
      return res.status(400).json({ok: false, error: "Missing 'to' or body"});
    }

    // Load config from v2 params/secrets or environment
    const SENDGRID_KEY = SENDGRID_API_KEY.value() ||
      process.env.SENDGRID_API_KEY;
    const FROM_EMAIL = MAIL_FROM.value() || process.env.MAIL_FROM;

    if (!SENDGRID_KEY || !FROM_EMAIL) {
      return res.status(500).json({
        ok: false,
        error: "Missing required config",
        details: "Set SENDGRID_API_KEY secret and MAIL_FROM param/env",
      });
    }

    sgMail.setApiKey(SENDGRID_KEY);

    const msg = {
      to,
      from: FROM_EMAIL,
      subject: subject || "Your submission",
      text: text || undefined,
      html: html || undefined,
    };

    // Set reply-to if provided by client
    if (req.body && req.body.replyTo) {
      msg.replyTo = req.body.replyTo;
    }

    // Attach PDF if provided
    if (pdfDataUrl) {
      const base64 = pdfDataUrl.split(",")[1];
      msg.attachments = [
        {
          content: base64,
          filename: "submission.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ];
    }

    try {
      await sgMail.send(msg);
      return res.json({ok: true});
    } catch (e) {
      const sgDetails = (e && e.response && e.response.body) ?
        e.response.body :
        null;
      const errMessage = (e && e.message) ? e.message : String(e);
      console.error("SendGrid send failed", e, sgDetails);
      return res.status(500).json({
        ok: false,
        error: errMessage,
        details: sgDetails,
      });
    }
  } catch (err) {
    console.error("sendSurveyEmail failed", err);
    const errMessage = (err && err.message) ? err.message : String(err);
    return res.status(500).json({ok: false, error: errMessage});
  }
}

exports.sendSurveyEmail = onRequest(
    {secrets: [SENDGRID_API_KEY, MAIL_FROM]},
    sendSurveyEmailHandler,
);
