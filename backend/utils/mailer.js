const { Resend } = require('resend');

const SITE_URL = process.env.FRONTEND_URL || 'https://themessykitchen.online';
const LOGO = `${SITE_URL}/messy-logo.png`;
const FROM = 'Messy Kitchen <noreply@themessykitchen.online>';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set!');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function baseTemplate({ preheader = '', headerLabel = '', body = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>The Messy Kitchen</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f2f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">

  <!-- Brand header -->
  <tr><td align="center" style="padding-bottom:20px">
    <img src="${LOGO}" alt="The Messy Kitchen" width="68" height="68"
      style="display:block;border-radius:50%;border:3px solid #d1fae5;box-shadow:0 4px 16px rgba(5,150,105,0.30)"/>
    <p style="margin:10px 0 0;font-size:20px;font-weight:700;color:#111827">The Messy Kitchen</p>
    <p style="margin:3px 0 0;font-size:11px;color:#6b7280;letter-spacing:2px;text-transform:uppercase">${headerLabel}</p>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    ${body}
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:#f9fafb;padding:18px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        &copy; ${new Date().getFullYear()} <strong style="color:#059669">The Messy Kitchen</strong> &middot; All rights reserved
      </p>
      <p style="margin:5px 0 0;font-size:11px">
        <a href="${SITE_URL}" style="color:#059669;text-decoration:none">${SITE_URL.replace('https://', '')}</a>
      </p>
    </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Welcome email on new Google registration ──────────────────────────
async function sendWelcomeEmail(user) {
  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:32px;text-align:center">
      <p style="margin:0;font-size:32px">🎉</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3">Welcome to the Kitchen!</h1>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.82)">Your account has been created</p>
    </td></tr>
    <tr><td style="padding:28px 32px">
      <p style="margin:0 0 14px;font-size:15px;color:#111827">Hi <strong>${user.name}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.75">
        You've successfully registered at <strong>The Messy Kitchen</strong> using your Google account.
        Your account is currently <strong style="color:#d97706">pending approval</strong> by the admin.
        You'll receive another email once a decision is made.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef3c7;border-radius:12px;margin-bottom:22px">
      <tr><td style="padding:16px 20px">
        <p style="margin:0;font-size:13px;font-weight:600;color:#92400e">&#9203; Pending Approval</p>
        <p style="margin:5px 0 0;font-size:13px;color:#78350f;line-height:1.65">
          The admin will review your account shortly. You'll receive an email once a decision is made.
        </p>
      </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:12px;margin-bottom:24px">
      <tr><td style="padding:16px 20px">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Account Details</p>
        <p style="margin:0 0 5px;font-size:14px;color:#374151"><strong>Name:</strong> ${user.name}</p>
        <p style="margin:0;font-size:14px;color:#374151"><strong>Email:</strong> ${user.email}</p>
      </td></tr>
      </table>

      <div style="text-align:center">
        <a href="${SITE_URL}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:600">
          Visit The Messy Kitchen
        </a>
      </div>
    </td></tr>
    </table>`;

  const html = baseTemplate({ preheader: `Welcome ${user.name}! Your account is pending approval.`, headerLabel: 'Welcome', body });

  const resend = getResend();
  if (!resend) return;
  const { error } = await resend.emails.send({
    from: FROM,
    to: [user.email],
    subject: `🎉 Welcome to The Messy Kitchen, ${user.name}!`,
    html,
  });
  if (error) console.error('welcome email error:', JSON.stringify(error));
  else console.log(`welcome email sent to ${user.email}`);
}

// ── Approval / Rejection status email ────────────────────────────────
async function sendApprovalEmail(user, approved) {
  const body = approved ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:32px;text-align:center">
      <p style="margin:0;font-size:32px">&#10003;</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3">Account Approved!</h1>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.82)">You're now a member of The Messy Kitchen</p>
    </td></tr>
    <tr><td style="padding:28px 32px">
      <p style="margin:0 0 14px;font-size:15px;color:#111827">Hi <strong>${user.name}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.75">
        Great news! Your account has been <strong style="color:#059669">approved</strong> by the admin.
        You can now log in and access all your mess features.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#d1fae5;border-radius:12px;margin-bottom:22px">
      <tr><td style="padding:16px 20px">
        <p style="margin:0;font-size:13px;font-weight:600;color:#065f46">&#10003; Access Granted</p>
        <p style="margin:5px 0 0;font-size:13px;color:#047857;line-height:1.65">
          You can now view your meals, bills, payments, and more from your dashboard.
        </p>
      </td></tr>
      </table>

      <div style="text-align:center">
        <a href="${SITE_URL}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:14px;font-weight:600">
          Login Now &rarr;
        </a>
      </div>
    </td></tr>
    </table>`
  : `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:32px;text-align:center">
      <p style="margin:0;font-size:32px">&#10007;</p>
      <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3">Account Not Approved</h1>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.82)">Your registration was declined</p>
    </td></tr>
    <tr><td style="padding:28px 32px">
      <p style="margin:0 0 14px;font-size:15px;color:#111827">Hi <strong>${user.name}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.75">
        Unfortunately, your account registration at <strong>The Messy Kitchen</strong> has been
        <strong style="color:#dc2626">declined</strong> by the admin.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fee2e2;border-radius:12px;margin-bottom:22px">
      <tr><td style="padding:16px 20px">
        <p style="margin:0;font-size:13px;font-weight:600;color:#991b1b">&#10007; Registration Declined</p>
        <p style="margin:5px 0 0;font-size:13px;color:#b91c1c;line-height:1.65">
          If you believe this is a mistake, please contact the mess admin directly.
        </p>
      </td></tr>
      </table>
    </td></tr>
    </table>`;

  const html = baseTemplate({
    preheader: approved ? `Your Messy Kitchen account is approved! Login now.` : `Your Messy Kitchen registration was declined.`,
    headerLabel: approved ? 'Account Approved' : 'Account Declined',
    body,
  });

  const resend = getResend();
  if (!resend) return;
  const { error } = await resend.emails.send({
    from: FROM,
    to: [user.email],
    subject: approved
      ? `✅ Your Messy Kitchen account is approved!`
      : `❌ Your Messy Kitchen registration was declined`,
    html,
  });
  if (error) console.error('approval email error:', JSON.stringify(error));
  else console.log(`approval email sent to ${user.email} — approved:${approved}`);
}

module.exports = { sendWelcomeEmail, sendApprovalEmail };
