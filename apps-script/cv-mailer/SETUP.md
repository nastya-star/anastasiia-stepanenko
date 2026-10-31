# CV mailer — setup

A separate Google Apps Script web app that emails the fixed CV PDF, with the fixed message,
**from anastasiia.stepanenko.work@gmail.com** to the address a visitor enters on `cv.html`.
It is independent of every other script, including the beer-report backend.

The script runs as the Google account that deploys it, and refuses to send unless that
account is `anastasiia.stepanenko.work@gmail.com`. So mail really comes from that Gmail
account, not just from a display name or Reply-To.

## What it accepts

- POST fields `email`, `company` (honeypot, must be empty) and `elapsed` (ms the form was open). Anything else is rejected.
- No attachments, file URLs or message text are accepted. The subject, body and PDF are fixed on the server.
- Limits enforced on the server: 5 emails per hour, 20 per day, the same address at most once per 24 h, the form must have been open for at least 3 s, and 20 of the account's daily sends are always left untouched.
- Privacy: an address is used only to send that one email. For rate limiting the script stores only a SHA-256 hash of it, and deletes it after 48 h. Addresses are never logged.

## One-time setup (about 10 minutes)

Do every step while signed in as **anastasiia.stepanenko.work@gmail.com**. If your browser has several Google accounts, use a private window, or check the avatar in the top right.

1. **Upload the CV to that account's Google Drive** as `Anastasiia_Stepanenko_CV.pdf`, keeping it private. Open it and copy the file ID, which is the long string between `/d/` and `/view` in the URL.
2. Go to https://script.google.com and create a **New project**. Name it `cv-mailer`.
3. Replace the contents of `Code.gs` with this folder's `Code.gs`.
4. Open **Project Settings** (gear icon) and tick **Show "appsscript.json" manifest file in editor**. Replace that file's contents with this folder's `appsscript.json`.
5. Still in **Project Settings**, under **Script Properties**, add:
   - `CV_FILE_ID` = the file ID from step 1
   - `ENABLED` = `true`
6. Back in the editor, select `checkSetup` and click **Run**. Approve the permissions: send email as you, read your Drive files, and see your email address. Google may show "Google hasn't verified this app": choose **Advanced → Go to cv-mailer**, since it's your own script. The log must show:
   - `runningAs: "anastasiia.stepanenko.work@gmail.com"` and `senderAccountOk: true`
   - `cvFileFound: true` and `cvIsPdf: true`

   Nothing is sent at this step.
7. Click **Deploy → New deployment**, with type **Web app**:
   - Execute as: **Me (anastasiia.stepanenko.work@gmail.com)**
   - Who has access: **Anyone**

   Click **Deploy** and copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).
8. Send that URL to Claude. It is not a secret: it only accepts the three fields above. Claude will put it in the form's `action` in `cv.html`.
9. **Test:** with your approval, one test request is sent to an address you choose. Email delivery counts as working only after that message arrives, from anastasiia.stepanenko.work@gmail.com, with the PDF attached.

## Operating it

- **Pause sending:** set `ENABLED` to `false` in Script Properties. The site then shows "temporarily unavailable".
- **Update the CV:** use Drive's *Manage versions → Upload new version* on the same file, so the ID stays the same. Also replace `Anastasiia_Stepanenko_CV.pdf` in the website repository.
- **Change limits:** edit `LIMITS` in `Code.gs`, then **Deploy → Manage deployments → Edit → New version**. Redeploying as a new version of the *same* deployment keeps the URL the same.
- Gmail's own sending quota for consumer accounts is about 100 script emails per day. The script stops well below that.
