# Anastasiia Stepanenko

Professional contact page: Optimization & Data Science, Munich.

Live: https://nastya-star.github.io/anastasiia-stepanenko/

Plain static HTML/CSS served by GitHub Pages from the `main` branch root. There are no
frameworks or web fonts: Georgia is used for headings and the system UI font for text. All
links work without JavaScript.

| File | Purpose |
| --- | --- |
| `index.html` | Homepage: contact buttons and the CV section |
| `cv.html` | CV page: the PDF viewed in the browser, plus "Open PDF" and "Download" links (the PDF loads only here) |
| `Anastasiia_Stepanenko_CV.pdf` | The CV (**not added yet**: the CV actions stay disabled until it is) |
| `cv-request.js` | Small script for the "Email me a copy" form; loaded only once the form is enabled |
| `apps-script/cv-mailer/` | Google Apps Script backend that emails the CV; see its `SETUP.md` |

## Status

- **CV:** waiting for the final PDF.
- **Email me a copy:** the backend code is ready, but it isn't deployed yet (see `apps-script/cv-mailer/SETUP.md`).
- **Fuel project link:** shown as "Coming soon" because https://nastya-star.github.io/munich-fuel-min/ is not published yet (checked 2026-10-31). Turn it into a link in `index.html` once it is live.
