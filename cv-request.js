// "Send CV to my email": submits only the visitor's address and the page
// language to the CV mailer (apps-script/cv-mailer). The backend fixes the
// attachment and message text. Success is shown only when the backend
// confirms the email was sent.
(function () {
  var form = document.getElementById('cv-request');
  if (!form) return;
  var lang = document.documentElement.lang === 'de' ? 'de' : 'en';
  var input = form.elements.email;
  var status = document.getElementById('cv-status');
  var button = form.querySelector('button[type=submit]');
  var configured = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(form.getAttribute('action'));
  var opened = Date.now();

  var M = {
    en: {
      notConfigured: 'Sending by email is not available yet. Please use the download instead.',
      sending: 'Sending…',
      sent: function (to) { return 'Sent to ' + to + '. Please check your inbox (and spam folder) for “Anastasiia Stepanenko — CV”.'; },
      network: 'The server could not be reached, so nothing was sent. Please try again or use the download instead.',
      invalid_email: 'Please enter a valid email address, e.g. name@company.com.',
      recently_sent: 'My CV was already sent to this address in the last 24 hours. Please check your inbox and spam folder.',
      rate_limited: 'Too many requests right now. Please try again later or use the download instead.',
      unavailable: 'Sending by email is temporarily unavailable. Please use the download instead.',
      rejected: 'The request could not be processed. Please try again.'
    },
    de: {
      notConfigured: 'Der Versand per E-Mail ist noch nicht verfügbar. Bitte nutzen Sie stattdessen den Download.',
      sending: 'Wird gesendet …',
      sent: function (to) { return 'Gesendet an ' + to + '. Bitte prüfen Sie Ihren Posteingang (und den Spam-Ordner) auf „Anastasiia Stepanenko — Lebenslauf“.'; },
      network: 'Der Server war nicht erreichbar, es wurde nichts gesendet. Bitte versuchen Sie es erneut oder nutzen Sie den Download.',
      invalid_email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein, z. B. name@unternehmen.de.',
      recently_sent: 'Mein Lebenslauf wurde in den letzten 24 Stunden bereits an diese Adresse gesendet. Bitte prüfen Sie Ihren Posteingang und den Spam-Ordner.',
      rate_limited: 'Derzeit gibt es zu viele Anfragen. Bitte versuchen Sie es später erneut oder nutzen Sie den Download.',
      unavailable: 'Der Versand per E-Mail ist vorübergehend nicht verfügbar. Bitte nutzen Sie stattdessen den Download.',
      rejected: 'Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.'
    }
  }[lang];

  function show(text, ok) {
    status.textContent = text;
    status.className = 'form-status ' + (ok ? 'ok' : 'err');
  }

  if (!configured) {
    input.disabled = true;
    button.disabled = true;
    show(M.notConfigured, false);
    return;
  }

  input.addEventListener('input', function () {
    if (input.getAttribute('aria-invalid')) { input.removeAttribute('aria-invalid'); status.textContent = ''; }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!input.checkValidity() || !/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[A-Za-z]{2,}$/.test(email)) {
      input.setAttribute('aria-invalid', 'true');
      show(M.invalid_email, false);
      input.focus();
      return;
    }
    button.disabled = true;
    show(M.sending, true);
    var body = new URLSearchParams({ email: email, lang: lang, company: form.elements.company.value, elapsed: String(Date.now() - opened) });
    // A form-urlencoded POST is a "simple" CORS request, so no preflight is needed.
    fetch(form.action, { method: 'POST', body: body })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (res) {
        if (res && res.ok === true) { show(M.sent(email), true); form.reset(); }
        else show(M[res && res.error] || M.rejected, false);
      })
      .catch(function () { show(M.network, false); })
      .then(function () { button.disabled = false; });
  });
})();
