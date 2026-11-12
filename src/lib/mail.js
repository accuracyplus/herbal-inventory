/**
 * Sending mail through Microsoft 365 (Microsoft Graph), as Recruitment and HiFive ID do:
 * one app registration, one sender mailbox, the application permission Mail.Send.
 *
 *   MS_TENANT_ID, MS_CLIENT_ID   which Microsoft 365 and which app      (secrets)
 *   MS_CLIENT_SECRET             the app's secret                        (secret)
 *   MAIL_SENDER                  the mailbox mail is sent from           ([vars])
 *
 * Until all four are set, mail is off and the screens say so: nothing is attempted. A failure
 * is told to the person in a sentence they can act on or pass to an administrator; the raw
 * answer from Microsoft is never shown.
 */

const GRAPH = 'https://graph.microsoft.com/v1.0';
const EMAIL = /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/;

export const isEmail = (s) => typeof s === 'string' && s.length <= 120 && EMAIL.test(s.trim());

export class MailError extends Error {}

/** Whether mail can be tried at all, and if not, what is missing (for an administrator). */
export function mailStatus(env) {
  const missing = ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'MAIL_SENDER'].filter((k) => !String(env[k] || '').trim());
  const sender = String(env.MAIL_SENDER || '').trim();
  if (!missing.length && !isEmail(sender)) return { ready: false, sender, missing: ['MAIL_SENDER'] };
  return { ready: missing.length === 0, sender, missing };
}

const say = (status, code = '') => {
  if (status === 401 || /invalid_client|unauthorized_client/i.test(code)) return 'Microsoft 365 refused the app\'s sign-in. An administrator needs to check the app\'s secret.';
  if (status === 403 || /AccessDenied|Authorization_RequestDenied/i.test(code)) return 'The app is not allowed to send mail yet. An administrator needs to grant it Mail.Send for the sender mailbox.';
  if (status === 404 || /ErrorInvalidUser|MailboxNotEnabledForRESTAPI|ResourceNotFound/i.test(code)) return 'Microsoft 365 could not find the mailbox this app sends from. An administrator needs to check MAIL_SENDER.';
  if (status === 413 || /MaxRequestSize|AttachmentSizeLimit/i.test(code)) return 'The email was too large to send.';
  if (status === 429 || status >= 500) return 'Microsoft 365 is busy or not answering. Try again in a minute.';
  return 'The email could not be sent. Try again; if it keeps failing, tell an administrator.';
};

function base64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

async function token(env, f) {
  let res;
  try {
    res = await f(`https://login.microsoftonline.com/${encodeURIComponent(String(env.MS_TENANT_ID).trim())}/oauth2/v2.0/token`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: String(env.MS_CLIENT_ID).trim(), client_secret: String(env.MS_CLIENT_SECRET), scope: 'https://graph.microsoft.com/.default' }),
    });
  } catch { throw new MailError(say(503)); }
  const out = await res.json().catch(() => null);
  if (!res.ok || !out?.access_token) throw new MailError(say(res.status === 400 ? 401 : res.status, out?.error || ''));
  return out.access_token;
}

/**
 * Send one email. `attachments` are `{ name, type, bytes }`. Resolves when Microsoft 365 has
 * accepted it; throws a MailError whose message is for the person on the screen.
 * `env.MAIL_FETCH` stands in for the network in tests.
 */
export async function sendMail(env, { to, cc = [], subject, html, attachments = [] }) {
  const st = mailStatus(env);
  if (!st.ready) throw new MailError('Emailing is not set up for this app yet.');
  const f = env.MAIL_FETCH || fetch;
  const bearer = await token(env, f);
  const person = (address) => ({ emailAddress: { address } });
  let res;
  try {
    res = await f(`${GRAPH}/users/${encodeURIComponent(st.sender)}/sendMail`, {
      method: 'POST', headers: { authorization: `Bearer ${bearer}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject, body: { contentType: 'HTML', content: html },
          toRecipients: to.map(person), ccRecipients: cc.map(person),
          ...(attachments.length ? { attachments: attachments.map((a) => ({ '@odata.type': '#microsoft.graph.fileAttachment', name: a.name, contentType: a.type, contentBytes: base64(a.bytes) })) } : {}),
        },
        saveToSentItems: true,
      }),
    });
  } catch { throw new MailError(say(503)); }
  if (res.status === 202 || res.ok) return { ok: true, from: st.sender };
  const out = await res.json().catch(() => null);
  throw new MailError(say(res.status, out?.error?.code || ''));
}

export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
