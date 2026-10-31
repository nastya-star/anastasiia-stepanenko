# Anastasiia Stepanenko

Professional contact page: Optimization & Data Science, Munich.

Live: https://nastya-star.github.io/anastasiia-stepanenko/
Contact: anastasiia.stepanenko.work@gmail.com

Plain static HTML/CSS served by GitHub Pages from the `main` branch root. There are no
frameworks or web fonts: Georgia is used for headings and the system UI font for text. All
links work without JavaScript.

| File | Purpose |
| --- | --- |
| `build.mjs` | Generates all pages from one template (English and German text). Edit it, run `node build.mjs`, commit the output |
| `index.html`, `cv.html` | English homepage and CV page (generated) |
| `de/index.html`, `de/cv.html` | German homepage and CV page (generated) |
| `Anastasiia_Stepanenko_CV.pdf` | English CV (Europass). German version not provided yet; the German CV page says so. Set `CV` in `build.mjs` and rebuild when adding one |
| `cv-request.js` | The "Send CV to my email" form script (CV page only) |
| `apps-script/cv-mailer/` | Google Apps Script backend that sends the CV from anastasiia.stepanenko.work@gmail.com; see its `SETUP.md` |

## Language

There is an EN | DE switch at the top right; it uses ordinary links, so it works without JavaScript. A small inline script remembers the visitor's choice in `localStorage`. On a first visit, German-language browsers are sent to `de/`; everyone else gets English. This happens in `<head>`, before anything is drawn.

## Status

- **CV:** English PDF live (View, Download). German PDF not provided yet.
- **Send CV to my email:** connected to the deployed cv-mailer (`MAILER_URL` in `build.mjs`). Email delivery not yet verified with a received test message.
- **Fuel project:** shown as "Coming soon" because https://nastya-star.github.io/munich-fuel-min/ is not published (checked 2026-10-31).
