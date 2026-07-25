const { Resend } = require('resend');

const SITE_URL = process.env.FRONTEND_URL || 'https://themessykitchen.online';
const FROM = 'Messy Kitchen <noreply@themessykitchen.online>';
const LOGO = 'https://themessykitchen.online/messy-logo.png';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set!');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function baseTemplate({ preheader = '', body = '', topBarColor = '#059669' }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>The Messy Kitchen</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  body{margin:0!important;padding:0!important;background:#ffffff}
  img{border:0;outline:none;text-decoration:none;display:block}
  @media only screen and (max-width:560px){
    .wrap{width:100%!important}
    .pad{padding:28px 20px!important}
    .btn a{display:block!important;width:100%!important;box-sizing:border-box!important;text-align:center!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:40px 16px">
<tr><td align="center">
<table role="presentation" class="wrap" width="560" cellpadding="0" cellspacing="0" border="0"
  style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- Top color bar -->
  <tr><td style="background:${topBarColor};height:4px;font-size:0;line-height:0">&nbsp;</td></tr>

  <!-- Logo -->
  <tr><td align="center" style="padding:36px 40px 24px;background:#ffffff">
    <img src="${LOGO}" alt="The Messy Kitchen" width="64" height="64"
      style="border-radius:50%;border:2px solid #e5e7eb;margin:0 auto 16px"/>
    <p style="margin:0;font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.2px">The Messy Kitchen</p>
    <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;letter-spacing:2px;text-transform:uppercase">Mess Management System</p>
  </td></tr>

  <!-- Hairline -->
  <tr><td style="padding:0 40px"><div style="height:1px;background:#f3f4f6"></div></td></tr>

  <!-- Body -->
  ${body}

  <!-- Footer -->
  <tr><td align="center" class="pad" style="padding:20px 40px 32px;background:#ffffff">
    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af">&copy; ${new Date().getFullYear()} The Messy Kitchen &middot; All rights reserved</p>
    <a href="${SITE_URL}" style="font-size:12px;color:#059669;text-decoration:none;font-weight:600">themessykitchen.online</a>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Welcome ───────────────────────────────────────────────────────────
async function sendWelcomeEmail(user) {
  const body = `
  <tr><td class="pad" style="padding:32px 40px">
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:1.5px">Welcome</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;line-height:1.2">Hello, ${user.name}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.8">
      Your account at <strong style="color:#111827">The Messy Kitchen</strong> has been created successfully using your Google account.
      It is currently <strong style="color:#111827">pending approval</strong> by the admin — you will receive another email once a decision is made.
    </p>

    <!-- Info box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
    <tr><td style="background:#f9fafb;border-left:3px solid #059669;border-radius:0 8px 8px 0;padding:14px 18px">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px">Account Details</p>
      <p style="margin:0 0 4px;font-size:13px;color:#374151"><span style="color:#9ca3af;display:inline-block;width:48px">Name</span><strong>${user.name}</strong></p>
      <p style="margin:0;font-size:13px;color:#374151"><span style="color:#9ca3af;display:inline-block;width:48px">Email</span><strong>${user.email}</strong></p>
    </td></tr>
    </table>

    <!-- CTA -->
    <table role="presentation" class="btn" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="border-radius:8px;background:#059669">
      <a href="${SITE_URL}" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.2px">
        Visit The Messy Kitchen
      </a>
    </td></tr>
    </table>
  </td></tr>`;

  const html = baseTemplate({
    preheader: `Welcome ${user.name}! Your account is pending admin approval.`,
    body,
    topBarColor: '#059669',
  });

  const resend = getResend();
  if (!resend) { console.error('welcome email: no resend instance'); return; }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [user.email],
    subject: `Welcome to The Messy Kitchen, ${user.name}!`,
    html,
  });
  if (error) console.error('welcome email error:', JSON.stringify(error));
  else console.log('welcome email sent:', data?.id, '->', user.email);
}

