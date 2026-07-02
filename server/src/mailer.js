import nodemailer from "nodemailer";

// Configure with one env var, e.g. a Gmail app password:
//   SMTP_URL=smtps://you%40gmail.com:app-password@smtp.gmail.com:465
// (any provider works: SendGrid, Resend, Mailgun, etc. all expose SMTP)
const SMTP_URL = process.env.SMTP_URL || "";
export const reportEmail = process.env.REPORT_EMAIL || "nawmankipkorir@gmail.com";
const FROM = process.env.MAIL_FROM || "Mbuzis Daily <no-reply@mbuzisdaily.app>";

let transporter = null;
if (SMTP_URL) {
  try {
    transporter = nodemailer.createTransport(SMTP_URL);
    console.log(`✉️  email delivery ON → ${reportEmail}`);
  } catch (e) {
    console.error("mailer init failed:", e.message);
  }
} else {
  console.log("✉️  email delivery OFF (set SMTP_URL to enable) — events still logged & shown in the dashboard");
}

export const emailEnabled = () => !!transporter;

export async function sendMail(subject, html) {
  if (!transporter) {
    console.log(`[email:disabled] would send "${subject}" to ${reportEmail}`);
    return { sent: false, reason: "not-configured" };
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to: reportEmail, subject, html });
    const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    console.log(`[email:sent] "${subject}" → ${reportEmail}${preview ? " preview:" + preview : ""}`);
    return { sent: true, id: info.messageId, preview: preview || null };
  } catch (e) {
    console.error(`[email:error] ${e.message}`);
    return { sent: false, error: e.message };
  }
}

const wrap = (title, body) => `
  <div style="font-family:Inter,system-ui,sans-serif;background:#0B0806;color:#f4ece3;padding:24px;border-radius:16px;max-width:560px">
    <div style="font-size:20px;font-weight:800;letter-spacing:-.02em">Mbuzis <span style="color:#ff6a2b">Daily</span></div>
    <div style="height:1px;background:linear-gradient(90deg,#ff6a2b,#ffc24d);margin:12px 0 18px"></div>
    <h2 style="margin:0 0 12px;font-size:18px">${title}</h2>
    ${body}
    <p style="margin-top:20px;color:#8a7f74;font-size:12px">Automated notification from your Mbuzis Daily server.</p>
  </div>`;

export function joinEmailHtml(u, onlineCount) {
  return wrap(
    `👋 ${u.username} just joined the platform`,
    `<table style="font-size:14px;color:#cdbfb2">
       <tr><td style="padding:2px 12px 2px 0;color:#8a7f74">Username</td><td><b style="color:#f4ece3">${u.username}</b></td></tr>
       <tr><td style="padding:2px 12px 2px 0;color:#8a7f74">Role</td><td>${u.role}</td></tr>
       <tr><td style="padding:2px 12px 2px 0;color:#8a7f74">User ID</td><td>${u.id}</td></tr>
       <tr><td style="padding:2px 12px 2px 0;color:#8a7f74">Time</td><td>${new Date().toUTCString()}</td></tr>
       <tr><td style="padding:2px 12px 2px 0;color:#8a7f74">Now online</td><td>${onlineCount}</td></tr>
     </table>`
  );
}

export function digestHtml({ activity = [], modLogs = [], onlineCount = 0, liveRooms = 0 }) {
  const row = (a) =>
    `<tr>
       <td style="padding:6px 12px 6px 0;color:#8a7f74;white-space:nowrap">${new Date(a.at).toUTCString()}</td>
       <td style="padding:6px 0">${a.actor ? `<b style="color:#f4ece3">${a.actor}</b> ` : a.username ? `<b style="color:#f4ece3">${a.username}</b> ` : ""}${a.action || a.type || ""}${a.role ? ` (${a.role})` : ""}</td>
     </tr>`;
  const joins = activity.filter((a) => a.type === "join");
  const section = (title, rows) =>
    `<h3 style="margin:18px 0 6px;font-size:14px;color:#ffc24d">${title}</h3>
     <table style="width:100%;font-size:13px;color:#cdbfb2;border-collapse:collapse">${rows || `<tr><td style="color:#8a7f74">— none —</td></tr>`}</table>`;
  return wrap(
    "Session log digest",
    `<p style="font-size:13px;color:#8a7f74;margin:0 0 8px">${onlineCount} online · ${liveRooms} live rooms · ${joins.length} joins recorded</p>
     ${section("Who joined the platform", joins.slice(0, 40).map(row).join(""))}
     ${section("Moderation / session log", modLogs.slice(0, 60).map(row).join(""))}`
  );
}
