// "Send CV to my email": submits only the visitor's address to the CV mailer
// (apps-script/cv-mailer). The backend fixes the attachment and message text.
// Success is shown only when the backend confirms the email was sent.
(function () {
  var form = document.getElementById('cv-request');
  if (!form) return;
  var input = form.elements.email;
  var status = document.getElementById('cv-status');
  var button = form.querySelector('button[type=submit]');
  var configured = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(form.getAttribute('action'));
  var opened = Date.now();

  var MESSAGES = {
    invalid_email: 'Please enter a valid email address, e.g. name@company.com.',
    recently_sent: 'My CV was already sent to this address in the last 24 hours. Please check your inbox and spam folder.',
    rate_limited: 'Too many requests right now. Please try again later, or download the CV above.',
    unavailable: 'Sending by email is temporarily unavailable. Please download the CV above.',
    rejected: 'The request could not be processed. Please try again.'
  };

  function show(text, ok) {
    status.textContent = text;
    status.className = 'form-status ' + (ok ? 'ok' : 'err');
  }

  if (!configured) {
    input.disabled = true;
    button.disabled = true;
    show('Sending by email is not available yet. Please download the CV above.', false);
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
      show(MESSAGES.invalid_email, false);
      input.focus();
      return;
    }
    button.disabled = true;
    show('Sending…', true);
    var body = new URLSearchParams({ email: email, company: form.elements.company.value, elapsed: String(Date.now() - opened) });
    // A form-urlencoded POST is a "simple" CORS request, so no preflight is needed.
    fetch(form.action, { method: 'POST', body: body })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (res) {
        if (res && res.ok === true) {
          show('Sent to ' + email + '. Please check your inbox (and spam folder) for “Anastasiia Stepanenko — CV”.', true);
          form.reset();
        } else {
          show(MESSAGES[res && res.error] || MESSAGES.rejected, false);
        }
      })
      .catch(function () { show('The server could not be reached, so nothing was sent. Please try again or download the CV above.', false); })
      .then(function () { button.disabled = false; });
  });
})();
