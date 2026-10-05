// Edit these two values after deploying (see README.md).
window.INVITE_CONFIG = {
  // Google Apps Script web-app URL (ends in /exec). Stores RSVPs in your
  // Google Sheet and keeps the visitor count. Leave "" until it's set up.
  sheetUrl: "https://script.google.com/macros/s/AKfycbxlHBsFI7oJHH83SX38KGQHffJ3I6tp24jrjmXLfd10qOyvLCzgaFkrinah9vLourOIAw/exec",

  // Fallback when sheetUrl is empty: RSVPs open WhatsApp with a prefilled
  // reply to this number. Country code + number, digits only (e.g. "919876543210").
  hostWhatsApp: "",

  // Namespace for the free fallback visitor counter (used only when sheetUrl is empty).
  counterKey: "sindhu-anand-2026",

  // Google Maps link opened when guests tap the venue on the card.
  mapsUrl: "https://maps.app.goo.gl/E56zm4sS6qnPtL4U7",

  // Last day to RSVP, shown above the form.
  rsvpBy: "1st November 2026",
};
