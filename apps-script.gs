/**
 * RSVP + visitor counter backend for the wedding invitation.
 * Paste into Extensions → Apps Script of a Google Sheet, then
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * Copy the /exec URL into config.js → sheetUrl.
 */
const SHEET_NAME = "RSVPs";
const HEADERS = ["Time", "Name", "Attending", "Reception", "Wedding", "Guests", "Phone", "Message", "Invite link name", "Updated response"];

function doPost(e) {
  const p = e.parameter || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
    const clean = (v) => String(v || "").slice(0, 1000).replace(/^[=+\-@]/, "'$&"); // no formula injection
    sh.appendRow([
      new Date(), clean(p.name), clean(p.attending), clean(p.reception), clean(p.wedding),
      Number(p.guests) || 0, clean(p.phone), clean(p.message), clean(p.invitee), clean(p.updated),
    ]);
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

// GET ?action=hit increments the visitor count, ?action=get just reads it.
function doGet(e) {
  const action = (e.parameter && e.parameter.action) || "get";
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let n;
  try {
    n = Number(props.getProperty("visits") || 0);
    if (action === "hit") props.setProperty("visits", String(++n));
  } finally {
    lock.releaseLock();
  }
  return json({ value: n });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
