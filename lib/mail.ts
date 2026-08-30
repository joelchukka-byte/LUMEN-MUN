/**
 * Transactional email.
 *
 * Optional by design: with no SMTP_HOST configured the app runs normally and
 * every message is logged instead of sent, so local development and a first
 * deploy never fail on mail configuration. Delivery failures never block the
 * action that triggered them — a delegate's registration is saved whether or
 * not their confirmation email goes out.
 */

import 'server-only';
import type { Transporter } from 'nodemailer';

type Mail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transport: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (transport !== undefined) return transport;

  const host = process.env.SMTP_HOST;
  if (!host) {
    transport = null;
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require('nodemailer');
  const port = Number(process.env.SMTP_PORT || 587);

  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  }) as Transporter;

  return transport;
}

export async function sendMail(mail: Mail): Promise<{ sent: boolean; reason?: string }> {
  const tx = getTransport();
  const from = process.env.MAIL_FROM || 'LUMEN MUN <delegates@lumenmun.org>';

  if (!tx) {
    console.info(
      `[mail:not-configured] → ${mail.to}\n  subject: ${mail.subject}\n  ${mail.text.replace(/\n/g, '\n  ')}`
    );
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    await tx.sendMail({
      from,
      to: mail.to,
      bcc: process.env.MAIL_BCC || undefined,
      subject: mail.subject,
      text: mail.text,
      html: mail.html ?? htmlWrap(mail.subject, mail.text),
    });
    return { sent: true };
  } catch (error) {
    console.error('[mail:failed]', mail.to, mail.subject, error);
    return { sent: false, reason: (error as Error).message };
  }
}

/** Plain-text → a minimally styled email that matches the site's palette. */
function htmlWrap(title: string, text: string): string {
  const body = text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.65">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!doctype html><html><body style="margin:0;background:#520823;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#EDE6E2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:rgba(0,0,0,.28);border:1px solid rgba(249,166,26,.24)" cellpadding="0" cellspacing="0">
<tr><td style="padding:28px 32px;border-bottom:1px solid rgba(249,166,26,.2)">
  <div style="font-size:16px;font-weight:800;letter-spacing:.1em">LUMEN MUN</div>
  <div style="font-size:10px;letter-spacing:.28em;color:#F9A61A;margin-top:6px">EDITION I · GUNTUR</div>
</td></tr>
<tr><td style="padding:32px;font-size:15px;color:#EDE6E2">
  <h1 style="font-size:22px;margin:0 0 20px;font-weight:700">${escapeHtml(title)}</h1>
  ${body}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid rgba(237,230,226,.1);font-size:11px;color:rgba(237,230,226,.6)">
  LUMEN MUN · Guntur, Andhra Pradesh · An initiative of the Lumen Youth Initiative
</td></tr>
</table></td></tr></table></body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/* ---------------------------------------------------------------- templates */

const base = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const templates = {
  registrationReceived: (name: string, ref: string, fee: number) => ({
    subject: `Registration received, ${ref}`,
    text: `Hello ${name},

Your LUMEN MUN registration is in. Your delegate reference is ${ref}: keep it, you will need it at check-in.

Amount due: ₹${fee.toLocaleString('en-IN')}

Next step: complete payment and upload your proof at ${base()}/dashboard. Your seat is confirmed once our team verifies it.

- Delegate Affairs, LUMEN MUN`,
  }),

  verifyEmail: (name: string, token: string) => ({
    subject: 'Confirm your email: LUMEN MUN',
    text: `Hello ${name},

Confirm this address to activate your delegate account:

${base()}/verify-email?token=${token}

If you did not register for LUMEN MUN, you can ignore this email.

- Delegate Affairs, LUMEN MUN`,
  }),

  passwordReset: (name: string, token: string) => ({
    subject: 'Reset your password: LUMEN MUN',
    text: `Hello ${name},

Reset your delegate password here: the link is valid for one hour:

${base()}/reset-password?token=${token}

If you did not ask for this, no action is needed; your password is unchanged.

- Delegate Affairs, LUMEN MUN`,
  }),

  paymentApproved: (name: string, ref: string) => ({
    subject: `Seat confirmed, ${ref}`,
    text: `Hello ${name},

Your payment has been verified and your seat at LUMEN MUN Edition I is confirmed.

Reference: ${ref}

Your committee and portfolio allocation follows once the Academics department completes it: you will get an email the moment it lands, and it will appear on your dashboard at ${base()}/dashboard.

- Delegate Affairs, LUMEN MUN`,
  }),

  paymentRejected: (name: string, ref: string, reason: string) => ({
    subject: `Payment needs attention, ${ref}`,
    text: `Hello ${name},

We could not verify the payment proof for ${ref}.

Reason: ${reason}

Please re-submit from your dashboard at ${base()}/dashboard. If you believe this is a mistake, reply to this email and Delegate Affairs will sort it out.

- Delegate Affairs, LUMEN MUN`,
  }),

  allocated: (name: string, ref: string, committee: string, country: string) => ({
    subject: `Your allocation, ${committee}`,
    text: `Hello ${name},

Your LUMEN MUN allocation is confirmed.

Committee: ${committee}
Portfolio: ${country}
Reference: ${ref}

Your committee's background guide is on your dashboard at ${base()}/dashboard. Read it before day one: the dais will assume you have.

- Academics, LUMEN MUN`,
  }),
};
