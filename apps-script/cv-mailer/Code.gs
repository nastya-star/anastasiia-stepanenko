/**
 * CV mailer: sends the fixed CV PDF with a fixed message to one visitor-supplied address.
 *
 * Deployed as a Google Apps Script web app that runs as the site owner, so mail is sent
 * from the owner's Gmail account. It is separate from every other script.
 *
 * Accepts exactly three POST fields: email, company (honeypot, must be empty), elapsed (ms).
 * Anything else, including attachments, URLs or message text, is rejected.
 *
 * Private configuration lives in Script Properties, never in the website:
 *   CV_FILE_ID   Google Drive file ID of Anastasiia_Stepanenko_CV.pdf (required)
 *   ENABLED      "true" to allow sending (kill switch; anything else disables it)
 */

var SUBJECT = 'Anastasiia Stepanenko — CV';
var BODY = [
  'Hello,',
  '',
  'Thank you for your interest in my work. Please find my CV attached.',
  '',
  'I am an MSc student in Mathematics in Data Science at the Technical University of Munich, focusing on optimization and data science.',
  '',
  'You are welcome to reply to this email to discuss relevant opportunities or collaborations.',
  '',
  'Best regards,',
  'Anastasiia Stepanenko',
  'Munich',
  'stepanenkon010@gmail.com'
].join('\n');
var FILENAME = 'Anastasiia_Stepanenko_CV.pdf';
var SENDER_NAME = 'Anastasiia Stepanenko';
var REPLY_TO = 'stepanenkon010@gmail.com';

// Conservative limits, enforced here on the server.
var LIMITS = {
  perHour: 5,              // total CV emails per clock hour
  perDay: 20,              // total CV emails per UTC day
  perRecipientHours: 24,   // same address at most once per 24 h
  minElapsedMs: 3000,      // form must have been open at least 3 s (bots submit instantly)
  quotaReserve: 20         // keep this many of the account's daily MailApp sends untouched
};

var ALLOWED_FIELDS = { email: true, company: true, elapsed: true };

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
  // Only the three known fields, each given once; no file uploads or raw bodies.
  for (var k in multi) {
    if (!ALLOWED_FIELDS[k] || multi[k].length !== 1) return 'rejected';
  }
  if (e && e.postData && !/^application\/x-www-form-urlencoded/.test(e.postData.type || '')) return 'rejected';

  if (p.company) return 'rejected';
  if (!(Number(p.elapsed) >= LIMITS.minElapsedMs)) return 'rejected';

  var email = normaliseEmail_(p.email);
  if (!email) return 'invalid_email';

  if (!isEnabled_()) return 'unavailable';
  var fileId = PropertiesService.getScriptProperties().getProperty('CV_FILE_ID');
  if (!fileId) return 'unavailable';

  var props = PropertiesService.getScriptProperties();
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
  blob.setName(FILENAME);

  MailApp.sendEmail({
    to: email,
    subject: SUBJECT,
    body: BODY,
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
  var id = props.getProperty('CV_FILE_ID');
  var blob = id ? DriveApp.getFileById(id).getBlob() : null;
  console.log(JSON.stringify({
    enabled: isEnabled_(),
    cvFileFound: !!blob,
    cvIsPdf: blob ? blob.getContentType() === 'application/pdf' : false,
    cvBytes: blob ? blob.getBytes().length : 0,
    remainingDailyQuota: MailApp.getRemainingDailyQuota()
  }));
}
