# Lead Tech Daily Checklist

BK Packoutz lead technician daily checklist for packouts and packbacks.
Static web app — no build step, no server code. All state is saved on each
phone's own browser storage; the PDF is generated on the phone.

## Files

- `index.html` — the entire app (styles, scripts, and the PDF writer are inline)
- `sw.js` — service worker, kept at the repo ROOT so it can control the page
  (this is what makes offline opening and the install prompt work fully)
- `assets/` — logo, app icons, web app manifest, and a backup copy of `sw.js`

## Publish on GitHub Pages

1. Create a new **public** repository (free GitHub Pages requires public).
   Suggested name: `lead-tech-checklist`.
2. Upload every file in this folder, keeping the structure exactly
   (`index.html` and `sw.js` at the top level, the rest inside `assets/`).
3. In the repo: **Settings → Pages** → under "Build and deployment",
   Source: **Deploy from a branch**, Branch: **main** / **(root)** → Save.
4. Wait about a minute. Your app is live at
   `https://<your-username>.github.io/lead-tech-checklist/`

## Updating the app later

Replace the files in the repo with the newer package (same structure) and
commit. GitHub Pages republishes automatically. Techs get the new version
the next time they open the app with a connection (fully close and reopen
the app to force it immediately). Their in-progress checklists are stored
separately on their phones and are not wiped by an update.

## Notes

- Send to Supervisor builds the PDF on the phone and opens the share sheet.
  On restricted in-app browsers, use the confirmation screen's
  Open PDF / Download PDF links — those are direct taps and always work.
- Morning links can pre-fill a job:
  `?job=<job number>&customer=<name>&type=packout|packback&lead=<name>&date=YYYY-MM-DD`
  (There is deliberately no address field — customer addresses are kept out of
  the app for privacy.)
