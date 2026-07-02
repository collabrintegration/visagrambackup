import nodemailer from "nodemailer";
import { logger } from "./logger";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "collabrintegration@gmail.com";
const GMAIL_USER = process.env.GMAIL_USER ?? ADMIN_EMAIL;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD ?? "";
const APP_URL = process.env.APP_URL ?? `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;

function createTransport() {
  if (!GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

async function send(opts: { to: string; subject: string; html: string }) {
  const transport = createTransport();
  if (!transport) {
    logger.warn("Email not configured — skipping send (set GMAIL_APP_PASSWORD)");
    return;
  }
  try {
    await transport.sendMail({ from: `"Visafy Support" <${GMAIL_USER}>`, ...opts });
  } catch (err) {
    logger.error({ err }, "Failed to send email");
  }
}

export async function sendNewCaseAlert(opts: {
  caseId: number;
  subject: string;
  body: string;
  userEmail: string;
  userName: string;
}) {
  const caseUrl = `${APP_URL}/support/cases/${opts.caseId}`;
  await send({
    to: ADMIN_EMAIL,
    subject: `[Visafy Support] New case #${opts.caseId}: ${opts.subject}`,
    html: `
      <h2>New Support Case #${opts.caseId}</h2>
      <p><strong>From:</strong> ${opts.userName} (${opts.userEmail})</p>
      <p><strong>Subject:</strong> ${opts.subject}</p>
      <hr/>
      <p>${opts.body.replace(/\n/g, "<br/>")}</p>
      <hr/>
      <p><a href="${caseUrl}" style="background:#7c1a3a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reply in Visafy →</a></p>
      <p style="color:#888;font-size:12px;">Log in as admin at Visafy and reply from the case page.</p>
    `,
  });
}

export async function sendCaseUpdate(opts: {
  caseId: number;
  subject: string;
  comment: string;
  toEmail: string;
  toName: string;
  newStatus?: string;
}) {
  const caseUrl = `${APP_URL}/support/cases/${opts.caseId}`;
  const statusLine = opts.newStatus ? `<p><strong>Status updated to:</strong> ${opts.newStatus}</p>` : "";
  await send({
    to: opts.toEmail,
    subject: `[Visafy Support] Reply on case #${opts.caseId}: ${opts.subject}`,
    html: `
      <h2>New reply on your support case #${opts.caseId}</h2>
      <p><strong>Subject:</strong> ${opts.subject}</p>
      ${statusLine}
      <hr/>
      <p>${opts.comment.replace(/\n/g, "<br/>")}</p>
      <hr/>
      <p><a href="${caseUrl}" style="background:#7c1a3a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View your case →</a></p>
    `,
  });
}