// ── Approval / Rejection ──────────────────────────────────────────────
async function sendApprovalEmail(user, approved) {
  const body = approved ? `
  <tr><td class="pad" style="padding:32px 40px">
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:1.5px">Account Approved</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;line-height:1.2">You're in, ${user.name}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.8">
      Your <strong style="color:#111827">Messy Kitchen</strong> account has been approved by the admin.
      You can now log in and access all your mess features including meals, bills, and payments.
    </p>

    <!-- Access box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
    <tr><td style="background:#f0fdf4;border-left:3px solid #059669;border-radius:0 8px 8px 0;padding:14px 18px">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#065f46">Access granted</p>
      <p style="margin:0;font-size:13px;color:#047857;line-height:1.6">View meals &middot; Check bills &middot; Track payments &middot; Mark off days</p>
    </td></tr>
    </table>

    <!-- CTA -->
    <table role="presentation" class="btn" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="border-radius:8px;background:#059669">
      <a href="${SITE_URL}" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.2px">
        Login to Your Account
      </a>
    </td></tr>
    </table>
  </td></tr>`
  : `
  <tr><td class="pad" style="padding:32px 40px">
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:1.5px">Registration Declined</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;line-height:1.2">Hi ${user.name},</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.8">
      Unfortunately, your registration at <strong style="color:#111827">The Messy Kitchen</strong> has been declined by the admin.
    </p>

    <!-- Info box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:#fef2f2;border-left:3px solid #dc2626;border-radius:0 8px 8px 0;padding:14px 18px">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#991b1b">What to do next</p>
      <p style="margin:0;font-size:13px;color:#b91c1c;line-height:1.6">If you believe this is a mistake, please contact the mess admin directly.</p>
    </td></tr>
    </table>
  </td></tr>`;

  const html = baseTemplate({
    preheader: approved
      ? `Your Messy Kitchen account has been approved. Login now.`
      : `Your Messy Kitchen registration was declined.`,
    body,
    topBarColor: approved ? '#059669' : '#dc2626',
  });

  const resend = getResend();
  if (!resend) { console.error('approval email: no resend instance'); return; }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [user.email],
    subject: approved
      ? `Your Messy Kitchen account is approved!`
      : `Your Messy Kitchen registration was declined`,
    html,
  });
  if (error) console.error('approval email error:', JSON.stringify(error));
  else console.log('approval email sent:', data?.id, '->', user.email, 'approved:', approved);
}

// ── Password Reset ────────────────────────────────────────────────────
async function sendResetEmail({ name, email, resetUrl }) {
  const body = `
  <tr><td class="pad" style="padding:32px 40px">
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:1.5px">Password Reset</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#111827;line-height:1.2">Reset your password</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.8">
      Hi <strong style="color:#111827">${name}</strong>, we received a request to reset your Messy Kitchen password.
      Click the button below to set a new one. This link expires in <strong style="color:#111827">15 minutes</strong>.
    </p>

    <!-- CTA -->
    <table role="presentation" class="btn" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
    <tr><td style="border-radius:8px;background:#059669">
      <a href="${resetUrl}" style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.2px">
        Reset Password
      </a>
    </td></tr>
    </table>

    <!-- Note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:#f9fafb;border-radius:8px;padding:14px 18px">
      <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7">
        If you did not request a password reset, you can safely ignore this email. Your password will not change.
      </p>
    </td></tr>
    </table>
  </td></tr>`;

  const html = baseTemplate({
    preheader: `Reset your Messy Kitchen password. Link expires in 15 minutes.`,
    body,
    topBarColor: '#059669',
  });

  const resend = getResend();
  if (!resend) throw new Error('RESEND_API_KEY not configured');
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject: 'Reset Your Messy Kitchen Password',
    html,
  });
  if (error) {
    console.error('reset email error:', JSON.stringify(error));
    throw new Error(error.message);
  }
  console.log('reset email sent:', data?.id, '->', email);
}

module.exports = { sendWelcomeEmail, sendApprovalEmail, sendResetEmail };
