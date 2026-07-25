const { Resend } = require('resend');

const SITE_URL = process.env.FRONTEND_URL || 'https://themessykitchen.online';
const FROM = 'Messy Kitchen <noreply@themessykitchen.online>';

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set!');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function baseTemplate({ preheader = '', body = '', accentColor = '#059669' }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>The Messy Kitchen</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}
  body{margin:0!important;padding:0!important;background:#ffffff}
  @media only screen and (max-width:600px){
    .email-container{width:100%!important;margin:0!important}
    .fluid{max-width:100%!important;height:auto!important}
    .stack-column,.stack-column-center{display:block!important;width:100%!important;max-width:100%!important}
    .pad-lr{padding-left:20px!important;padding-right:20px!important}
    .hero-pad{padding:28px 20px!important}
    .btn-full{display:block!important;width:100%!important;text-align:center!important;box-sizing:border-box!important}
    .footer-pad{padding:16px 20px!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">
<tr><td align="center" style="padding:32px 16px">

  <!-- Email container -->
  <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 32px rgba(0,0,0,0.10)">

    <!-- Top accent bar -->
    <tr><td style="background:${accentColor};height:5px;font-size:0;line-height:0">&nbsp;</td></tr>

    <!-- Logo + brand -->
    <tr><td align="center" style="padding:32px 32px 20px;background:#ffffff">
      <img src="https://themessykitchen.online/messy-logo.png" alt="The Messy Kitchen" width="72" height="72"
        style="display:block;margin:0 auto 14px;border-radius:50%;border:3px solid #d1fae5"/>
      <p style="margin:0;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.3px">The Messy Kitchen</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280;letter-spacing:2.5px;text-transform:uppercase">Mess Management System</p>
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 32px"><div style="height:1px;background:#f3f4f6"></div></td></tr>

    <!-- Body content -->
    ${body}

    <!-- Footer -->
    <tr><td class="footer-pad" align="center" style="padding:20px 32px 28px;background:#ffffff">
      <p style="margin:0 0 6px;font-size:12px;color:#9ca3af">
        &copy; ${new Date().getFullYear()} <strong style="color:#059669">The Messy Kitchen</strong> &middot; All rights reserved
      </p>
      <p style="margin:0;font-size:12px">
        <a href="${SITE_URL}" style="color:${accentColor};text-decoration:none;font-weight:600">themessykitchen.online</a>
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#d1d5db">This email was sent to you because you have an account at The Messy Kitchen.</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Welcome email ─────────────────────────────────────────────────────
async function sendWelcomeEmail(user) {
  const body = `
    <!-- Hero -->
    <tr><td class="hero-pad" align="center" style="padding:36px 32px 28px;background:#ffffff">
      <div style="display:inline-block;background:#ecfdf5;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:30px;margin-bottom:16px">🎉</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.2">Welcome aboard!</h1>
      <p style="margin:0;font-size:15px;color:#6b7280">Your account has been created successfully</p>
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 32px"><div style="height:1px;background:#f3f4f6"></div></td></tr>

    <!-- Content -->
    <tr><td class="pad-lr" style="padding:28px 32px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
        Hi <strong style="color:#111827">${user.name}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.75">
        You've successfully registered at <strong style="color:#111827">The Messy Kitchen</strong> using your Google account.
        Your account is currently under review — you'll get an email as soon as the admin makes a decision.
      </p>

      <!-- Status badge -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr><td style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:16px 20px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="32" valign="middle" style="font-size:20px;padding-right:12px">⏳</td>
          <td valign="middle">
            <p style="margin:0;font-size:13px;font-weight:700;color:#92400e">Pending Admin Approval</p>
            <p style="margin:4px 0 0;font-size:13px;color:#78350f;line-height:1.5">The admin will review your account shortly.</p>
          </td>
        </tr>
        </table>
      </td></tr>
      </table>

      <!-- Account details -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;background:#f9fafb;border-radius:12px">
      <tr><td style="padding:16px 20px">
        <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px">Your Account</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;width:60px">Name</td>
          <td style="padding:4px 0;font-size:13px;font-weight:600;color:#111827">${user.name}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280">Email</td>
          <td style="padding:4px 0;font-size:13px;font-weight:600;color:#111827">${user.email}</td>
        </tr>
        </table>
      </td></tr>
      </table>

      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center">
        <a href="${SITE_URL}" class="btn-full"
          style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px">
          Visit The Messy Kitchen &rarr;
        </a>
      </td></tr>
      </table>
    </td></tr>`;

  const html = baseTemplate({
    preheader: `Welcome ${user.name}! Your Messy Kitchen account is pending approval.`,
    body,
    accentColor: '#059669',
  });

  const resend = getResend();
  if (!resend) { console.error('welcome email: no resend instance'); return; }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [user.email],
    subject: `🎉 Welcome to The Messy Kitchen, ${user.name}!`,
    html,
  });
  if (error) console.error('welcome email error:', JSON.stringify(error));
  else console.log('welcome email sent:', data?.id, '→', user.email);
}

// ── Approval / Rejection email ────────────────────────────────────────
async function sendApprovalEmail(user, approved) {
  const accentColor = approved ? '#059669' : '#dc2626';

  const body = approved ? `
    <!-- Hero -->
    <tr><td class="hero-pad" align="center" style="padding:36px 32px 28px;background:#ffffff">
      <div style="display:inline-block;background:#ecfdf5;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:30px;margin-bottom:16px">✅</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.2">You're approved!</h1>
      <p style="margin:0;font-size:15px;color:#6b7280">Your account is now active</p>
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 32px"><div style="height:1px;background:#f3f4f6"></div></td></tr>

    <!-- Content -->
    <tr><td class="pad-lr" style="padding:28px 32px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
        Hi <strong style="color:#111827">${user.name}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.75">
        Great news! Your <strong style="color:#111827">Messy Kitchen</strong> account has been
        <strong style="color:#059669">approved</strong> by the admin.
        You can now log in and access all your mess features.
      </p>

      <!-- Status badge -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr><td style="background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:12px;padding:16px 20px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="32" valign="middle" style="font-size:20px;padding-right:12px">🎊</td>
          <td valign="middle">
            <p style="margin:0;font-size:13px;font-weight:700;color:#065f46">Access Granted</p>
            <p style="margin:4px 0 0;font-size:13px;color:#047857;line-height:1.5">View your meals, bills, payments and more from your dashboard.</p>
          </td>
        </tr>
        </table>
      </td></tr>
      </table>

      <!-- What you can do -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;background:#f9fafb;border-radius:12px">
      <tr><td style="padding:16px 20px">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px">What you can do now</p>
        <p style="margin:0 0 6px;font-size:13px;color:#374151">&#10003;&nbsp; View your daily meal records</p>
        <p style="margin:0 0 6px;font-size:13px;color:#374151">&#10003;&nbsp; Check your monthly bills</p>
        <p style="margin:0 0 6px;font-size:13px;color:#374151">&#10003;&nbsp; Track your payments</p>
        <p style="margin:0;font-size:13px;color:#374151">&#10003;&nbsp; Mark off days when you're away</p>
      </td></tr>
      </table>

      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td align="center">
        <a href="${SITE_URL}" class="btn-full"
          style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px">
          Login to Your Account &rarr;
        </a>
      </td></tr>
      </table>
    </td></tr>`
  : `
    <!-- Hero -->
    <tr><td class="hero-pad" align="center" style="padding:36px 32px 28px;background:#ffffff">
      <div style="display:inline-block;background:#fef2f2;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:30px;margin-bottom:16px">❌</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.2">Registration Declined</h1>
      <p style="margin:0;font-size:15px;color:#6b7280">Your account request was not approved</p>
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 32px"><div style="height:1px;background:#f3f4f6"></div></td></tr>

    <!-- Content -->
    <tr><td class="pad-lr" style="padding:28px 32px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
        Hi <strong style="color:#111827">${user.name}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.75">
        Unfortunately, your registration at <strong style="color:#111827">The Messy Kitchen</strong> has been
        <strong style="color:#dc2626">declined</strong> by the admin.
      </p>

      <!-- Status badge -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px">
      <tr><td style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:16px 20px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="32" valign="middle" style="font-size:20px;padding-right:12px">ℹ️</td>
          <td valign="middle">
            <p style="margin:0;font-size:13px;font-weight:700;color:#991b1b">What to do next</p>
            <p style="margin:4px 0 0;font-size:13px;color:#b91c1c;line-height:1.5">If you believe this is a mistake, please contact the mess admin directly.</p>
          </td>
        </tr>
        </table>
      </td></tr>
      </table>
    </td></tr>`;

  const html = baseTemplate({
    preheader: approved
      ? `Great news ${user.name}! Your Messy Kitchen account has been approved.`
      : `Your Messy Kitchen registration was not approved.`,
    body,
    accentColor,
  });

  const resend = getResend();
  if (!resend) { console.error('approval email: no resend instance'); return; }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [user.email],
    subject: approved
      ? `✅ Your Messy Kitchen account is approved!`
      : `Your Messy Kitchen registration was declined`,
    html,
  });
  if (error) console.error('approval email error:', JSON.stringify(error));
  else console.log('approval email sent:', data?.id, '→', user.email, 'approved:', approved);
}

