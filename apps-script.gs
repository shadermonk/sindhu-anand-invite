/**
 * RSVP + visitor counter backend for the wedding invitation.
 * Writes to the "Wedding RSVP" Google Sheet (SHEET_ID below).
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * The /exec URL goes into config.js → sheetUrl.
 */
const SHEET_ID = "1qbGwpraWMuoDJFeLkZJUV7HxpXBouEPiZ2yMrPB7R-M";
const SHEET_NAME = "RSVPs";
const STATS_NAME = "Stats";
const HEADERS = ["Submitted at", "Name", "Attending", "Reception", "Wedding", "Guests", "WhatsApp", "Wishes", "Invite link name", "Updated response"];

// Run once from the editor: creates the RSVPs tab with its columns and a Stats tab.
function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    const first = ss.getSheets()[0];
    sh = first.getLastRow() === 0 ? first.setName(SHEET_NAME) : ss.insertSheet(SHEET_NAME, 0);
  }
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight("bold").setBackground("#7e2a34").setFontColor("#fbe2ad");
  sh.setFrozenRows(1);
  sh.getRange("A:A").setNumberFormat("dd mmm yyyy, h:mm am/pm");
  sh.getRange("F:F").setNumberFormat("0");
  sh.setColumnWidths(1, HEADERS.length, 130);
  sh.setColumnWidth(2, 180);
  sh.setColumnWidth(8, 320);

  let st = ss.getSheetByName(STATS_NAME) || ss.insertSheet(STATS_NAME);
  st.getRange("A1:A4").setValues([["Visitors (unique devices)"], ["Attending (RSVPs)"], ["Declined (RSVPs)"], ["Guests expected"]]).setFontWeight("bold");
  st.getRange("B1").setValue(Number(PropertiesService.getScriptProperties().getProperty("visits") || 0));
  st.getRange("B2").setFormula(`=COUNTIF(${SHEET_NAME}!C2:C,"Yes")`);
  st.getRange("B3").setFormula(`=COUNTIF(${SHEET_NAME}!C2:C,"No")`);
  st.getRange("B4").setFormula(`=SUMIF(${SHEET_NAME}!C2:C,"Yes",${SHEET_NAME}!F2:F)`);
  st.setColumnWidth(1, 200);
}

function doPost(e) {
  const p = e.parameter || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) { setup(); sh = ss.getSheetByName(SHEET_NAME); }
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
    if (action === "hit") {
      props.setProperty("visits", String(++n));
      const st = SpreadsheetApp.openById(SHEET_ID).getSheetByName(STATS_NAME);
      if (st) st.getRange("B1").setValue(n);
    }
  } finally {
    lock.releaseLock();
  }
  return json({ value: n });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
