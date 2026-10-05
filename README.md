# Sindhu & Anand: wedding invitation site

Static site, no build step. Files:

| File | What it is |
|---|---|
| `index.html`, `styles.css`, `app.js` | The invitation: envelope → card → 3D callouts → RSVP → visitor count |
| `config.js` | The only file you need to edit (RSVP backend, host WhatsApp number, RSVP-by date) |
| `send.html` | Host tool: paste guest names + phones, get one-tap "Send on WhatsApp" buttons with personal links |
| `apps-script.gs` | Google Sheets backend for RSVPs + visitor count |
| `assets/` | Illustration, Ganesha mark, link-preview image (all exported from the Figma file) |

## 1. Put it online (free)

Any static host works. The quickest is **Netlify Drop**: open https://app.netlify.com/drop and drag this whole folder in. You get a URL like `https://sindhu-anand.netlify.app`. GitHub Pages and Vercel also work.

Then, in `index.html`, change the `og:image` line to the full URL so WhatsApp shows the cover as the link preview:

```html
<meta property="og:image" content="https://YOUR-SITE/assets/og-cover.jpg">
```

## 2. Collect RSVPs in a Google Sheet (5 minutes)

1. Create a new Google Sheet → **Extensions → Apps Script**.
2. Replace the code with the contents of `apps-script.gs` and save.
3. **Deploy → New deployment → Web app**. Execute as **Me**, Who has access **Anyone**. Authorise it.
4. Copy the URL ending in `/exec` into `config.js` → `sheetUrl`, then re-upload the site.

Every RSVP becomes a row in the **RSVPs** tab: name, yes/no, events, guest count, phone, wishes, and which personal link they used. The same script keeps the visitor count.

No Google Sheet yet? Put your WhatsApp number in `config.js` → `hostWhatsApp` and each RSVP opens WhatsApp with a prefilled reply to you. If both are empty, the form asks guests to reply on WhatsApp.

## 3. Send the invitations

Open `https://YOUR-SITE/send.html`, paste one guest per line (`Priya & family, 919876543210`) and tap **Send on WhatsApp** next to each. Each link looks like `https://YOUR-SITE/?to=Priya%20%26%20family`, so the envelope reads "Specially for Priya & family" and the RSVP name is prefilled. Your list and which ones you've sent are remembered in that browser only.

## Notes

- **Visitor count:** counted once per phone or browser. Without `sheetUrl` it uses the free counter at abacus.jasoncameron.dev (key `counterKey` in `config.js`).
- **Tilt:** the card follows the phone's tilt. iPhones ask for motion permission when the envelope is tapped; if a guest declines, the card sways gently instead.
- **Preview locally:** `python3 -m http.server 8765` in this folder, then open http://localhost:8765/?to=Priya
- Add `?open` to a link to skip the envelope animation.
