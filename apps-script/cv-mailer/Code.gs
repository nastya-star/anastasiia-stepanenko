/**
 * CV mailer: sends the fixed CV PDF with a fixed message to one visitor-supplied address.
 *
 * Deployed as a Google Apps Script web app owned by, and executing as,
 * anastasiia.stepanenko.work@gmail.com, so mail is genuinely sent from that Gmail account
 * (not merely a display name or Reply-To). It refuses to send under any other account.
 * It is separate from every other script, including the beer-report backend.
 *
 * Accepts exactly four POST fields: email, lang ("en" | "de"), company (honeypot, must be
 * empty) and elapsed (ms). Anything else, including attachments, URLs or message text, is rejected.
 *
 * Private configuration lives in Script Properties, never in the website:
 *   CV_FILE_ID      Google Drive file ID of the English CV PDF
 *   CV_FILE_ID_DE   Google Drive file ID of the German CV PDF (optional)
 *   ENABLED         "true" to allow sending (kill switch; anything else disables it)
 * At least one CV is required. If the requested language has no CV, the other one is sent
 * and the email says which language it is in.
 */

// Fixed templates. `{{note}}` is replaced by an empty string, or by a one-line notice when the
// attached CV is in the other language.
var TEMPLATES = {
  en: {
    subject: 'Anastasiia Stepanenko — CV',
    filename: 'Anastasiia_Stepanenko_CV.pdf',
    otherLanguageNote: 'Please note: my CV is currently available in German only.\n\n',
    body: [
      'Hello,',
      '',
      'Thank you for your interest in my work. Please find my CV attached.',
      '',
      '{{note}}You are welcome to reply to this email to discuss opportunities in optimization, data science or research collaboration.',
      '',
      'Best regards,',
      'Anastasiia Stepanenko',
      'Munich',
      'anastasiia.stepanenko.work@gmail.com'
    ].join('\n')
  },
  de: {
    subject: 'Anastasiia Stepanenko — Lebenslauf',
    filename: 'Anastasiia_Stepanenko_Lebenslauf.pdf',
    otherLanguageNote: 'Bitte beachten Sie: Mein Lebenslauf liegt derzeit nur auf Englisch vor.\n\n',
    body: [
      'Guten Tag,',
      '',
      'vielen Dank für Ihr Interesse an meiner Arbeit. Anbei finden Sie meinen Lebenslauf.',
      '',
      '{{note}}Gerne können Sie auf diese E-Mail antworten, um Möglichkeiten in den Bereichen Optimierung, Data Science oder Forschungskooperation zu besprechen.',
      '',
      'Viele Grüße',
      'Anastasiia Stepanenko',
      'München',
      'anastasiia.stepanenko.work@gmail.com'
    ].join('\n')
  }
};
var CV_PROPERTY = { en: 'CV_FILE_ID', de: 'CV_FILE_ID_DE' };
var SENDER_NAME = 'Anastasiia Stepanenko';
// The script must be deployed by, and execute as, this Google account; it refuses to send otherwise.
var SENDER_ACCOUNT = 'anastasiia.stepanenko.work@gmail.com';
var REPLY_TO = SENDER_ACCOUNT;

// Conservative limits, enforced here on the server.
var LIMITS = {
  perHour: 5,              // total CV emails per clock hour
  perDay: 20,              // total CV emails per UTC day
  perRecipientHours: 24,   // same address at most once per 24 h
  minElapsedMs: 3000,      // form must have been open at least 3 s (bots submit instantly)
  quotaReserve: 20         // keep this many of the account's daily MailApp sends untouched
};

var ALLOWED_FIELDS = { email: true, lang: true, company: true, elapsed: true };

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return reply_('unavailable');
  try {
    return reply_(handle_(e));
  } catch (err) {
    console.error('cv-mailer error: ' + (err && err.message)); // never log the address
    return reply_('unavailable');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return reply_(isEnabled_() ? null : 'unavailable');
}

