// "Email me a copy": progressive enhancement for the CV request form.
// Only the recipient address is sent; the backend (apps-script/cv-mailer)
// decides the attachment and the message text.
(function () {
  var form = document.getElementById('cv-request');
  if (!form) return;
  var input = form.elements.email;
  var status = document.getElementById('cv-status');
  var button = form.querySelector('button');
  var started = Date.now();

  var MESSAGES = {
    sent: 'Sent. Please check your inbox (and spam folder) for “Anastasiia Stepanenko — CV”.',
    invalid_email: 'Please enter a valid email address, e.g. name@company.com.',
    recently_sent: 'A copy was already sent to this address recently. Please check your inbox and spam folder.',
    rate_limited: 'Too many requests right now. Please try again later or contact me via LinkedIn or email.',
    unavailable: 'Email delivery is temporarily unavailable. Please download the CV instead.',
    rejected: 'The request could not be processed. Please try again.'
  };

  function show(text, ok) {
    status.textContent = text;
    status.className = 'form-status ' + (ok ? 'ok' : 'err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!input.checkValidity() || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(email)) {
      input.setAttribute('aria-invalid', 'true');
      show(MESSAGES.invalid_email, false);
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    button.disabled = true;
    show('Sending…', true);
    var body = new URLSearchParams({ email: email, company: form.elements.company.value, elapsed: String(Date.now() - started) });
    // A form-urlencoded POST is a "simple" CORS request, so no preflight is needed.
    fetch(form.action, { method: 'POST', body: body })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok) { show(MESSAGES.sent, true); form.reset(); }
        else show(MESSAGES[res && res.error] || MESSAGES.rejected, false);
      })
      .catch(function () { show('Network error — the request did not reach the server. Nothing was sent.', false); })
      .then(function () { button.disabled = false; });
  });
})();
