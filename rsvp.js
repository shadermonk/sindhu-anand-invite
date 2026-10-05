(() => {
  "use strict";

  const cfg = window.INVITE_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  const petals = window.Petals;
  const params = new URLSearchParams(location.search);
  const invitee = (params.get("to") || "").trim().slice(0, 60);

  // ───────── Close / back to the invitation ─────────
  const back = new URL("index.html", location.href);
  back.searchParams.set("open", "");
  if (invitee) back.searchParams.set("to", invitee);
  const backHref = "index.html" + back.search.replace("open=", "open");
  for (const a of document.querySelectorAll("#backBtn, #backBtn2, #backLink")) a.href = backHref;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#backBtn").click(); });

  const form = $("#rsvpForm");
  const guestsOut = $("#f-guests");
  let guests = 1;
  const setGuests = (n) => {
    guests = clamp(n, 1, 10);
    guestsOut.textContent = guests;
    $("#g-minus").disabled = guests <= 1;
    $("#g-plus").disabled = guests >= 10;
  };
  $("#g-minus").onclick = () => setGuests(guests - 1);
  $("#g-plus").onclick = () => setGuests(guests + 1);
  setGuests(1);
  $("#rsvpBy").textContent = cfg.rsvpBy || "1st November 2026";
  if (invitee) $("#f-name").value = invitee;
  const syncAttending = () => form.classList.toggle("declining", $("#f-no").checked);
  form.addEventListener("change", syncAttending);

  function showThanks(d) {
    const first = d.name.split(/[\s&,]/)[0] || d.name;
    $("#thanksTitle").textContent = d.attending === "Yes" ? `Thank you, ${first}!` : `Thank you, ${first}`;
    if (d.attending === "Yes") {
      const ev = [d.reception === "Yes" && "the reception", d.wedding === "Yes" && "the wedding"].filter(Boolean).join(" and ");
      $("#thanksText").textContent = `We've saved ${d.guests} ${d.guests === "1" ? "seat" : "seats"} for ${ev}. We can't wait to celebrate with you.`;
    } else {
      $("#thanksText").textContent = "We'll miss you there, and we're grateful for your blessings.";
    }
    form.hidden = true;
    $("#rsvp header").hidden = true; // they've replied, so no need to ask again
    $("#thanks").hidden = false;
  }
  const saved = store.get("rsvp");
  if (saved && saved.name) showThanks(saved);
  $("#editRsvp").onclick = () => {
    const d = store.get("rsvp") || {};
    $("#f-name").value = d.name || "";
    $("#f-phone").value = d.phone || "";
    $("#f-msg").value = d.message || "";
    (d.attending === "No" ? $("#f-no") : $("#f-yes")).checked = true;
    $("#f-reception").checked = d.reception !== "No";
    $("#f-wedding").checked = d.wedding !== "No";
    setGuests(Number(d.guests) || 1);
    syncAttending();
    $("#thanks").hidden = true;
    $("#rsvp header").hidden = false;
    form.hidden = false;
    $("#f-name").focus();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#formMsg");
    msg.textContent = "";
    const name = $("#f-name").value.trim();
    const yes = $("#f-yes").checked;
    if (!name) { msg.textContent = "Please add your name so we know who's coming."; $("#f-name").focus(); return; }
    if (yes && !$("#f-reception").checked && !$("#f-wedding").checked) { msg.textContent = "Pick at least one event, or choose Regretfully decline."; return; }
    const d = {
      name, attending: yes ? "Yes" : "No",
      reception: yes && $("#f-reception").checked ? "Yes" : "No",
      wedding: yes && $("#f-wedding").checked ? "Yes" : "No",
      guests: yes ? String(guests) : "0",
      phone: $("#f-phone").value.trim(),
      message: $("#f-msg").value.trim(),
      invitee,
      updated: store.get("rsvp") ? "Yes" : "No",
    };
    const btn = $("#submitBtn");
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      if (cfg.sheetUrl) {
        await fetch(cfg.sheetUrl, { method: "POST", mode: "no-cors", body: new URLSearchParams(d) });
      } else if (cfg.hostWhatsApp) {
        const lines = [`RSVP for Sindhu & Anand's wedding`, `Name: ${d.name}`, `Attending: ${d.attending}`];
        if (yes) lines.push(`Events: ${[d.reception === "Yes" && "Reception", d.wedding === "Yes" && "Wedding"].filter(Boolean).join(", ")}`, `Guests: ${d.guests}`);
        if (d.message) lines.push(`Wishes: ${d.message}`);
        window.open(`https://wa.me/${cfg.hostWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
      } else {
        throw new Error("not-configured");
      }
      store.set("rsvp", d);
      showThanks(d);
      if (yes) petals.burst(90);
    } catch (err) {
      msg.textContent = err.message === "not-configured"
        ? "RSVP isn't connected yet. Please reply to the family on WhatsApp for now."
        : "Couldn't send your RSVP. Check your connection and try again.";
    } finally {
      btn.disabled = false; btn.textContent = "Send RSVP";
    }
  });

})();