function handle_(e) {
  var p = (e && e.parameter) || {};
  var multi = (e && e.parameters) || {};
  // Only the known fields, each given once; no file uploads or raw bodies.
  for (var k in multi) {
    if (!ALLOWED_FIELDS[k] || multi[k].length !== 1) return 'rejected';
  }
  if (e && e.postData && !/^application\/x-www-form-urlencoded/.test(e.postData.type || '')) return 'rejected';

  if (p.company) return 'rejected';
  if (!(Number(p.elapsed) >= LIMITS.minElapsedMs)) return 'rejected';

  var lang = p.lang === undefined ? 'en' : p.lang;
  if (lang !== 'en' && lang !== 'de') return 'rejected';

  var email = normaliseEmail_(p.email);
  if (!email) return 'invalid_email';

  if (!isEnabled_()) return 'unavailable';
  if (!isSenderAccount_()) return 'unavailable';

  var props = PropertiesService.getScriptProperties();
  var other = lang === 'en' ? 'de' : 'en';
  var cvLang = props.getProperty(CV_PROPERTY[lang]) ? lang : props.getProperty(CV_PROPERTY[other]) ? other : null;
  if (!cvLang) return 'unavailable';
  var fileId = props.getProperty(CV_PROPERTY[cvLang]);
  var now = new Date();
  var hourKey = 'h:' + Utilities.formatDate(now, 'UTC', 'yyyyMMddHH');
  var dayKey = 'd:' + Utilities.formatDate(now, 'UTC', 'yyyyMMdd');
  var recipientKey = 'r:' + sha256_(email);

  var last = Number(props.getProperty(recipientKey) || 0);
  if (last && now.getTime() - last < LIMITS.perRecipientHours * 3600 * 1000) return 'recently_sent';
  if (Number(props.getProperty(hourKey) || 0) >= LIMITS.perHour) return 'rate_limited';
  if (Number(props.getProperty(dayKey) || 0) >= LIMITS.perDay) return 'rate_limited';
  if (MailApp.getRemainingDailyQuota() <= LIMITS.quotaReserve) return 'rate_limited';

  var blob = DriveApp.getFileById(fileId).getBlob();
  if (blob.getContentType() !== 'application/pdf') return 'unavailable';
  var tpl = TEMPLATES[lang];
  blob.setName(TEMPLATES[cvLang].filename);

  MailApp.sendEmail({
    to: email,
    subject: tpl.subject,
    body: tpl.body.replace('{{note}}', cvLang === lang ? '' : tpl.otherLanguageNote),
    name: SENDER_NAME,
    replyTo: REPLY_TO,
    attachments: [blob]
  });

  props.setProperty(recipientKey, String(now.getTime()));
  props.setProperty(hourKey, String(Number(props.getProperty(hourKey) || 0) + 1));
  props.setProperty(dayKey, String(Number(props.getProperty(dayKey) || 0) + 1));
  prune_(props, now);
  return null;
}

/** Returns a lower-cased single address, or null if it is not a plausible one. */
function normaliseEmail_(raw) {
  if (typeof raw !== 'string') return null;
  var s = raw.trim();
  if (s.length < 6 || s.length > 254) return null;
  // One plain address only: no display names, lists, quotes, whitespace or header characters.
  if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/.test(s)) return null;
  if (/\.\./.test(s) || /^\./.test(s) || /\.@/.test(s)) return null;
  return s.toLowerCase();
}

function isSenderAccount_() {
  return String(Session.getEffectiveUser().getEmail()).toLowerCase() === SENDER_ACCOUNT;
}

function isEnabled_() {
  return PropertiesService.getScriptProperties().getProperty('ENABLED') === 'true';
}

function sha256_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

/** Drops counters and recipient hashes older than 48 h so nothing is kept longer than needed. */
function prune_(props, now) {
  var all = props.getProperties();
  var cutoff = now.getTime() - 48 * 3600 * 1000;
  var oldDay = Utilities.formatDate(new Date(cutoff), 'UTC', 'yyyyMMdd');
  for (var k in all) {
    if (k.indexOf('r:') === 0 && Number(all[k]) < cutoff) props.deleteProperty(k);
    else if (k.indexOf('h:') === 0 && k.slice(2, 10) < oldDay) props.deleteProperty(k);
    else if (k.indexOf('d:') === 0 && k.slice(2) < oldDay) props.deleteProperty(k);
  }
}

function reply_(error) {
  var out = error ? { ok: false, error: error } : { ok: true };
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to check the setup without sending anything. */
function checkSetup() {
  var props = PropertiesService.getScriptProperties();
  var cvs = {};
  ['en', 'de'].forEach(function (l) {
    var id = props.getProperty(CV_PROPERTY[l]);
    var blob = id ? DriveApp.getFileById(id).getBlob() : null;
    cvs[l] = blob ? { isPdf: blob.getContentType() === 'application/pdf', bytes: blob.getBytes().length } : 'not configured';
  });
  console.log(JSON.stringify({
    enabled: isEnabled_(),
    runningAs: Session.getEffectiveUser().getEmail(),
    senderAccountOk: isSenderAccount_(),
    cv: cvs,
    remainingDailyQuota: MailApp.getRemainingDailyQuota()
  }));
}
