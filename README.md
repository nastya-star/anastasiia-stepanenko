# Anastasiia Stepanenko

Professional contact page: Optimization & Data Science, Munich.

Live: https://nastya-star.github.io/anastasiia-stepanenko/
Contact: anastasiia.stepanenko.work@gmail.com

Plain static HTML/CSS served by GitHub Pages from the `main` branch root. There are no
frameworks or web fonts: Georgia is used for headings and the system UI font for text. All
links work without JavaScript.

| File | Purpose |
| --- | --- |
| `index.html` | Homepage: one column of buttons (LinkedIn, WhatsApp, Email, Phone, GitHub, CV, fuel project) |
| `cv.html` | CV page: embedded PDF, Open PDF, Download CV, Send CV to my email, Back. The PDF loads only here |
| `Anastasiia_Stepanenko_CV.pdf` | The CV (**not added yet**: the homepage CV button stays "Coming soon" until it is) |
| `cv-request.js` | The "Send CV to my email" form script (CV page only) |
| `apps-script/cv-mailer/` | Google Apps Script backend that sends the CV from anastasiia.stepanenko.work@gmail.com; see its `SETUP.md` |

## Status

- **CV:** waiting for the final PDF.
- **Send CV to my email:** the backend code is ready but not deployed. The form stays disabled until `cv.html`'s form `action` holds the deployed `/exec` URL.
- **Fuel project:** shown as "Coming soon" because https://nastya-star.github.io/munich-fuel-min/ is not published (checked 2026-10-31).