// ── Password Reset email ──────────────────────────────────────────────
async function sendResetEmail({ name, email, resetUrl }) {
  const body = `
    <!-- Hero -->
    <tr><td class="hero-pad" align="center" style="padding:36px 32px 28px;background:#ffffff">
      <div style="display:inline-block;background:#ecfdf5;border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;font-size:30px;margin-bottom:16px">🔐</div>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;line-height:1.2">Reset your password</h1>
      <p style="margin:0;font-size:15px;color:#6b7280">We received a password reset request</p>
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 32px"><div style="height:1px;background:#f3f4f6"></div></td></tr>

    <!-- Content -->
    <tr><td class="pad-lr" style="padding:28px 32px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6">
        Hi <strong style="color:#111827">${name}</strong>,
      </p>
      <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.75">
        Click the button below to set a new password for your Messy Kitchen account.
        This link is valid for <strong style="color:#111827">15 minutes</strong> only.
      </p>

      <!-- CTA -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
      <tr><td align="center">
        <a href="${resetUrl}" class="btn-full"
          style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px">
          Reset Password &rarr;
        </a>
      </td></tr>
      </table>

      <!-- Warning -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="background:#f9fafb;border-radius:10px;padding:14px 18px">
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
          &#9203; Link expires in 15 minutes.<br/>
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </td></tr>
      </table>
    </td></tr>`;

  const html = baseTemplate({
    preheader: `Reset your Messy Kitchen password — link expires in 15 minutes.`,
    body,
    accentColor: '#059669',
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
  console.log('reset email sent:', data?.id, '→', email);
}

module.exports = { sendWelcomeEmail, sendApprovalEmail, sendResetEmail };
