/* Credit Care — credit repair & maintenance tracker.
   Educational tool only. All data stays in this browser's localStorage unless the owner turns on Sync.
   This app never asks for a Social Security number, full account or card numbers, PINs, passwords, or bank logins. */
(function () {
  "use strict";

  var KEY = "creditcare-state-v1";
  var THEME_KEY = "creditcare-theme";
  var TZ = "America/Chicago";
  var BUREAUS = ["Equifax", "Experian", "TransUnion"];
  var BUREAU_COLOR = { Equifax: "var(--eq)", Experian: "var(--ex)", TransUnion: "var(--tu)" };
  var BUREAU_HEX = { Equifax: ["#c8102e", "#ff5d73"], Experian: ["#2d5fa8", "#79a6ff"], TransUnion: ["#0fa3b1", "#4fd6e0"] };

  var LINKS = {
    acr: "https://www.annualcreditreport.com/",
    cfpbDispute: "https://www.consumerfinance.gov/ask-cfpb/how-do-i-dispute-an-error-on-my-credit-report-en-314/",
    cfpbLetters: "https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/sample-letters-dispute-credit-report-information/",
    cfpbHowLong: "https://www.consumerfinance.gov/ask-cfpb/how-long-does-negative-information-remain-on-my-credit-report-en-323/",
    cfpbAccurate: "https://www.consumerfinance.gov/ask-cfpb/is-it-possible-to-remove-accurate-negative-information-from-my-credit-report-en-1249/",
    cfpbGoodScore: "https://www.consumerfinance.gov/ask-cfpb/how-do-i-get-and-keep-a-good-credit-score-en-318/",
    cfpbUnderstand: "https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/understand-your-credit-score/",
    cfpbFreeze: "https://www.consumerfinance.gov/archive/blog/free-credit-freezes-are-here/",
    cfpbScam: "https://www.consumerfinance.gov/ask-cfpb/how-can-i-tell-a-credit-repair-scam-from-a-reputable-credit-counselor-en-1343/",
    cfpbComplaint: "https://www.consumerfinance.gov/complaint/",
    ftcRepairPdf: "https://www.govinfo.gov/content/pkg/GOVPUB-FT-PURL-gpo52584/pdf/GOVPUB-FT-PURL-gpo52584.pdf",
    fcra605: "https://www.law.cornell.edu/uscode/text/15/1681c",
    fcra611: "https://www.law.cornell.edu/uscode/text/15/1681i",
    idTheft: "https://www.identitytheft.gov/",
    myficoFactors: "https://www.myfico.com/credit-education/whats-in-your-credit-score",
    myficoUtil: "https://www.myfico.com/credit-education/blog/credit-utilization-be",
    myficoImprove: "https://www.myfico.com/credit-education/improve-your-credit-score",
    experianBk: "https://www.experian.com/blogs/ask-experian/when-does-bankruptcy-fall-off-my-credit-report/"
  };
  var BUREAU_LINKS = {
    Equifax: {
      dispute: "https://www.equifax.com/personal/credit-report-services/credit-dispute/",
      contact: "https://www.equifax.com/personal/contact-us/",
      phone: "(866) 349-5191",
      freeze: "https://www.equifax.com/personal/credit-report-services/credit-freeze/",
      fraud: "https://www.equifax.com/personal/credit-report-services/credit-fraud-alerts/"
    },
    Experian: {
      dispute: "https://www.experian.com/disputes/main.html",
      contact: "https://www.experian.com/disputes/main.html",
      phone: "(888) 397-3742",
      freeze: "https://www.experian.com/freeze/center.html",
      fraud: "https://www.experian.com/fraud/center.html"
    },
    TransUnion: {
      dispute: "https://www.transunion.com/credit-disputes/dispute-your-credit",
      contact: "https://www.transunion.com/credit-disputes/dispute-your-credit/mail-or-phone",
      phone: "(800) 916-8800",
      freeze: "https://www.transunion.com/credit-freeze",
      fraud: "https://www.transunion.com/fraud-alerts"
    }
  };

  var NAV = [
    { id: "dashboard", label: "Dashboard", ico: "\u25D4", group: "Track" },
    { id: "accounts", label: "Accounts", ico: "\u{1F4B3}", group: "Track" },
    { id: "report", label: "Report Review", ico: "\u{1F50E}", group: "Repair" },
    { id: "disputes", label: "Disputes", ico: "\u2696\uFE0F", group: "Repair" },
    { id: "letters", label: "Letter Writer", ico: "\u270D\uFE0F", group: "Repair" },
    { id: "plan", label: "Repair Plan", ico: "\u{1F6E0}\uFE0F", group: "Repair" },
    { id: "maintain", label: "Maintenance", ico: "\u{1F6E1}\uFE0F", group: "Keep it healthy" },
    { id: "learn", label: "Learn", ico: "\u{1F4D8}", group: "Keep it healthy" },
    { id: "sync", label: "Sync", ico: "\u{1F504}", group: "More" },
    { id: "settings", label: "Settings & Backup", ico: "\u2699\uFE0F", group: "More" }
  ];
  var TABS = ["dashboard", "accounts", "disputes", "plan"];

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function nowISO() { return new Date().toISOString(); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dstr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function todayStr() { return dstr(new Date()); }
  function parseDate(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
    var p = s.slice(0, 10).split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function fmtDate(s) {
    var d = typeof s === "string" ? parseDate(s) : s;
    return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  }
  function fmtShort(s) {
    var d = typeof s === "string" ? parseDate(s) : s;
    return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  }
  function addDays(s, n) { var d = parseDate(s); if (!d) return ""; d.setDate(d.getDate() + n); return dstr(d); }
  function addYears(s, n) {
    var d = parseDate(s); if (!d) return "";
    var m = d.getMonth(); d.setFullYear(d.getFullYear() + n);
    if (d.getMonth() !== m) d.setDate(0);
    return dstr(d);
  }
  function daysUntil(s) {
    var d = parseDate(s); if (!d) return null;
    var t = parseDate(todayStr());
    return Math.round((d - t) / 86400000);
  }
  function num(v) {
    if (v == null || v === "") return null;
    var n = parseFloat(String(v).replace(/[$,%\s]/g, ""));
    return isFinite(n) ? n : null;
  }
  function money(n, dec) {
    if (n == null || !isFinite(n)) return "—";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: dec === 0 ? 0 : 2, maximumFractionDigits: dec === 0 ? 0 : 2 });
  }
  function pct(n, dec) { return n == null || !isFinite(n) ? "—" : n.toFixed(dec == null ? 1 : dec) + "%"; }
  function plural(n, w, pw) { return n + " " + (n === 1 ? w : (pw || w + "s")); }
  function relDays(n) {
    if (n == null) return "";
    if (n === 0) return "today";
    if (n === 1) return "tomorrow";
    if (n === -1) return "yesterday";
    return n > 0 ? "in " + plural(n, "day") : plural(-n, "day") + " ago";
  }
  function src(label, url) { return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + "</a>"; }
  function last4(v) { var s = String(v || "").replace(/\D/g, ""); return s.slice(-4); }
  function monthKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1); }
  function monthLabel(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }); }

  /* ---------- state ---------- */
  function emptyState() {
    var s = { version: 1, settings: {}, settingsTimes: {}, tombstones: CreditSync.emptyTombs() };
    CreditSync.LIST_KEYS.forEach(function (k) { s[k] = []; });
    CreditSync.FLAG_KEYS.forEach(function (k) { s[k] = {}; });
    return s;
  }
  function load() {
    var s;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { s = null; }
    var base = emptyState();
    if (!s || typeof s !== "object") return base;
    CreditSync.LIST_KEYS.forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
    CreditSync.FLAG_KEYS.forEach(function (k) { if (!s[k] || typeof s[k] !== "object") s[k] = {}; });
    s.settings = s.settings || {};
    s.settingsTimes = s.settingsTimes || {};
    var t = s.tombstones || {};
    Object.keys(base.tombstones).forEach(function (k) { if (!t[k]) t[k] = {}; });
    s.tombstones = t;
    return s;
  }
  var state = load();
  var ui = { edit: {}, scoreModel: "all", reviewBureau: "Equifax", letterType: "bureau", letterItems: 1, payMethod: "avalanche", target: 10 };

  function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast("Could not save on this device."); } }
  function save() { persist(); schedulePush(); }
  function find(key, id) { return state[key].filter(function (x) { return x.id === id; })[0] || null; }
  function upsert(key, obj) {
    var t = nowISO();
    obj.updatedAt = t;
    if (obj.id && find(key, obj.id)) {
      state[key] = state[key].map(function (x) { return x.id === obj.id ? Object.assign({}, x, obj) : x; });
    } else {
      obj.id = obj.id || uid();
      obj.createdAt = t;
      state[key].push(obj);
    }
    save();
    return obj;
  }
  function removeItem(key, id) {
    state[key] = state[key].filter(function (x) { return x.id !== id; });
    state.tombstones[key][id] = nowISO();
    save();
  }
  function getFlag(key, a, b) {
    var e = (state[key][a] || {})[b];
    if (e && typeof e === "object") return e.value;
    return e;
  }
  function setFlag(key, a, b, value) {
    if (!state[key][a]) state[key][a] = {};
    state[key][a][b] = { value: value, updatedAt: nowISO() };
    save();
  }
  function setting(k, d) { var v = state.settings[k]; return v == null ? d : v; }
  function setSetting(k, v) { state.settings[k] = v; state.settingsTimes[k] = nowISO(); }

  /* ---------- toast ---------- */
  var toastTimer = 0;
  function toast(msg) {
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ---------- domain calculations ---------- */
  var REVOLVING = ["Credit card", "Store card", "Line of credit"];
  var CLOSED_STATUSES = ["Closed", "Paid off"];
  function isRevolving(a) { return REVOLVING.indexOf(a.type) !== -1; }
  function isOpen(a) { return CLOSED_STATUSES.indexOf(a.status) === -1; }
  function utilOf(a) {
    var lim = num(a.limit), bal = num(a.balance);
    if (!lim || lim <= 0 || bal == null) return null;
    return Math.max(0, bal) / lim * 100;
  }
  function overallUtil() {
    var lim = 0, bal = 0, n = 0;
    state.accounts.forEach(function (a) {
      if (!isRevolving(a) || !isOpen(a)) return;
      var l = num(a.limit), b = num(a.balance);
      if (!l || l <= 0) return;
      lim += l; bal += Math.max(0, b || 0); n++;
    });
    return { limit: lim, balance: bal, count: n, pct: lim > 0 ? bal / lim * 100 : null };
  }
  function utilBand(p) {
    if (p == null) return { cls: "", label: "No data", color: "var(--muted)" };
    if (p < 10) return { cls: "good", label: "Under 10%", color: "var(--good)" };
    if (p < 30) return { cls: "ok", label: "Under 30%", color: "var(--ok)" };
    if (p < 50) return { cls: "warn", label: "30% or more", color: "var(--warn)" };
    return { cls: "bad", label: "50% or more", color: "var(--bad)" };
  }
  function modelGroup(m) { return /vantage/i.test(m || "") ? "VantageScore" : /fico/i.test(m || "") ? "FICO" : "Other"; }
  function ficoRange(score) {
    // Ranges published by myFICO for base FICO Scores (300–850).
    if (score >= 800) return { label: "Exceptional", cls: "good" };
    if (score >= 740) return { label: "Very good", cls: "good" };
    if (score >= 670) return { label: "Good", cls: "ok" };
    if (score >= 580) return { label: "Fair", cls: "warn" };
    return { label: "Poor", cls: "bad" };
  }
  function sortedScores() {
    return state.scores.slice().sort(function (a, b) { return (a.date || "").localeCompare(b.date || "") || (a.createdAt || "").localeCompare(b.createdAt || ""); });
  }
  function latestByBureau(bureau) {
    var list = sortedScores().filter(function (s) { return s.bureau === bureau; });
    var last = list[list.length - 1] || null;
    var prev = null;
    if (last) {
      var same = list.filter(function (s) { return s.model === last.model && s !== last; });
      prev = same[same.length - 1] || null;
    }
    return { last: last, prev: prev };
  }
  function nextDueDate(day) {
    day = parseInt(day, 10);
    if (!day || day < 1 || day > 31) return "";
    var t = parseDate(todayStr());
    function mk(y, m) { var dim = new Date(y, m + 1, 0).getDate(); return new Date(y, m, Math.min(day, dim)); }
    var d = mk(t.getFullYear(), t.getMonth());
    if (d < t) d = mk(t.getFullYear(), t.getMonth() + 1);
    return dstr(d);
  }

  /* Negative item reporting periods (FCRA §605, 15 U.S.C. §1681c; inquiries per myFICO). */
  var NEG_TYPES = {
    late: { label: "Late payment", years: 7, dateLabel: "Date of the late payment", rule: "Up to 7 years from the late payment (FCRA §605(a)(5))." },
    collection: { label: "Collection account", years: 7, plus180: true, dateLabel: "Date of first delinquency (when you first fell behind)", rule: "7 years, counted from 180 days after the delinquency that led to the collection began (FCRA §605(a)(4) and (c))." },
    chargeoff: { label: "Charge-off", years: 7, plus180: true, dateLabel: "Date of first delinquency (when you first fell behind)", rule: "7 years, counted from 180 days after the delinquency that led to the charge-off began (FCRA §605(a)(4) and (c))." },
    inquiry: { label: "Hard inquiry", years: 2, dateLabel: "Date of the inquiry", rule: "Inquiries stay on your report for 2 years; FICO Scores only count the last 12 months (myFICO)." },
    bk7: { label: "Bankruptcy — Chapter 7", years: 10, dateLabel: "Date filed", rule: "Up to 10 years (FCRA §605(a)(1)); Experian lists 10 years from the filing date." },
    bk13: { label: "Bankruptcy — Chapter 13", years: 7, dateLabel: "Date filed", rule: "The law allows up to 10 years, but the credit bureaus remove Chapter 13 after 7 years from filing (per Experian)." },
    judgment: { label: "Civil judgment / lawsuit", years: 7, dateLabel: "Date entered", rule: "7 years from entry, or until the statute of limitations runs out, whichever is longer (FCRA §605(a)(2))." },
    publicrecord: { label: "Other public record / adverse item", years: 7, dateLabel: "Date reported", rule: "Most other negative items: up to 7 years (FCRA §605(a)(5))." },
    wronginfo: { label: "Wrong personal information", years: 0, dateLabel: "Date you found it", rule: "Not something that ages off — dispute it so it is corrected." },
    idtheft: { label: "Identity theft account", years: 0, dateLabel: "Date you found it", rule: "Not something that ages off — report it at IdentityTheft.gov and dispute it with each bureau." }
  };
  function ageOff(n) {
    var t = NEG_TYPES[n.type];
    if (!t || !t.years || !n.date) return "";
    var start = t.plus180 ? addDays(n.date, 180) : n.date;
    return addYears(start, t.years);
  }
  function timeLeft(dateStr) {
    var d = daysUntil(dateStr);
    if (d == null) return "";
    if (d <= 0) return "Past the reporting limit";
    var y = Math.floor(d / 365), m = Math.floor((d % 365) / 30.44);
    if (y === 0 && m === 0) return plural(d, "day") + " left";
    return (y ? plural(y, "year") + " " : "") + (m ? plural(m, "month") : "") + " left";
  }

  /* Disputes: 30 days from when the bureau receives it, up to 15 more if you send relevant info during the 30 days (FCRA §611(a)(1)). */
  function disputeDeadline(d) {
    var base = d.received || d.sent;
    if (!base) return "";
    return addDays(base, 30 + (d.extended ? 15 : 0));
  }
  function disputeOpen(d) { return !d.outcome || d.outcome === "Pending"; }

  /* Maintenance routines */
  var ROUTINES = {
    m: { label: "Monthly", items: [
      { id: "util", t: "Update balances here and check your utilization", d: "Open Accounts and enter this month's statement balances." },
      { id: "ontime", t: "Confirm every bill was paid on time", d: "Mark each account in the on-time payment tracker." },
      { id: "autopay", t: "Check that autopay is still on for each account", d: "At least the minimum payment, so nothing is ever late." },
      { id: "stmts", t: "Review card statements for charges you don't recognize", d: "Report anything unfamiliar to the card company right away." }
    ] },
    q: { label: "Quarterly", items: [
      { id: "pull", t: "Pull a free report from at least one bureau", d: "AnnualCreditReport.com lets you check each bureau for free every week." },
      { id: "scores", t: "Log your latest scores on the Dashboard", d: "Note the bureau and the score model so the trend is accurate." },
      { id: "inquiries", t: "Look for hard inquiries you didn't approve", d: "An unfamiliar inquiry can be a sign of identity theft." },
      { id: "disputes", t: "Follow up on any open disputes", d: "Record the outcome when you get the written results." }
    ] },
    y: { label: "Yearly", items: [
      { id: "full", t: "Full review of all three reports (Equifax, Experian, TransUnion)", d: "Use the guided checklist in Report Review." },
      { id: "freeze", t: "Confirm your credit freezes are still in place", d: "Check your status on each bureau's site." },
      { id: "limits", t: "Review your credit limits and annual fees", d: "Closing a card lowers your available credit, which can raise utilization." },
      { id: "plan", t: "Update your payoff plan and goals", d: "Revisit the Repair Plan with your current balances and rates." }
    ] }
  };
  function periodKey(kind, d) {
    d = d || new Date();
    if (kind === "m") return "m-" + monthKey(d);
    if (kind === "q") return "q-" + d.getFullYear() + "-Q" + (Math.floor(d.getMonth() / 3) + 1);
    return "y-" + d.getFullYear();
  }
  function periodLabel(kind, d) {
    d = d || new Date();
    if (kind === "m") return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (kind === "q") return "Q" + (Math.floor(d.getMonth() / 3) + 1) + " " + d.getFullYear();
    return String(d.getFullYear());
  }
  function prevPeriodDate(kind) {
    var d = new Date(); d.setDate(1);
    if (kind === "m") d.setMonth(d.getMonth() - 1);
    else if (kind === "q") d.setMonth(d.getMonth() - 3);
    else d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  function routineProgress(kind, d) {
    var key = periodKey(kind, d), items = ROUTINES[kind].items;
    var done = items.filter(function (it) { return !!getFlag("routines", key, it.id); }).length;
    return { key: key, done: done, total: items.length };
  }

  /* Report review checklist */
  var REVIEW_ITEMS = [
    { id: "name", t: "Your name, spellings, and nicknames are correct" },
    { id: "addr", t: "Current and past addresses are ones you actually lived at" },
    { id: "emp", t: "Employer and phone numbers are correct (or blank)" },
    { id: "mine", t: "Every account listed is yours — no accounts you don't recognize" },
    { id: "bal", t: "Balances and credit limits match your latest statements" },
    { id: "pay", t: "Payment history is right — no late marks for months you paid on time" },
    { id: "closed", t: "Accounts you closed show as \u201Cclosed by consumer\u201D" },
    { id: "dupes", t: "No debt is listed twice (for example, by the original creditor and a collector as both still owed)" },
    { id: "old", t: "No negative item is older than its reporting limit" },
    { id: "inq", t: "You recognize every hard inquiry" },
    { id: "pub", t: "Any public records (such as bankruptcy) are accurate" }
  ];
  function lastReview(bureau) {
    var r = state.reviews.filter(function (x) { return x.bureau === bureau; }).sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });
    return r[0] || null;
  }

  /* Health checklist */
  function healthItems() {
    var u = overallUtil();
    var open = state.accounts.filter(isOpen);
    var yearAgo = addYears(todayStr(), -1);
    var reviewed = BUREAUS.filter(function (b) { var r = lastReview(b); return r && r.date >= yearAgo; });
    var lateAcc = open.filter(function (a) { return a.status && a.status !== "Current"; });
    var noAuto = open.filter(function (a) { return !a.autopay; });
    var overdue = state.disputes.filter(function (d) { return disputeOpen(d) && daysUntil(disputeDeadline(d)) < 0; });
    var frozen = BUREAUS.filter(function (b) { return !!getFlag("flags", "freeze", b); });
    var m = routineProgress("m");
    return [
      { t: "All three reports reviewed in the last 12 months", ok: reviewed.length === 3 ? true : false, d: reviewed.length + " of 3 reviewed", href: "#/report" },
      { t: "Overall credit card utilization under 30%", ok: u.pct == null ? null : u.pct < 30, d: u.pct == null ? "Add cards with limits to check" : pct(u.pct) + " used", href: "#/accounts" },
      { t: "Every open account is current", ok: open.length ? lateAcc.length === 0 : null, d: open.length ? (lateAcc.length ? plural(lateAcc.length, "account") + " not current" : "All current") : "Add your accounts", href: "#/accounts" },
      { t: "Autopay is on for every open account", ok: open.length ? noAuto.length === 0 : null, d: open.length ? (noAuto.length ? plural(noAuto.length, "account") + " without autopay" : "All set") : "Add your accounts", href: "#/accounts" },
      { t: "No disputes past their deadline without an answer", ok: state.disputes.length ? overdue.length === 0 : null, d: state.disputes.length ? (overdue.length ? plural(overdue.length, "dispute") + " overdue" : "On track") : "No disputes logged", href: "#/disputes" },
      { t: "This month's maintenance routine is done", ok: m.done === m.total, d: m.done + " of " + m.total + " done", href: "#/maintain" },
      { t: "Credit freeze at all three bureaus (optional)", ok: frozen.length === 3 ? true : (frozen.length ? false : false), d: frozen.length + " of 3 marked frozen", href: "#/maintain" }
    ];
  }

  /* Reminders */
  function upcoming() {
    var out = [];
    state.accounts.filter(isOpen).forEach(function (a) {
      var nd = nextDueDate(a.dueDay);
      if (!nd) return;
      var n = daysUntil(nd);
      if (n <= 14) out.push({ date: nd, kind: "Payment", t: (a.nickname || "Account") + " payment due" + (a.autopay ? " (autopay on)" : ""), cls: a.autopay ? "info" : (n <= 3 ? "warn" : "info"), href: "#/accounts" });
    });
    state.disputes.filter(disputeOpen).forEach(function (d) {
      var dl = disputeDeadline(d);
      if (!dl) return;
      var n = daysUntil(dl);
      if (n <= 10) out.push({ date: dl, kind: "Dispute", t: "Investigation deadline: " + (d.item || "dispute") + " (" + (d.to || "") + ")", cls: n < 0 ? "bad" : "warn", href: "#/disputes" });
    });
    state.negatives.forEach(function (ng) {
      var ao = ageOff(ng);
      if (!ao || ng.status === "Removed") return;
      var n = daysUntil(ao);
      if (n <= 60 && n >= -30) out.push({ date: ao, kind: "Ages off", t: (NEG_TYPES[ng.type] || {}).label + " from " + (ng.creditor || "creditor") + " should come off — check your report", cls: "good", href: "#/report" });
    });
    state.reminders.forEach(function (r) {
      if (r.done) return;
      out.push({ date: r.date, kind: "Reminder", t: r.title, cls: daysUntil(r.date) < 0 ? "bad" : "info", id: r.id });
    });
    ["m", "q"].forEach(function (k) {
      var p = routineProgress(k);
      if (p.done < p.total) out.push({ date: "", kind: "Routine", t: ROUTINES[k].label + " routine (" + periodLabel(k) + "): " + p.done + " of " + p.total + " done", cls: "info", href: "#/maintain" });
    });
    out.sort(function (a, b) { return (a.date || "9999").localeCompare(b.date || "9999"); });
    return out;
  }

  /* ---------- small UI builders ---------- */
  function head(kicker, title, lead) {
    return '<div class="page-head"><p class="kicker">' + esc(kicker) + "</p><h1>" + esc(title) + "</h1>" + (lead ? '<p class="lead">' + lead + "</p>" : "") + "</div>";
  }
  function inp(label, name, value, attrs) {
    return '<div class="field"><label><span>' + esc(label) + '</span><input name="' + name + '" value="' + esc(value == null ? "" : value) + '" ' + (attrs || "") + "></label></div>";
  }
  function sel(label, name, options, value, attrs) {
    return '<div class="field"><label><span>' + esc(label) + '</span><select name="' + name + '" ' + (attrs || "") + ">" +
      options.map(function (o) {
        var v = typeof o === "object" ? o.v : o, t = typeof o === "object" ? o.t : o;
        return '<option value="' + esc(v) + '"' + (String(v) === String(value == null ? "" : value) ? " selected" : "") + ">" + esc(t) + "</option>";
      }).join("") + "</select></label></div>";
  }
  function area(label, name, value, attrs) {
    return '<div class="field"><label><span>' + esc(label) + '</span><textarea name="' + name + '" ' + (attrs || "") + ">" + esc(value || "") + "</textarea></label></div>";
  }
  function moneyIn(label, name, value) { return inp(label, name, value, 'inputmode="decimal" placeholder="0.00" autocomplete="off"'); }
  function last4In(label, name, value) {
    return inp(label, name, value, 'inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="Last 4 only (optional)" autocomplete="off" title="Last 4 digits only"');
  }
  function emptyBox(msg) { return '<div class="empty">' + msg + "</div>"; }
  function disclaimer() {
    return '<p class="disclaimer">Credit Care is an educational tool, not legal or financial advice. It does not contact the credit bureaus or your lenders for you. Check the official sources linked in the app before you act. Your information stays on this device unless you turn on Sync.</p>';
  }

  /* ---------- chart ---------- */
  function scoreChart(list) {
    var narrow = window.innerWidth < 640;
    var W = narrow ? 400 : 760, H = narrow ? 250 : 270, L = 40, R = 12, T = 16, B = 34;
    if (!list.length) return emptyBox("Your score trend will appear here after you add a score.");
    var vals = list.map(function (s) { return +s.score; });
    var lo = Math.max(300, Math.floor((Math.min.apply(null, vals) - 30) / 50) * 50);
    var hi = Math.min(850, Math.ceil((Math.max.apply(null, vals) + 30) / 50) * 50);
    if (hi - lo < 100) { hi = Math.min(850, lo + 100); lo = Math.max(300, hi - 100); }
    var times = list.map(function (s) { return parseDate(s.date).getTime(); });
    var t0 = Math.min.apply(null, times), t1 = Math.max.apply(null, times);
    if (t1 === t0) { t0 -= 15 * 86400000; t1 += 15 * 86400000; }
    function x(t) { return L + (t - t0) / (t1 - t0) * (W - L - R); }
    function y(v) { return T + (hi - v) / (hi - lo) * (H - T - B); }
    var dark = document.documentElement.dataset.theme === "dark";
    var svg = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Score trend chart">';
    for (var g = lo; g <= hi; g += 50) {
      svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="' + (dark ? "#1f4250" : "#dde8eb") + '" stroke-width="1"/>';
      svg += '<text x="' + (L - 8) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="12" fill="' + (dark ? "#9db3ba" : "#5a6f78") + '">' + g + "</text>";
    }
    var ticks = [t0, (t0 + t1) / 2, t1];
    ticks.forEach(function (t, i) {
      svg += '<text x="' + x(t) + '" y="' + (H - 10) + '" text-anchor="' + (i === 0 ? "start" : i === 2 ? "end" : "middle") + '" font-size="12" fill="' + (dark ? "#9db3ba" : "#5a6f78") + '">' + esc(fmtDate(new Date(t))) + "</text>";
    });
    BUREAUS.forEach(function (b) {
      var pts = list.filter(function (s) { return s.bureau === b; });
      if (!pts.length) return;
      var col = BUREAU_HEX[b][dark ? 1 : 0];
      var path = pts.map(function (s, i) { return (i ? "L" : "M") + x(parseDate(s.date).getTime()).toFixed(1) + " " + y(+s.score).toFixed(1); }).join(" ");
      svg += '<path d="' + path + '" fill="none" stroke="' + col + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
      pts.forEach(function (s) {
        var cx = x(parseDate(s.date).getTime()), cy = y(+s.score);
        svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5" fill="' + col + '" stroke="' + (dark ? "#0d2630" : "#fff") + '" stroke-width="2"><title>' + esc(b + " " + s.model + ": " + s.score + " on " + fmtDate(s.date)) + "</title></circle>";
      });
    });
    svg += "</svg>";
    svg += '<div class="legend">' + BUREAUS.map(function (b) { return '<span><i style="background:' + BUREAU_COLOR[b] + '"></i>' + b + "</span>"; }).join("") + "</div>";
    return svg;
  }

  /* ---------- views ---------- */
  function viewDashboard() {
    var u = overallUtil(), ub = utilBand(u.pct);
    var isEmpty = !state.scores.length && !state.accounts.length && !state.negatives.length && !state.disputes.length;
    var h = head("Dashboard", "Your credit at a glance", "Today is " + esc(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: TZ })) + ".");
    if (isEmpty) {
      h += '<div class="card"><h2>Get started in three steps</h2><ol class="steps">' +
        '<li>Get your free credit reports from all three bureaus at ' + src("AnnualCreditReport.com", LINKS.acr) + ". It's the official site, it's free every week, and checking your own report doesn't hurt your score.</li>" +
        "<li>Add your scores below. Write down which bureau and which score model (FICO or VantageScore) each one is.</li>" +
        '<li>Add your credit cards and loans on the <a href="#/accounts">Accounts</a> page so the app can work out your utilization and payoff plan.</li></ol></div>';
    }
    h += '<div class="grid g4 mt">';
    BUREAUS.forEach(function (b) {
      var lb = latestByBureau(b), s = lb.last;
      var change = s && lb.prev ? (+s.score - +lb.prev.score) : null;
      h += '<div class="stat"><span class="bar" style="background:' + BUREAU_COLOR[b] + '"></span><div class="lbl">' + b + "</div>" +
        '<div class="val">' + (s ? esc(s.score) : "—") + "</div>" +
        '<div class="sub">' + (s ? esc(s.model) + " · " + esc(fmtShort(s.date)) : "No score yet") +
        (change != null ? ' · <b style="color:' + (change >= 0 ? "var(--good)" : "var(--bad)") + '">' + (change >= 0 ? "+" : "") + change + "</b>" : "") + "</div>" +
        (s && modelGroup(s.model) === "FICO" ? '<span class="pill ' + ficoRange(+s.score).cls + '" style="margin-top:6px">' + ficoRange(+s.score).label + "</span>" : "") + "</div>";
    });
    h += '<div class="stat"><span class="bar" style="background:' + ub.color + '"></span><div class="lbl">Card utilization</div><div class="val">' + pct(u.pct) + '</div><div class="sub">' +
      (u.count ? money(u.balance, 0) + " of " + money(u.limit, 0) : "Add cards with limits") + "</div>" + (u.pct != null ? '<span class="pill ' + ub.cls + '" style="margin-top:6px">' + ub.label + "</span>" : "") + "</div></div>";

    var filtered = sortedScores().filter(function (s) { return ui.scoreModel === "all" || modelGroup(s.model) === ui.scoreModel; });
    h += '<div class="card mt"><div class="row between"><h2>Score trend</h2><div class="tabs">' +
      [["all", "All models"], ["FICO", "FICO"], ["VantageScore", "VantageScore"]].map(function (t) {
        return '<button type="button" data-action="score-model" data-v="' + t[0] + '" class="' + (ui.scoreModel === t[0] ? "on" : "") + '">' + t[1] + "</button>";
      }).join("") + "</div></div>" + scoreChart(filtered) +
      '<p class="help">Scores from different models (FICO vs VantageScore) and versions are calculated differently, so compare a score with earlier scores from the same model. FICO labels: Exceptional 800+, Very good 740–799, Good 670–739, Fair 580–669, Poor under 580 (' + src("myFICO", "https://www.myfico.com/credit-education/credit-scores") + ").</p>" +
      '<h3>Add a score</h3><form data-form="score" class="form-grid" autocomplete="off">' +
      inp("Date", "date", todayStr(), 'type="date" required') +
      sel("Bureau", "bureau", BUREAUS, "Equifax") +
      sel("Score model", "model", ["FICO Score 8", "FICO Score 9", "FICO Score 10", "FICO (other version)", "VantageScore 3.0", "VantageScore 4.0", "Other / not sure"], "FICO Score 8") +
      inp("Score", "score", "", 'type="number" min="300" max="850" required placeholder="300–850"') +
      inp("Where you got it (optional)", "source", "", 'maxlength="60" placeholder="e.g. card app, lender"') +
      '<div class="field"><span>&nbsp;</span><button class="btn primary" type="submit">Add score</button></div></form>';
    var recent = sortedScores().reverse().slice(0, ui.allScores ? 999 : 6);
    if (recent.length) {
      h += '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Bureau</th><th>Model</th><th>Score</th><th></th></tr></thead><tbody>' +
        recent.map(function (s) {
          return "<tr><td>" + esc(fmtDate(s.date)) + "</td><td>" + esc(s.bureau) + "</td><td>" + esc(s.model) + (s.source ? '<div class="help">' + esc(s.source) + "</div>" : "") + "</td><td><b>" + esc(s.score) + '</b></td><td><button class="btn small ghost" data-action="del" data-key="scores" data-id="' + s.id + '" aria-label="Delete score">✕</button></td></tr>';
        }).join("") + "</tbody></table></div>" + (state.scores.length > 6 ? '<p><button class="btn small" data-action="all-scores">' + (ui.allScores ? "Show fewer" : "Show all " + state.scores.length + " scores") + "</button></p>" : "");
    }
    h += "</div>";

    var hi = healthItems(), okN = hi.filter(function (x) { return x.ok === true; }).length, tot = hi.filter(function (x) { return x.ok !== null; }).length;
    var p = tot ? Math.round(okN / tot * 100) : 0;
    h += '<div class="grid g2 mt"><div class="card"><div class="row" style="gap:16px;align-items:center"><div class="ring" style="--p:' + p + '"><b>' + okN + "/" + tot + '</b></div><div><h2 style="margin:0">Credit health checklist</h2><p class="help">Updated from what you enter in the app.</p></div></div><ul class="list">' +
      hi.map(function (x) {
        return '<li><span class="status-ico ' + (x.ok === true ? "y" : x.ok === false ? "n" : "na") + '">' + (x.ok === true ? "✓" : x.ok === false ? "!" : "–") + '</span><div><a href="' + x.href + '" style="color:inherit;font-weight:600;text-decoration:none">' + esc(x.t) + '</a><div class="help">' + esc(x.d) + "</div></div></li>";
      }).join("") + "</ul></div>";
    var up = upcoming();
    h += '<div class="card"><h2>Upcoming reminders</h2>' + (up.length ? '<ul class="list">' + up.slice(0, 10).map(function (r) {
      var n = r.date ? daysUntil(r.date) : null;
      return '<li><span class="pill ' + r.cls + '">' + esc(r.kind) + '</span><div style="flex:1"><div style="font-weight:600">' + (r.href ? '<a href="' + r.href + '" style="color:inherit;text-decoration:none">' + esc(r.t) + "</a>" : esc(r.t)) + "</div>" +
        (r.date ? '<div class="help">' + esc(fmtDate(r.date)) + " · " + relDays(n) + "</div>" : "") + "</div>" +
        (r.id ? '<button class="btn small" data-action="reminder-done" data-id="' + r.id + '">Done</button>' : "") + "</li>";
    }).join("") + "</ul>" : emptyBox("Nothing coming up.")) +
      '<h3>Add a reminder</h3><form data-form="reminder" class="form-grid" autocomplete="off">' + inp("What", "title", "", 'required maxlength="80" placeholder="e.g. Call card company"') + inp("When", "date", addDays(todayStr(), 7), 'type="date" required') +
      '<div class="field"><span>&nbsp;</span><button class="btn primary" type="submit">Add</button></div></form></div></div>';
    return h + disclaimer();
  }

  function accountForm(a) {
    a = a || {};
    var types = ["Credit card", "Store card", "Line of credit", "Auto loan", "Mortgage", "Student loan", "Personal loan", "Other loan"];
    var statuses = ["Current", "30 days late", "60 days late", "90+ days late", "In collection", "Charged off", "Closed", "Paid off"];
    return '<form data-form="account" autocomplete="off"><input type="hidden" name="id" value="' + esc(a.id || "") + '"><div class="form-grid">' +
      inp("Nickname", "nickname", a.nickname, 'required maxlength="40" placeholder="e.g. Blue rewards card"') +
      sel("Type", "type", types, a.type || "Credit card") +
      last4In("Last 4 digits", "last4", a.last4) +
      moneyIn("Credit limit (cards) or original amount (loans)", "limit", a.limit) +
      moneyIn("Current balance", "balance", a.balance) +
      inp("Interest rate (APR %)", "apr", a.apr, 'inputmode="decimal" placeholder="e.g. 24.99"') +
      moneyIn("Minimum monthly payment", "minPay", a.minPay) +
      inp("Due day of the month", "dueDay", a.dueDay, 'type="number" min="1" max="31" placeholder="1–31"') +
      sel("Status", "status", statuses, a.status || "Current") +
      sel("Autopay", "autopay", [{ v: "1", t: "On" }, { v: "", t: "Off" }], a.autopay ? "1" : "") +
      "</div>" + area("Notes (optional)", "notes", a.notes, 'maxlength="400" rows="2" placeholder="No full account numbers, please."') +
      '<p class="help">Only the last 4 digits are allowed. Never enter a full card or account number, PIN, or password.</p>' +
      '<div class="row"><button class="btn primary" type="submit">' + (a.id ? "Save changes" : "Add account") + "</button>" + (a.id ? '<button class="btn" type="button" data-action="cancel-edit" data-key="accounts">Cancel</button>' : "") + "</div></form>";
  }

  function payDownHtml() {
    var t = ui.target, u = overallUtil();
    var cards = state.accounts.filter(function (a) { return isRevolving(a) && isOpen(a) && num(a.limit) > 0; });
    if (!cards.length) return '<p class="help">Add a credit card with a limit and a balance to use the calculator.</p>';
    var need = Math.max(0, u.balance - u.limit * t / 100);
    var h = '<div class="note ' + (need > 0 ? "warn" : "good") + '">' + (need > 0
      ? "To bring your overall utilization from <b>" + pct(u.pct) + "</b> down to <b>" + t + "%</b>, pay down about <b>" + money(need) + "</b> in total (your total balance would be " + money(u.limit * t / 100) + " or less)."
      : "Your overall utilization (" + pct(u.pct) + ") is already at or below " + t + "%.") + "</div>";
    h += '<div class="table-wrap"><table><thead><tr><th>Card</th><th>Now</th><th>Balance at ' + t + "%</th><th>Pay down</th></tr></thead><tbody>" +
      cards.map(function (a) {
        var l = num(a.limit), b = Math.max(0, num(a.balance) || 0), goal = l * t / 100, pd = Math.max(0, b - goal);
        return "<tr><td>" + esc(a.nickname) + (a.last4 ? " ••" + esc(a.last4) : "") + "</td><td>" + pct(utilOf(a)) + "</td><td>" + money(goal) + "</td><td><b>" + (pd > 0 ? money(pd) : "—") + "</b></td></tr>";
      }).join("") + "</tbody></table></div>";
    return h;
  }

  function viewAccounts() {
    var u = overallUtil(), ub = utilBand(u.pct);
    var loans = state.accounts.filter(function (a) { return !isRevolving(a) && isOpen(a); });
    var loanBal = loans.reduce(function (s, a) { return s + Math.max(0, num(a.balance) || 0); }, 0);
    var h = head("Accounts", "Cards & loans", "Track balances, limits, and due dates. Utilization is worked out for you automatically.");
    h += '<div class="grid g4"><div class="stat"><span class="bar" style="background:' + ub.color + '"></span><div class="lbl">Overall card utilization</div><div class="val">' + pct(u.pct) + "</div>" + (u.pct != null ? '<span class="pill ' + ub.cls + '">' + ub.label + "</span>" : '<div class="sub">No cards with limits yet</div>') + "</div>" +
      '<div class="stat"><div class="lbl">Card balances</div><div class="val">' + money(u.balance, 0) + '</div><div class="sub">' + plural(u.count, "open card") + "</div></div>" +
      '<div class="stat"><div class="lbl">Total card limits</div><div class="val">' + money(u.limit, 0) + '</div><div class="sub">Available: ' + money(Math.max(0, u.limit - u.balance), 0) + "</div></div>" +
      '<div class="stat"><div class="lbl">Loan balances</div><div class="val">' + money(loanBal, 0) + '</div><div class="sub">' + plural(loans.length, "open loan") + "</div></div></div>";

    h += '<div class="card mt"><h2>What utilization means</h2><p>Utilization is how much of your credit card limits you are using. It is part of \u201Camounts owed,\u201D about 30% of a FICO Score.</p>' +
      '<ul class="steps"><li>The CFPB says experts advise using <b>no more than 30%</b> of your total credit limit, and that people with the highest scores often use <b>less than 10%</b>. (' + src("CFPB", LINKS.cfpbGoodScore) + ")</li>" +
      "<li>myFICO says there's no sudden drop at exactly 30%. Lower is generally better, and staying <b>under 10%</b> while paying on time can help. (" + src("myFICO", LINKS.myficoUtil) + ")</li>" +
      "<li>The balance on your statement is usually what gets reported, so paying before the statement closes can lower the utilization that's reported. (" + src("myFICO", LINKS.myficoUtil) + ")</li>" +
      "<li>Closing a card lowers your total available credit, which can raise your utilization. (" + src("CFPB", LINKS.cfpbUnderstand) + ")</li></ul>" +
      '<div class="legend"><span><i style="background:var(--good)"></i>Under 10%</span><span><i style="background:var(--ok)"></i>10–29%</span><span><i style="background:var(--warn)"></i>30–49%</span><span><i style="background:var(--bad)"></i>50% or more</span></div></div>';

    h += '<div class="card mt"><h2>Your accounts</h2>';
    if (!state.accounts.length) h += emptyBox("No accounts yet. Add your first card or loan below.");
    state.accounts.slice().sort(function (a, b) { return (isOpen(b) - isOpen(a)) || (a.nickname || "").localeCompare(b.nickname || ""); }).forEach(function (a) {
      var ut = isRevolving(a) ? utilOf(a) : null, band = utilBand(ut);
      var nd = isOpen(a) ? nextDueDate(a.dueDay) : "";
      var stCls = a.status === "Current" ? "good" : (a.status === "Closed" || a.status === "Paid off") ? "" : "bad";
      h += '<div class="item"><div class="row between"><div><h3>' + esc(a.nickname) + (a.last4 ? ' <span class="muted">••' + esc(a.last4) + "</span>" : "") + '</h3><span class="help">' + esc(a.type) + (num(a.apr) != null ? " · " + esc(a.apr) + "% APR" : "") + (num(a.minPay) != null ? " · min " + money(num(a.minPay)) : "") + '</span></div><div class="row"><span class="pill ' + stCls + '">' + esc(a.status || "Current") + "</span>" + (isOpen(a) ? '<span class="pill ' + (a.autopay ? "good" : "warn") + '">Autopay ' + (a.autopay ? "on" : "off") + "</span>" : "") + "</div></div>";
      if (isRevolving(a)) {
        h += '<div class="row between" style="margin-top:6px"><span>' + money(num(a.balance)) + " of " + money(num(a.limit)) + '</span><b style="color:' + band.color + '">' + pct(ut) + "</b></div>" +
          '<div class="util"><i style="width:' + Math.min(100, ut || 0) + "%;background:" + band.color + '"></i></div>';
      } else {
        var orig = num(a.limit), bal = num(a.balance);
        h += '<div class="row between" style="margin-top:6px"><span>Balance ' + money(bal) + (orig ? " of " + money(orig) + " original" : "") + "</span>" + (orig && bal != null ? "<b>" + pct(Math.max(0, (orig - bal) / orig * 100), 0) + " paid</b>" : "") + "</div>" +
          (orig && bal != null ? '<div class="util"><i style="width:' + Math.min(100, Math.max(0, (orig - bal) / orig * 100)) + '%;background:var(--accent)"></i></div>' : "");
      }
      h += '<div class="row between" style="margin-top:6px"><span class="help">' + (nd ? "Next due " + esc(fmtDate(nd)) + " (" + relDays(daysUntil(nd)) + ")" : "") + (a.notes ? " · " + esc(a.notes) : "") + '</span><span class="row"><button class="btn small" data-action="edit" data-key="accounts" data-id="' + a.id + '">Edit</button><button class="btn small danger" data-action="del" data-key="accounts" data-id="' + a.id + '">Delete</button></span></div></div>';
    });
    var editing = ui.edit.accounts ? find("accounts", ui.edit.accounts) : null;
    h += '<h3 id="accountFormHead">' + (editing ? "Edit " + esc(editing.nickname) : "Add an account") + "</h3>" + accountForm(editing) + "</div>";

    h += '<div class="card mt"><h2>Pay-down calculator</h2><p class="help">Pick a target and see how much to pay to reach it.</p><div class="row" style="margin-bottom:10px">' +
      [30, 10, 5].map(function (v) { return '<button type="button" class="btn small ' + (ui.target === v ? "primary" : "") + '" data-action="target" data-v="' + v + '">' + v + "%</button>"; }).join("") +
      '<label class="row" style="gap:6px"><span class="help">Custom %</span><input id="targetInput" type="number" min="0" max="100" step="1" value="' + esc(ui.target) + '" style="width:90px" data-live="target"></label></div><div id="payDownOut">' + payDownHtml() + "</div></div>";
    return h + disclaimer();
  }

  function negForm(n) {
    n = n || {};
    var t = NEG_TYPES[n.type || "late"];
    return '<form data-form="negative" autocomplete="off"><input type="hidden" name="id" value="' + esc(n.id || "") + '"><div class="form-grid">' +
      sel("Type of item", "type", Object.keys(NEG_TYPES).map(function (k) { return { v: k, t: NEG_TYPES[k].label }; }), n.type || "late", 'data-live="negtype"') +
      inp("Creditor, collector, or source", "creditor", n.creditor, 'required maxlength="60"') +
      last4In("Account last 4", "last4", n.last4) +
      '<div class="field"><label><span id="negDateLabel">' + esc(t.dateLabel) + '</span><input name="date" type="date" value="' + esc(n.date || "") + '"></label></div>' +
      moneyIn("Amount shown (optional)", "amount", n.amount) +
      sel("Status", "status", ["Not disputed", "Disputing", "Removed", "Verified accurate", "Waiting to age off"], n.status || "Not disputed") +
      '</div><div class="field"><span>Shows on</span><div class="row">' + BUREAUS.map(function (b) {
        return '<label class="row" style="gap:6px"><input type="checkbox" name="b_' + b + '" ' + ((n.bureaus || []).indexOf(b) !== -1 ? "checked" : "") + ">" + b + "</label>";
      }).join("") + "</div></div>" + area("Notes (optional)", "notes", n.notes, 'rows="2" maxlength="400"') +
      '<p class="help" id="negRule">' + esc(t.rule) + "</p>" +
      '<div class="row"><button class="btn primary" type="submit">' + (n.id ? "Save changes" : "Add item") + "</button>" + (n.id ? '<button class="btn" type="button" data-action="cancel-edit" data-key="negatives">Cancel</button>' : "") + "</div></form>";
  }

  function viewReport() {
    var b = ui.reviewBureau;
    var h = head("Report Review", "Check each credit report", "Go through each bureau's report line by line, then log anything negative or wrong.");
    h += '<div class="card"><h2>Step 1 · Get your free reports</h2><p>' + src("AnnualCreditReport.com", LINKS.acr) + " is the official site created under federal law. You can check your report from each of the three bureaus for free every week, and checking your own report does not affect your scores. You can also order by phone at 1-877-322-8228.</p>" +
      '<p class="help">That site asks for your Social Security number to verify you. Type it only on the official site — never in this app.</p>' +
      '<a class="btn primary" href="' + LINKS.acr + '" target="_blank" rel="noopener noreferrer">Open AnnualCreditReport.com ↗</a></div>';
    var checked = REVIEW_ITEMS.filter(function (it) { return !!getFlag("reviewChecks", b, it.id); }).length;
    var lr = lastReview(b);
    h += '<div class="card mt"><h2>Step 2 · Guided review</h2><div class="tabs">' + BUREAUS.map(function (x) {
      var r = lastReview(x);
      return '<button type="button" data-action="review-bureau" data-v="' + x + '" class="' + (x === b ? "on" : "") + '">' + x + (r ? " ✓" : "") + "</button>";
    }).join("") + '</div><p class="help">' + (lr ? "Last finished " + esc(fmtDate(lr.date)) + "." : "Not reviewed yet.") + " " + checked + " of " + REVIEW_ITEMS.length + " checked.</p>" +
      '<div class="util"><i style="width:' + (checked / REVIEW_ITEMS.length * 100) + '%;background:var(--accent)"></i></div>' +
      REVIEW_ITEMS.map(function (it) {
        var on = !!getFlag("reviewChecks", b, it.id);
        return '<label class="check ' + (on ? "done" : "") + '"><input type="checkbox" data-action="review-check" data-id="' + it.id + '" ' + (on ? "checked" : "") + '><span class="t">' + esc(it.t) + "</span></label>";
      }).join("") +
      '<p class="help">Found something wrong? Add it below and start a dispute. Unknown accounts or inquiries can be a sign of identity theft — see ' + src("IdentityTheft.gov", LINKS.idTheft) + ".</p>" +
      '<div class="row"><button class="btn primary" data-action="finish-review">Finish ' + b + " review</button></div></div>";

    h += '<div class="card mt"><h2>Step 3 · Negative &amp; wrong items</h2>';
    if (!state.negatives.length) h += emptyBox("No items logged yet.");
    state.negatives.slice().sort(function (a, c) { return (ageOff(a) || "9999").localeCompare(ageOff(c) || "9999"); }).forEach(function (n) {
      var t = NEG_TYPES[n.type] || NEG_TYPES.publicrecord, ao = ageOff(n);
      var start = n.date ? parseDate(n.date).getTime() : null, end = ao ? parseDate(ao).getTime() : null;
      var prog = start && end ? Math.min(100, Math.max(0, (Date.now() - start) / (end - start) * 100)) : 0;
      var stCls = n.status === "Removed" ? "good" : n.status === "Disputing" ? "warn" : n.status === "Verified accurate" ? "" : "info";
      h += '<div class="item"><div class="row between"><div><h3>' + esc(t.label) + " · " + esc(n.creditor) + (n.last4 ? ' <span class="muted">••' + esc(n.last4) + "</span>" : "") + '</h3><span class="help">' + (n.bureaus && n.bureaus.length ? esc(n.bureaus.join(", ")) : "Bureaus not marked") + (num(n.amount) != null ? " · " + money(num(n.amount)) : "") + (n.date ? " · " + esc(t.dateLabel.split(" (")[0]) + ": " + esc(fmtDate(n.date)) : "") + '</span></div><span class="pill ' + stCls + '">' + esc(n.status || "Not disputed") + "</span></div>";
      if (ao) {
        h += '<div class="row between" style="margin-top:8px"><span>Should come off by <b>' + esc(fmtDate(ao)) + '</b></span><span class="countdown">' + esc(timeLeft(ao)) + '</span></div><div class="util"><i style="width:' + prog + '%;background:var(--good)"></i></div>';
      } else if (t.years && !n.date) {
        h += '<p class="help">Add the date to see when it ages off.</p>';
      } else {
        h += '<p class="note ' + (n.type === "idtheft" ? "bad" : "warn") + '">' + esc(t.rule) + "</p>";
      }
      h += '<p class="help">' + (t.years ? esc(t.rule) : "") + (n.notes ? (t.years ? " · " : "") + esc(n.notes) : "") + "</p>" +
        '<div class="row"><a class="btn small primary" href="#/letters" data-action="letter-from-neg" data-id="' + n.id + '">Write dispute letter</a><button class="btn small" data-action="dispute-from-neg" data-id="' + n.id + '">Log a dispute</button><button class="btn small" data-action="edit" data-key="negatives" data-id="' + n.id + '">Edit</button><button class="btn small danger" data-action="del" data-key="negatives" data-id="' + n.id + '">Delete</button></div></div>';
    });
    var editing = ui.edit.negatives ? find("negatives", ui.edit.negatives) : null;
    h += '<h3 id="negFormHead">' + (editing ? "Edit item" : "Log an item") + "</h3>" + negForm(editing) + "</div>";

    h += '<div class="card mt"><h2>How long negative items can stay</h2><div class="table-wrap"><table><thead><tr><th>Item</th><th>How long</th></tr></thead><tbody>' +
      "<tr><td>Late payments and most negative items</td><td>Up to 7 years</td></tr>" +
      "<tr><td>Collections and charge-offs</td><td>7 years, starting 180 days after the delinquency began</td></tr>" +
      "<tr><td>Bankruptcy (Chapter 7)</td><td>Up to 10 years</td></tr>" +
      "<tr><td>Bankruptcy (Chapter 13)</td><td>Removed after 7 years by the bureaus (the law allows up to 10)</td></tr>" +
      "<tr><td>Lawsuits and judgments</td><td>7 years or until the statute of limitations ends, whichever is longer</td></tr>" +
      "<tr><td>Hard inquiries</td><td>2 years (FICO Scores count only the last 12 months)</td></tr>" +
      "<tr><td>Positive, on-time history</td><td>Can stay longer, even after an account is closed</td></tr></tbody></table></div>" +
      '<p class="help">These limits don\'t apply when a report is used for a job paying more than $75,000 a year, or for more than $150,000 of credit or life insurance. Dates in this app are estimates from the date you enter — check your report for the bureau\'s exact date.</p>' +
      '<p class="src">Sources: ' + src("CFPB", LINKS.cfpbHowLong) + " · " + src("FCRA §605 (15 U.S.C. §1681c)", LINKS.fcra605) + " · " + src("Experian on bankruptcy", LINKS.experianBk) + " · " + src("myFICO on inquiries", LINKS.myficoFactors) + "</p></div>";
    return h + disclaimer();
  }

  function disputeForm(d) {
    d = d || {};
    var negOpts = [{ v: "", t: "— None (type it below) —" }].concat(state.negatives.map(function (n) {
      return { v: n.id, t: (NEG_TYPES[n.type] || {}).label + " · " + n.creditor + (n.last4 ? " ••" + n.last4 : "") };
    }));
    return '<form data-form="dispute" autocomplete="off"><input type="hidden" name="id" value="' + esc(d.id || "") + '"><div class="form-grid">' +
      sel("Logged item (optional)", "negId", negOpts, d.negId || "", 'data-live="disputeneg"') +
      inp("What you are disputing", "item", d.item, 'required maxlength="80" placeholder="e.g. Late payment, Blue card, Mar 2025"') +
      sel("Sent to", "to", BUREAUS.concat(["Furnisher (creditor or collector)"]), d.to || "Equifax") +
      inp("Furnisher name (if sent to a furnisher)", "furnisher", d.furnisher, 'maxlength="60"') +
      inp("Date sent", "sent", d.sent || todayStr(), 'type="date" required') +
      sel("How you sent it", "method", ["Online", "Certified mail (return receipt)", "Regular mail", "Phone"], d.method || "Online") +
      inp("Date they received it (optional)", "received", d.received, 'type="date"') +
      inp("Confirmation or tracking number (optional)", "ref", d.ref, 'maxlength="40"') +
      sel("Outcome", "outcome", ["Pending", "Deleted", "Corrected", "Verified — no change", "Marked frivolous", "No response by deadline"], d.outcome || "Pending") +
      '</div><label class="row" style="gap:8px;margin-bottom:10px"><input type="checkbox" name="extended" ' + (d.extended ? "checked" : "") + '><span>I sent more information during the 30 days (the deadline can be extended up to 15 days)</span></label>' +
      area("Notes (optional)", "notes", d.notes, 'rows="2" maxlength="400"') +
      '<div class="row"><button class="btn primary" type="submit">' + (d.id ? "Save changes" : "Add dispute") + "</button>" + (d.id ? '<button class="btn" type="button" data-action="cancel-edit" data-key="disputes">Cancel</button>' : "") + "</div></form>";
  }

  function viewDisputes() {
    var open = state.disputes.filter(disputeOpen);
    var soon = open.filter(function (d) { var n = daysUntil(disputeDeadline(d)); return n != null && n >= 0 && n <= 7; });
    var over = open.filter(function (d) { return daysUntil(disputeDeadline(d)) < 0; });
    var done = state.disputes.length - open.length;
    var h = head("Disputes", "Dispute tracker", "Keep every dispute in one place with a countdown to the investigation deadline.");
    h += '<div class="grid g4"><div class="stat"><span class="bar" style="background:var(--info)"></span><div class="lbl">Open</div><div class="val">' + open.length + '</div></div><div class="stat"><span class="bar" style="background:var(--warn)"></span><div class="lbl">Due in 7 days</div><div class="val">' + soon.length + '</div></div><div class="stat"><span class="bar" style="background:var(--bad)"></span><div class="lbl">Past deadline</div><div class="val">' + over.length + '</div></div><div class="stat"><span class="bar" style="background:var(--good)"></span><div class="lbl">Finished</div><div class="val">' + done + "</div></div></div>";

    h += '<div class="card mt"><div class="row between"><h2>Your disputes</h2><a class="btn primary" href="#/letters">✍️ Write a dispute letter</a></div>';
    if (!state.disputes.length) h += emptyBox("No disputes yet. Found an error? Add it below or write a letter first.");
    state.disputes.slice().sort(function (a, b) { return (disputeOpen(b) - disputeOpen(a)) || (disputeDeadline(a) || "").localeCompare(disputeDeadline(b) || ""); }).forEach(function (d) {
      var dl = disputeDeadline(d), n = daysUntil(dl), isOpenD = disputeOpen(d);
      var total = 30 + (d.extended ? 15 : 0);
      var used = Math.min(total, Math.max(0, total - (n == null ? total : n)));
      var color = !isOpenD ? "var(--good)" : n < 0 ? "var(--bad)" : n <= 7 ? "var(--warn)" : "var(--info)";
      var outCls = !isOpenD ? (/Deleted|Corrected/.test(d.outcome) ? "good" : "warn") : "info";
      h += '<div class="item"><div class="row between"><div><h3>' + esc(d.item) + '</h3><span class="help">To ' + esc(d.to === "Furnisher (creditor or collector)" ? (d.furnisher || "furnisher") : d.to) + " · " + esc(d.method || "") + " · sent " + esc(fmtDate(d.sent)) + (d.received ? " · received " + esc(fmtDate(d.received)) : "") + (d.ref ? " · ref " + esc(d.ref) : "") + '</span></div><span class="pill ' + outCls + '">' + esc(d.outcome || "Pending") + "</span></div>";
      if (isOpenD && dl) {
        h += '<div class="row between" style="margin-top:8px"><span>Deadline <b>' + esc(fmtDate(dl)) + '</b>' + (d.extended ? " (extended)" : "") + (d.received ? "" : ' <span class="help">· counted from the date sent; add the received date if you know it</span>') + '</span><span class="countdown" style="color:' + color + '">' + (n < 0 ? plural(-n, "day") + " past" : n === 0 ? "Due today" : plural(n, "day") + " left") + "</span></div>" +
          '<div class="util"><i style="width:' + (used / total * 100) + "%;background:" + color + '"></i></div>';
        if (n < 0) h += '<p class="note bad">The investigation window has passed. If you have no written results, contact them and keep a record. You can also ' + src("submit a complaint to the CFPB", LINKS.cfpbComplaint) + ".</p>";
      }
      h += (d.notes ? '<p class="help">' + esc(d.notes) + "</p>" : "") + '<div class="row" style="margin-top:6px"><label class="row" style="gap:6px"><span class="help">Outcome</span><select data-action="dispute-outcome" data-id="' + d.id + '" style="width:auto">' +
        ["Pending", "Deleted", "Corrected", "Verified — no change", "Marked frivolous", "No response by deadline"].map(function (o) { return "<option" + (o === (d.outcome || "Pending") ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") +
        '</select></label><button class="btn small" data-action="edit" data-key="disputes" data-id="' + d.id + '">Edit</button><button class="btn small danger" data-action="del" data-key="disputes" data-id="' + d.id + '">Delete</button></div></div>';
    });
    var editing = ui.edit.disputes ? find("disputes", ui.edit.disputes) : null;
    h += '<h3 id="disputeFormHead">' + (editing ? "Edit dispute" : "Add a dispute") + "</h3>" + disputeForm(editing || ui.disputeDraft) + "</div>";

    h += '<div class="card mt"><h2>How disputes work</h2><ol class="steps">' +
      "<li><b>Dispute with the credit bureau.</b> Explain in writing what's wrong and why, and include copies (not originals) of documents that back you up. Disputing is free.</li>" +
      "<li><b>Also dispute with the furnisher</b> — the company that reported it (your bank, card company, landlord, or a collector). The CFPB says to dispute with both to fully protect your rights.</li>" +
      "<li><b>The 30-day clock.</b> The bureau must finish its investigation within 30 days of receiving your dispute. It can be extended by up to 15 days if you send more relevant information during those 30 days. Furnishers generally must respond within 30 days too.</li>" +
      "<li><b>Frivolous disputes.</b> If a bureau decides a dispute is frivolous (for example, it doesn't say what's wrong), it must tell you why within 5 business days.</li>" +
      "<li><b>If it isn't fixed,</b> you can ask the bureau to add a statement of your dispute to your file, and you can file a complaint with the CFPB.</li>" +
      '<li><b>Mail tip:</b> certified mail with a return receipt gives you proof of when they received it.</li></ol>' +
      '<h3>Official dispute pages</h3><div class="table-wrap"><table><thead><tr><th>Bureau</th><th>Dispute online</th><th>By mail or phone</th></tr></thead><tbody>' +
      BUREAUS.map(function (b) { var L = BUREAU_LINKS[b]; return "<tr><td><b>" + b + "</b></td><td>" + src(b + " disputes ↗", L.dispute) + "</td><td>" + src("Mail instructions ↗", L.contact) + "<div class=\"help\">" + esc(L.phone) + "</div></td></tr>"; }).join("") +
      '</tbody></table></div><p class="src">Sources: ' + src("CFPB: How do I dispute an error?", LINKS.cfpbDispute) + " · " + src("FCRA §611 (15 U.S.C. §1681i)", LINKS.fcra611) + " · " + src("CFPB: removing accurate information", LINKS.cfpbAccurate) + "</p></div>";
    return h + disclaimer();
  }

  /* ---------- letters ---------- */
  var LETTER_TYPES = {
    bureau: "Dispute to a credit bureau",
    furnisher: "Dispute to a creditor or collector",
    goodwill: "Goodwill letter",
    pfd: "Pay-for-delete request"
  };
  function profile() {
    return { name: setting("name", ""), street: setting("street", ""), city: setting("city", ""), phone: setting("phone", "") };
  }
  function readLetterForm() {
    var f = document.getElementById("letterForm");
    var o = {};
    if (!f) return ui.letter || {};
    Array.prototype.forEach.call(f.elements, function (el) { if (el.name) o[el.name] = el.type === "checkbox" ? el.checked : el.value; });
    return o;
  }
  function br(s) { return String(s || "").trim(); }
  function buildLetter(t, o) {
    var lines = [];
    var name = br(o.name) || "[Your name]";
    lines.push(name, br(o.street) || "[Street address]", br(o.city) || "[City, State ZIP]");
    if (br(o.phone)) lines.push(br(o.phone));
    lines.push("", fmtDate(o.date || todayStr()) || "[Date]", "");
    lines.push(br(o.toName) || (t === "bureau" ? "Complaint Department\n[Credit bureau name]" : "[Company name]"));
    lines.push(br(o.toAddr) || "[Street address]\n[City, State ZIP]");
    lines.push("");
    var items = [];
    for (var i = 1; i <= 5; i++) {
      if (!o["src" + i] && !o["why" + i]) continue;
      items.push({ src: br(o["src" + i]), kind: br(o["kind" + i]), l4: last4(o["l4" + i]), prob: o["prob" + i] || "inaccurate", why: br(o["why" + i]), ask: o["ask" + i] || "removed" });
    }
    if (!items.length) items.push({ src: "", kind: "", l4: "", prob: "inaccurate", why: "", ask: "removed" });
    var many = items.length > 1;
    function itemText(it, n) {
      var label = (it.src || "[Creditor or source]") + " — " + (it.kind || "[type of item, e.g. credit account, collection, late payment]") + (it.l4 ? " (account ending in " + it.l4 + ")" : "");
      return (many ? n + ". " : "") + "This item, " + label + ", is " + it.prob + " because " + (it.why || "[describe what is inaccurate or incomplete and why]") + ". I am requesting that the item be " + (it.ask === "corrected" ? "corrected to show " + (br(o["fix" + n]) || "[the correct information]") : "removed") + " to correct the information.";
    }
    if (t === "bureau" || t === "furnisher") {
      lines.push("Re: Dispute of information in my credit file" + (br(o.conf) ? " — Report confirmation number " + br(o.conf) : ""), "");
      lines.push("Dear Sir or Madam:", "");
      if (t === "bureau") lines.push("I am writing to dispute the following information in my file. I have circled the item" + (many ? "s" : "") + " I dispute on the attached copy of the report I received.", "");
      else lines.push("I am writing to dispute information that you furnished to " + (br(o.cras) || "[the credit reporting company or companies]") + " about me. I have circled the item" + (many ? "s" : "") + " I dispute on the attached copy of my credit report.", "");
      items.forEach(function (it, i) { lines.push(itemText(it, i + 1), ""); });
      if (br(o.encl)) lines.push("Enclosed are copies of " + br(o.encl) + " supporting my position.", "");
      if (t === "bureau") lines.push("Please reinvestigate " + (many ? "these matters" : "this matter") + " and delete or correct the disputed item" + (many ? "s" : "") + " as soon as possible.", "");
      else lines.push("Please investigate " + (many ? "these matters" : "this matter") + ", correct or delete the disputed item" + (many ? "s" : "") + " as soon as possible, and notify the credit reporting companies to which you reported this information.", "");
    } else if (t === "goodwill") {
      lines.push("Re: Goodwill adjustment request" + (last4(o.gl4) ? " — account ending in " + last4(o.gl4) : ""), "");
      lines.push("Dear " + (br(o.toName).split("\n")[0] || "Customer Care Team") + ":", "");
      lines.push("I am writing to ask for a goodwill adjustment to my account" + (br(o.gyears) ? ", which I have had for " + br(o.gyears) : "") + ". My records show a late payment reported for " + (br(o.gmonths) || "[month and year]") + ".", "");
      lines.push((br(o.greason) || "[Briefly and honestly explain what happened]") + "", "");
      lines.push((br(o.gchange) || "[Explain what you have done to make sure it doesn't happen again, such as setting up autopay]") + "", "");
      lines.push("I understand that the information may be accurate and that you are not required to change it. Given my payment history since then, I respectfully ask that you consider removing the late payment from your reports to the credit bureaus as a gesture of goodwill.", "");
      lines.push("Thank you for considering my request.", "");
    } else if (t === "pfd") {
      lines.push("Re: Settlement offer" + (br(o.porig) ? " — original creditor " + br(o.porig) : "") + (last4(o.pl4) ? ", account ending in " + last4(o.pl4) : ""), "");
      lines.push("Dear Sir or Madam:", "");
      lines.push("I am writing about the account listed above, which your records show with a balance of " + (num(o.pbal) != null ? money(num(o.pbal)) : "[balance]") + ". This letter is not an acknowledgment that I owe this debt.", "");
      lines.push("I am willing to pay " + (num(o.poffer) != null ? money(num(o.poffer)) : "[amount]") + " to resolve this account, on the condition that you agree in writing to ask the credit reporting companies to delete this account from my credit reports.", "");
      lines.push("If you accept, please send your agreement in writing on your letterhead before I make any payment. Once I receive it, I will pay by the method we agree on.", "");
    }
    lines.push("Sincerely,", "", "", name);
    if ((t === "bureau" || t === "furnisher") && br(o.encl)) lines.push("", "Enclosures: " + br(o.encl));
    return lines.join("\n");
  }

  function letterFormHtml(t, o) {
    var p = profile();
    function v(k, d) { return o[k] != null ? o[k] : d; }
    var h = '<form id="letterForm" data-form="letter" autocomplete="off"><h3>Your details</h3><div class="form-grid">' +
      inp("Your full name", "name", v("name", p.name), 'maxlength="60"') +
      inp("Street address", "street", v("street", p.street), 'maxlength="80"') +
      inp("City, State ZIP", "city", v("city", p.city), 'maxlength="60" placeholder="e.g. Frisco, TX 75034"') +
      inp("Phone (optional)", "phone", v("phone", p.phone), 'type="tel" maxlength="20"') +
      inp("Letter date", "date", v("date", todayStr()), 'type="date"') +
      '</div><label class="row" style="gap:8px;margin-bottom:8px"><input type="checkbox" name="remember" ' + (o.remember === false ? "" : "checked") + '><span>Remember my name and address on this device for next time</span></label>' +
      '<h3>Send to</h3><div class="form-grid">';
    if (t === "bureau") {
      h += sel("Credit bureau", "bureau", BUREAUS, v("bureau", "Equifax"), 'data-live="letterbureau"');
    }
    h += area("Recipient name", "toName", v("toName", t === "bureau" ? "Complaint Department\n" + (o.bureau || "Equifax") : ""), 'rows="2" maxlength="120"') +
      area("Recipient mailing address", "toAddr", v("toAddr", ""), 'rows="2" maxlength="160" placeholder="Copy the current address from the official page"') + "</div>";
    if (t === "bureau") {
      var L = BUREAU_LINKS[o.bureau || "Equifax"];
      h += '<p class="help">Get the current mailing address from ' + src((o.bureau || "Equifax") + "'s official mail instructions ↗", L.contact) + ". Addresses change, so the app doesn't guess.</p>";
    }
    if (t === "bureau" || t === "furnisher") {
      h += '<div class="form-grid">' + (t === "bureau" ? inp("Report confirmation number (optional)", "conf", v("conf", ""), 'maxlength="30"') : inp("Bureaus you saw it on", "cras", v("cras", ""), 'maxlength="60" placeholder="e.g. Equifax and Experian"')) + "</div>";
      var count = ui.letterItems;
      for (var i = 1; i <= count; i++) {
        h += '<div class="item"><b>Item ' + i + '</b><div class="form-grid">' +
          inp("Creditor or source", "src" + i, v("src" + i, ""), 'maxlength="60"') +
          inp("Type of item", "kind" + i, v("kind" + i, ""), 'maxlength="60" placeholder="e.g. late payment, collection"') +
          last4In("Account last 4", "l4" + i, v("l4" + i, "")) +
          sel("The item is", "prob" + i, [{ v: "inaccurate", t: "Inaccurate" }, { v: "incomplete", t: "Incomplete" }], v("prob" + i, "inaccurate")) +
          sel("I want it", "ask" + i, [{ v: "removed", t: "Removed" }, { v: "corrected", t: "Corrected" }], v("ask" + i, "removed")) +
          inp("Correct information (if corrected)", "fix" + i, v("fix" + i, ""), 'maxlength="100"') +
          "</div>" + area("Why it's wrong", "why" + i, v("why" + i, ""), 'rows="2" maxlength="400" placeholder="e.g. I paid on time; my bank statement shows the payment cleared on March 3"') + "</div>";
      }
      h += '<div class="row" style="margin:8px 0">' + (count < 5 ? '<button type="button" class="btn small" data-action="letter-add-item">+ Add another item</button>' : "") + (count > 1 ? '<button type="button" class="btn small" data-action="letter-remove-item">Remove last item</button>' : "") + "</div>" +
        area("Enclosures (copies, not originals)", "encl", v("encl", ""), 'rows="2" maxlength="300" placeholder="e.g. my credit report with the item circled; my bank statement showing the payment"');
    } else if (t === "goodwill") {
      h += '<div class="form-grid">' + last4In("Account last 4", "gl4", v("gl4", "")) + inp("Late payment month(s)", "gmonths", v("gmonths", ""), 'maxlength="60" placeholder="e.g. March 2024"') + inp("How long you've been a customer (optional)", "gyears", v("gyears", ""), 'maxlength="30" placeholder="e.g. 8 years"') + "</div>" +
        area("What happened", "greason", v("greason", ""), 'rows="2" maxlength="500"') + area("What you've changed since", "gchange", v("gchange", ""), 'rows="2" maxlength="500" placeholder="e.g. I set up autopay and have paid on time every month since"');
    } else {
      h += '<div class="form-grid">' + inp("Original creditor", "porig", v("porig", ""), 'maxlength="60"') + last4In("Account last 4", "pl4", v("pl4", "")) + moneyIn("Balance they show", "pbal", v("pbal", "")) + moneyIn("Amount you offer", "poffer", v("poffer", "")) + "</div>";
    }
    h += "</form>";
    return h;
  }

  function viewLetters() {
    var t = ui.letterType, o = ui.letter || {};
    var h = head("Letter Writer", "Write a letter", "Fill in the blanks and the letter is written for you. Copy it, print it, or save it as a PDF.");
    h += '<div class="tabs">' + Object.keys(LETTER_TYPES).map(function (k) { return '<button type="button" data-action="letter-type" data-v="' + k + '" class="' + (k === t ? "on" : "") + '">' + LETTER_TYPES[k] + "</button>"; }).join("") + "</div>";
    if (t === "bureau" || t === "furnisher") {
      h += '<div class="note">This letter follows the structure of the FTC and CFPB sample dispute letters: say what each item is, why it\'s wrong, and what you want done, and include copies of your proof. (' + src("CFPB sample letters", LINKS.cfpbLetters) + ")</div>";
    } else if (t === "goodwill") {
      h += '<div class="note warn">A goodwill letter asks a lender to remove an <b>accurate</b> late payment as a courtesy. They don\'t have to say yes. It works best when the late payment was a one-time slip and your record since then is clean. Be honest — don\'t claim the report is wrong if it isn\'t.</div>';
    } else {
      h += '<div class="note warn"><b>Pay-for-delete is not guaranteed.</b> No law requires a collector to agree, and the CFPB says no one has the right to remove accurate negative information. Get any agreement in writing <b>before</b> you pay, keep copies, and check your reports afterward.</div>';
    }
    h += '<div class="note warn"><b>No Social Security number field — on purpose.</b> Each bureau\'s mail instructions say what identifying information to include (some ask for things like your date of birth or SSN and proof of address). If you need to include those, write them on the printed copy yourself, following that bureau\'s instructions. Never type them into this app.</div>';
    h += '<div class="grid g2 mt"><div class="card">' + letterFormHtml(t, o) + '</div><div class="card sticky-card"><div class="row between"><h2>Preview</h2><div class="row">' +
      '<button class="btn small primary" data-action="letter-copy">Copy</button><button class="btn small" data-action="letter-print">Print / Save PDF</button><button class="btn small" data-action="letter-save">Save</button>' +
      ((t === "bureau" || t === "furnisher") ? '<button class="btn small" data-action="letter-log">Log as dispute</button>' : "") +
      '</div></div><div id="letterPreview" class="letter-preview">' + esc(buildLetter(t, Object.assign({ name: profile().name, street: profile().street, city: profile().city, phone: profile().phone, bureau: "Equifax" }, o))) + "</div>" +
      '<p class="help">To save as a PDF: tap <b>Print / Save PDF</b>, then pick <b>Save as PDF</b> as the printer (on your PC) or from the printer list (on Android).</p></div></div>';
    if (state.letters.length) {
      h += '<div class="card mt"><h2>Saved letters</h2><ul class="list">' + state.letters.slice().sort(function (a, b) { return (b.createdAt || "").localeCompare(a.createdAt || ""); }).map(function (l) {
        return '<li><div style="flex:1"><b>' + esc(l.title) + '</b><div class="help">' + esc(LETTER_TYPES[l.type] || "") + " · saved " + esc(fmtDate((l.createdAt || "").slice(0, 10))) + '</div></div><button class="btn small" data-action="saved-print" data-id="' + l.id + '">Print</button><button class="btn small" data-action="saved-copy" data-id="' + l.id + '">Copy</button><button class="btn small danger" data-action="del" data-key="letters" data-id="' + l.id + '">Delete</button></li>';
      }).join("") + "</ul></div>";
    }
    return h + disclaimer();
  }

  /* ---------- payoff planner ---------- */
  function payoffDebts() {
    return state.accounts.filter(function (a) { return isOpen(a) && (num(a.balance) || 0) > 0; });
  }
  function simulate(method, extra) {
    var debts = payoffDebts().map(function (a) {
      return { id: a.id, name: a.nickname + (a.last4 ? " ••" + a.last4 : ""), bal: num(a.balance), apr: num(a.apr), min: num(a.minPay) };
    });
    var missing = debts.filter(function (d) { return d.apr == null || d.min == null; });
    if (!debts.length) return { empty: true };
    if (missing.length) return { missing: missing };
    var budget = debts.reduce(function (s, d) { return s + d.min; }, 0) + Math.max(0, extra || 0);
    var order = debts.slice().sort(method === "snowball"
      ? function (a, b) { return a.bal - b.bal || b.apr - a.apr; }
      : function (a, b) { return b.apr - a.apr || a.bal - b.bal; });
    var month = 0, interest = 0, paidOff = {}, startTotal = debts.reduce(function (s, d) { return s + d.bal; }, 0);
    while (month < 600 && debts.some(function (d) { return d.bal > 0.005; })) {
      month++;
      debts.forEach(function (d) { if (d.bal > 0) { var i = d.bal * d.apr / 100 / 12; d.bal += i; interest += i; } });
      var left = budget;
      debts.forEach(function (d) { if (d.bal > 0) { var p = Math.min(d.min, d.bal, left); d.bal -= p; left -= p; } });
      for (var k = 0; k < order.length && left > 0.005; k++) {
        var d = debts.filter(function (x) { return x.id === order[k].id; })[0];
        if (d.bal > 0) { var p2 = Math.min(d.bal, left); d.bal -= p2; left -= p2; }
      }
      debts.forEach(function (d) { if (d.bal <= 0.005 && !paidOff[d.id]) { d.bal = 0; paidOff[d.id] = month; } });
      if (month === 1 && debts.every(function (d) { return d.bal >= 0; })) {
        var growing = debts.reduce(function (s, d) { return s + d.bal; }, 0) >= startTotal;
        if (growing) return { stuck: true, budget: budget };
      }
    }
    return {
      months: month, interest: interest, budget: budget, capped: month >= 600,
      order: order.map(function (o) { return { name: o.name, month: paidOff[o.id] || null, apr: o.apr, bal: o.bal }; })
    };
  }
  function monthsFromNow(n) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + n); return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }); }

  function payoffHtml() {
    var extra = num(setting("extraPay", "")) || 0;
    var a = simulate("avalanche", extra), s = simulate("snowball", extra);
    if (a.empty) return emptyBox('Add accounts with balances on the <a href="#/accounts">Accounts</a> page to build a payoff plan.');
    if (a.missing) return '<div class="note warn">To run the numbers, add the <b>interest rate (APR)</b> and <b>minimum payment</b> for: ' + a.missing.map(function (m) { return esc(m.name); }).join(", ") + '. <a href="#/accounts">Go to Accounts</a></div>';
    if (a.stuck) return '<div class="note bad">At ' + money(a.budget) + " a month, the interest is as much as or more than your payments, so the balances would not go down. Try a larger extra payment.</div>";
    var pick = ui.payMethod === "snowball" ? s : a;
    var h = '<div class="grid g2"><div class="stat"><span class="bar" style="background:var(--accent)"></span><div class="lbl">Avalanche (highest rate first)</div><div class="val">' + plural(a.months, "month") + '</div><div class="sub">Debt-free about ' + esc(monthsFromNow(a.months)) + " · interest " + money(a.interest) + "</div></div>" +
      '<div class="stat"><span class="bar" style="background:var(--info)"></span><div class="lbl">Snowball (smallest balance first)</div><div class="val">' + plural(s.months, "month") + '</div><div class="sub">Debt-free about ' + esc(monthsFromNow(s.months)) + " · interest " + money(s.interest) + "</div></div></div>";
    var diff = s.interest - a.interest;
    h += '<p class="note">' + (Math.abs(diff) < 1 ? "Both methods cost about the same in interest for your debts." : (diff > 0 ? "Avalanche" : "Snowball") + " saves about <b>" + money(Math.abs(diff)) + "</b> in interest with your numbers. Snowball usually pays off a first account sooner, which some people find motivating.") + "</p>";
    h += '<div class="tabs">' + [["avalanche", "Avalanche order"], ["snowball", "Snowball order"]].map(function (t) { return '<button type="button" data-action="pay-method" data-v="' + t[0] + '" class="' + (ui.payMethod === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + "</div>";
    h += '<div class="table-wrap"><table><thead><tr><th>#</th><th>Account</th><th>APR</th><th>Paid off</th></tr></thead><tbody>' + pick.order.map(function (o, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(o.name) + "</td><td>" + esc(o.apr) + "%</td><td><b>" + (o.month ? "Month " + o.month + " · " + esc(monthsFromNow(o.month)) : "—") + "</b></td></tr>";
    }).join("") + "</tbody></table></div>" +
      '<p class="help">Monthly budget used: ' + money(pick.budget) + " (all minimum payments + " + money(extra) + " extra). When an account is paid off, its payment rolls into the next one. Estimates assume your rates and minimums stay the same and no new charges are added; real minimums and interest calculations vary by lender.</p>";
    return h;
  }

  function habitHtml() {
    var open = state.accounts.filter(isOpen);
    if (!open.length) return emptyBox('Add accounts on the <a href="#/accounts">Accounts</a> page to track on-time payments.');
    var months = [];
    var d = new Date(); d.setDate(1);
    for (var i = 5; i >= 0; i--) { var x = new Date(d); x.setMonth(d.getMonth() - i); months.push(monthKey(x)); }
    var marks = 0, on = 0;
    var h = '<div class="table-wrap"><table class="habit"><thead><tr><th>Account</th>' + months.map(function (m) { return "<th>" + esc(monthLabel(m)) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      open.map(function (a) {
        return "<tr><td>" + esc(a.nickname) + "</td>" + months.map(function (m) {
          var v = getFlag("payLog", m, a.id) || "";
          if (v) { marks++; if (v === "ontime") on++; }
          return '<td><button type="button" class="hb ' + v + '" data-action="habit" data-m="' + m + '" data-id="' + a.id + '" aria-label="' + esc(a.nickname + " " + monthLabel(m)) + '">' + (v === "ontime" ? "✓" : v === "late" ? "✗" : "·") + "</button></td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
    // streak: consecutive months (newest first) where every marked account is on time and at least one mark
    var streak = 0;
    var allMonths = Object.keys(state.payLog).sort().reverse();
    var cur = monthKey(new Date());
    var mk = new Date(); mk.setDate(1);
    for (var j = 0; j < 120; j++) {
      var key = monthKey(mk);
      var row = state.payLog[key] || {};
      var vals = Object.keys(row).map(function (k) { var e = row[k]; return e && typeof e === "object" ? e.value : e; }).filter(Boolean);
      if (!vals.length) { if (key === cur) { mk.setMonth(mk.getMonth() - 1); continue; } break; }
      if (vals.indexOf("late") !== -1) break;
      streak++;
      mk.setMonth(mk.getMonth() - 1);
    }
    void allMonths;
    h = '<div class="grid g2" style="margin-bottom:12px"><div class="stat"><span class="bar" style="background:var(--good)"></span><div class="lbl">On-time streak</div><div class="val">' + plural(streak, "month") + '</div><div class="sub">Months in a row with every marked payment on time</div></div><div class="stat"><span class="bar" style="background:var(--accent)"></span><div class="lbl">On-time rate (last 6 months)</div><div class="val">' + (marks ? Math.round(on / marks * 100) + "%" : "—") + '</div><div class="sub">' + on + " of " + marks + " marked payments</div></div></div>" + h +
      '<p class="help">Tap a box to cycle: · not marked → ✓ on time → ✗ late. Payment history is the biggest part of a FICO Score (35%).</p>';
    return h;
  }

  function nextSteps() {
    var out = [];
    var u = overallUtil();
    var inacc = state.negatives.filter(function (n) { return n.status === "Not disputed" && (n.type === "wronginfo" || n.type === "idtheft"); });
    if (state.negatives.some(function (n) { return n.type === "idtheft" && n.status !== "Removed"; })) out.push(["bad", "Report identity theft at IdentityTheft.gov and place a fraud alert or freeze.", "#/maintain"]);
    if (inacc.length) out.push(["warn", "Dispute " + plural(inacc.length, "wrong item") + " you logged.", "#/disputes"]);
    var notDisp = state.negatives.filter(function (n) { return n.status === "Not disputed" && n.type !== "wronginfo" && n.type !== "idtheft"; });
    if (notDisp.length) out.push(["info", "Check " + plural(notDisp.length, "negative item") + ": if anything is wrong, dispute it. If it's accurate, it will age off on its own — see the dates in Report Review.", "#/report"]);
    var late = state.accounts.filter(function (a) { return isOpen(a) && a.status && a.status !== "Current"; });
    if (late.length) out.push(["bad", "Bring " + plural(late.length, "account") + " current — payment history is 35% of a FICO Score.", "#/accounts"]);
    var noAuto = state.accounts.filter(function (a) { return isOpen(a) && !a.autopay; });
    if (noAuto.length) out.push(["warn", "Turn on autopay (at least the minimum) for " + plural(noAuto.length, "account") + ".", "#/accounts"]);
    if (u.pct != null && u.pct >= 30) out.push(["warn", "Your card utilization is " + pct(u.pct) + ". Use the pay-down calculator to plan getting under 30%, then under 10%.", "#/accounts"]);
    else if (u.pct != null && u.pct >= 10) out.push(["info", "Your card utilization is " + pct(u.pct) + ". Getting under 10% is often cited for the highest scores.", "#/accounts"]);
    var reviewed = BUREAUS.filter(function (b) { var r = lastReview(b); return r && r.date >= addYears(todayStr(), -1); });
    if (reviewed.length < 3) out.push(["info", "Review your reports from " + BUREAUS.filter(function (b) { return reviewed.indexOf(b) === -1; }).join(", ") + ".", "#/report"]);
    if (!out.length) out.push(["good", "Nothing urgent. Keep paying on time and follow your maintenance routine.", "#/maintain"]);
    return out;
  }

  function viewPlan() {
    var h = head("Repair Plan", "Your action steps", "A plan built from what you've entered, plus tools to pay down debt and build an on-time habit.");
    h += '<div class="card"><h2>Next steps</h2><ul class="list">' + nextSteps().map(function (s) {
      return '<li><span class="pill ' + s[0] + '">' + (s[0] === "bad" ? "Now" : s[0] === "warn" ? "Soon" : s[0] === "good" ? "Good" : "Next") + '</span><a href="' + s[2] + '" style="color:inherit;text-decoration:none;font-weight:600">' + esc(s[1]) + "</a></li>";
    }).join("") + "</ul></div>";
    h += '<div class="card mt"><h2>Debt payoff planner</h2><p class="help">Compares paying highest interest first (avalanche) with smallest balance first (snowball), using your balances, rates, and minimum payments.</p>' +
      '<div class="row" style="margin-bottom:12px"><label class="row" style="gap:8px"><span>Extra each month on top of minimums</span><input type="text" inputmode="decimal" data-live="extra" value="' + esc(setting("extraPay", "")) + '" placeholder="0.00" style="width:130px"></label></div><div id="payoffOut">' + payoffHtml() + "</div></div>";
    h += '<div class="card mt"><h2>On-time payment tracker</h2>' + habitHtml() + "</div>";
    h += '<div class="grid g2 mt"><div class="card"><h2>Goodwill letters</h2><p>If a late payment is accurate but was a one-time slip, you can ask the lender to remove it as a courtesy. They don\'t have to, but some do — especially if your record is otherwise clean and you\'ve set up autopay.</p><a class="btn primary" href="#/letters" data-action="letter-type-go" data-v="goodwill">Write a goodwill letter</a></div>' +
      '<div class="card"><h2>Pay-for-delete: what to know</h2><ul class="steps"><li>It\'s a request, not a right. No law requires a collector to agree.</li><li>Accurate negative information can legally stay for its reporting period (' + src("CFPB", LINKS.cfpbAccurate) + ").</li><li>Get any agreement in writing before you pay, and keep copies.</li><li>Check your reports afterward to make sure it was done.</li><li>Paying a collection doesn't restart its 7-year reporting clock — that's set by the original delinquency date (" + src("FCRA §605(c)", LINKS.fcra605) + ').</li></ul><a class="btn" href="#/letters" data-action="letter-type-go" data-v="pfd">Write a pay-for-delete request</a></div></div>';
    return h + disclaimer();
  }

  function viewMaintain() {
    var h = head("Maintenance", "Keep your credit healthy", "Simple routines that repeat every month, quarter, and year. Check items off as you go.");
    h += '<div class="grid g3">' + ["m", "q", "y"].map(function (k) {
      var p = routineProgress(k), prev = routineProgress(k, prevPeriodDate(k));
      return '<div class="card"><div class="row between"><h2 style="margin:0">' + ROUTINES[k].label + '</h2><span class="pill ' + (p.done === p.total ? "good" : "info") + '">' + p.done + "/" + p.total + '</span></div><p class="help">' + esc(periodLabel(k)) + " · last " + (k === "m" ? "month" : k === "q" ? "quarter" : "year") + ": " + prev.done + "/" + prev.total + "</p>" +
        '<div class="util"><i style="width:' + (p.done / p.total * 100) + '%;background:var(--accent)"></i></div>' +
        ROUTINES[k].items.map(function (it) {
          var on = !!getFlag("routines", p.key, it.id);
          return '<label class="check ' + (on ? "done" : "") + '"><input type="checkbox" data-action="routine" data-p="' + p.key + '" data-id="' + it.id + '" ' + (on ? "checked" : "") + '><span><span class="t">' + esc(it.t) + '</span><br><span class="help">' + esc(it.d) + "</span></span></label>";
        }).join("") + "</div>";
    }).join("") + "</div>";

    h += '<div class="card mt"><h2>Credit freeze &amp; fraud alerts</h2>' +
      '<div class="grid g2"><div><h3>Credit freeze</h3><ul class="steps"><li>Stops most lenders from seeing your report, which makes it harder for someone to open credit in your name.</li><li><b>Free</b> to place, lift, and remove, and it doesn\'t affect your score.</li><li>You must place it <b>at each bureau separately</b>.</li><li>Online or by phone: placed within 1 business day; a lift happens within 1 hour. By mail: within 3 business days.</li><li>Lift it temporarily when you apply for new credit.</li></ul></div>' +
      '<div><h3>Fraud alert</h3><ul class="steps"><li>Tells businesses to verify it\'s really you before opening an account.</li><li><b>Free.</b> An initial alert lasts <b>1 year</b> and can be renewed.</li><li>Identity theft victims can get an <b>extended alert for 7 years</b> with an FTC Identity Theft Report or police report.</li><li>Contact one bureau — it must tell the other two.</li></ul></div></div>' +
      '<div class="table-wrap mt"><table><thead><tr><th>Bureau</th><th>Freeze</th><th>Fraud alert</th><th>I placed a freeze</th></tr></thead><tbody>' + BUREAUS.map(function (b) {
        var on = !!getFlag("flags", "freeze", b);
        return "<tr><td><b>" + b + "</b></td><td>" + src("Freeze ↗", BUREAU_LINKS[b].freeze) + "</td><td>" + src("Fraud alert ↗", BUREAU_LINKS[b].fraud) + '</td><td><input type="checkbox" data-action="freeze" data-id="' + b + '" ' + (on ? "checked" : "") + ' aria-label="' + b + ' freeze placed"></td></tr>';
      }).join("") + "</tbody></table></div>" +
      '<div class="note bad"><b>Think your identity was stolen?</b> Go to ' + src("IdentityTheft.gov", LINKS.idTheft) + " — the federal government's site to report it and get a step-by-step recovery plan.</div>" +
      '<p class="src">Sources: ' + src("CFPB: free credit freezes", LINKS.cfpbFreeze) + " · " + src("Equifax fraud alerts", BUREAU_LINKS.Equifax.fraud) + " · " + src("TransUnion credit freeze", BUREAU_LINKS.TransUnion.freeze) + "</p></div>";

    h += '<div class="card mt"><h2>⚠️ Credit repair scam warnings</h2><ul class="steps">' +
      "<li><b>No one can legally remove accurate negative information</b> from your credit report. Only errors can be fixed — and you can do that yourself for free (" + src("CFPB", LINKS.cfpbHowLong) + ").</li>" +
      "<li><b>Paying before the work is done is against the law.</b> Under the Credit Repair Organizations Act, credit repair companies can't charge you until they've fully done the work they promised.</li>" +
      "<li>They must give you a <b>written contract</b> explaining your rights, the services, how long it will take, the total cost, and any guarantees — and you get <b>3 days to cancel</b> without charge.</li>" +
      "<li>Red flags: telling you not to contact the bureaus yourself, telling you to dispute information that's accurate, or offering a \u201Cnew credit identity\u201D (using a different number instead of your own is illegal).</li>" +
      "<li>Report problems to the FTC at ReportFraud.ftc.gov, to the CFPB, or to the Texas Attorney General.</li></ul>" +
      '<p class="src">Sources: ' + src("FTC: Credit Repair — How to Help Yourself (PDF)", LINKS.ftcRepairPdf) + " · " + src("CFPB: spotting credit repair scams", LINKS.cfpbScam) + " · " + src("CFPB complaint", LINKS.cfpbComplaint) + "</p></div>";
    return h + disclaimer();
  }

  function viewLearn() {
    var f = [["Payment history", 35, "Whether you've paid on time. The strongest predictor, so it counts most. A few late payments aren't an automatic score-killer, but on-time payments matter most."],
      ["Amounts owed", 30, "How much you owe and how much of your available credit you use (utilization). Using a lot of your limits can signal you're overextended."],
      ["Length of credit history", 15, "The age of your oldest and newest accounts and the average age of all of them. Longer is generally better."],
      ["New credit", 10, "Opening several accounts in a short time is riskier. Inquiries stay on your report 2 years, but FICO Scores only count the last 12 months."],
      ["Credit mix", 10, "Having different types (cards, installment loans, mortgage). You don't need one of each, and it's rarely a key factor."]];
    var h = head("Learn", "How credit scores work", "Plain-English explanations from official and score-maker sources.");
    h += '<div class="card"><h2>The five FICO Score factors</h2>' + f.map(function (x) {
      return '<div class="factor"><b>' + esc(x[0]) + '</b><div class="fb"><i style="width:' + (x[1] / 35 * 100) + '%"></i></div><b>' + x[1] + '%</b></div><p class="help" style="margin:0 0 10px">' + esc(x[2]) + "</p>";
    }).join("") + '<p class="help">The importance of each category can vary from person to person. FICO Scores don\'t consider your age, where you live, race, religion, marital status, salary, or job.</p><p class="src">Source: ' + src("myFICO: What's in your credit score", LINKS.myficoFactors) + "</p></div>";
    h += '<div class="grid g2 mt"><div class="card"><h2>Habits that help</h2><ul class="steps"><li><b>Pay on time, every time.</b> Autopay or reminders help. If you\'ve missed payments, get current and stay current.</li><li><b>Keep balances low</b> compared with your limits.</li><li><b>Be careful closing accounts</b> — it can raise your utilization.</li><li><b>Only apply for credit you need.</b> Rate-shop for a loan within a short period.</li><li><b>You don\'t need to carry a balance.</b> Paying in full each month gets you the best scores and avoids interest.</li></ul><p class="src">Sources: ' + src("CFPB: get and keep a good score", LINKS.cfpbGoodScore) + " · " + src("CFPB: understand your score", LINKS.cfpbUnderstand) + " · " + src("myFICO: improve your score", LINKS.myficoImprove) + "</p></div>" +
      '<div class="card"><h2>Common questions</h2>' +
      '<details class="more"><summary>Does checking my own credit hurt my score?</summary><p>No. Checking your own report is a soft inquiry and doesn\'t affect your scores (' + src("AnnualCreditReport.com", LINKS.acr) + ").</p></details>" +
      '<details class="more"><summary>Why are my scores different at each bureau?</summary><p>Each bureau may have slightly different information, and there are many score models and versions (FICO, VantageScore). Compare scores from the same bureau and model over time.</p></details>' +
      '<details class="more"><summary>Can I remove accurate negative items?</summary><p>Not by dispute. Accurate items stay for their reporting period. You can ask a lender for a goodwill adjustment, but they don\'t have to agree (' + src("CFPB", LINKS.cfpbAccurate) + ").</p></details>" +
      '<details class="more"><summary>Do I have to pay to fix errors?</summary><p>No. Disputing errors with the bureaus and furnishers is free (' + src("CFPB", LINKS.cfpbDispute) + ").</p></details>" +
      '<details class="more"><summary>What is a furnisher?</summary><p>A company that sends your information to the credit bureaus — your bank, card company, landlord, or a debt collector.</p></details></div></div>';
    return h + disclaimer();
  }

  function viewSettings() {
    var p = profile();
    var h = head("Settings", "Settings & backup", "");
    h += '<div class="card"><h2>Your details for letters</h2><p class="help">Used only to fill in letters on this device (and synced if you turn on Sync). No SSN, date of birth, or account numbers.</p><form data-form="profile" class="form-grid" autocomplete="off">' +
      inp("Full name", "name", p.name, 'maxlength="60"') + inp("Street address", "street", p.street, 'maxlength="80"') + inp("City, State ZIP", "city", p.city, 'maxlength="60" placeholder="e.g. Frisco, TX 75034"') + inp("Phone (optional)", "phone", p.phone, 'type="tel" maxlength="20"') +
      '<div class="field"><span>&nbsp;</span><button class="btn primary" type="submit">Save</button></div></form></div>';
    h += '<div class="card mt"><h2>Appearance</h2><div class="row"><button class="btn" data-action="theme" data-v="light">☀️ Light</button><button class="btn" data-action="theme" data-v="dark">🌙 Dark</button></div></div>';
    h += '<div class="card mt"><h2>Backup</h2><p>Download a copy of everything, or restore from a backup file. Backups never include your sync token.</p><div class="row"><button class="btn primary" data-action="export">⬇️ Export backup (JSON)</button><label class="btn">⬆️ Import backup<input type="file" accept="application/json,.json" data-action="import" hidden></label><button class="btn danger" data-action="wipe">Delete all data on this device</button></div></div>';
    h += '<div class="card mt"><h2>Privacy &amp; safety</h2><ul class="steps"><li>Everything is saved only in this browser on this device. There are no ads or tracking.</li><li>This app never asks for your Social Security number, full account or card numbers, PINs, passwords, or bank logins. Only the last 4 digits of an account are allowed.</li><li>If you turn on Sync, your data is copied to a private Gist on your own GitHub account.</li></ul></div>';
    h += '<div class="card mt"><h2>About</h2><p>Credit Care helps you track, repair, and maintain your credit. It is educational only — not legal or financial advice — and it doesn\'t contact anyone for you. Facts in the app come from the CFPB, the FCRA (U.S. law), the FTC, myFICO, the three credit bureaus, and AnnualCreditReport.com, with links next to each one.</p><p class="help">Version creditcare-v1</p></div>';
    return h + disclaimer();
  }

  function viewSync() {
    return head("Sync", "Sync", "Keep the same scores, accounts, disputes, and checklists on your PC, tablet, and phone through a private GitHub Gist on your own account.") +
      '<div class="card" id="syncStatusCard"><h2>Status</h2><p id="syncStatusLine" class="sync-status">Not connected</p><p id="syncLastLine" class="help"></p><p id="syncTokenMask" class="help"></p>' +
      '<p class="row" id="syncConnectedActions" hidden><button type="button" class="btn primary" data-action="sync-now">Sync now</button><button type="button" class="btn danger" data-action="disconnect-sync">Disconnect</button></p></div>' +
      '<div class="card mt" id="syncSetupCard"><h2>Connect this device</h2>' +
      "<p>Sync uses a private GitHub note (called a Gist) on your own GitHub account. This app never asks for your GitHub password. The access token you paste is stored only on this device and is never shown back in full. It is sent only to api.github.com and is never included in backups.</p>" +
      '<ol class="steps"><li>Sign in to GitHub in your browser. If you do not have an account yet, create one at <a href="https://github.com/signup" target="_blank" rel="noopener noreferrer">github.com</a> first.</li>' +
      '<li>Open GitHub’s classic token page to create an access token with only the “gist” permission: <a href="https://github.com/settings/tokens/new?scopes=gist&amp;description=Credit%20Care%20Sync" target="_blank" rel="noopener noreferrer">github.com/settings/tokens</a>.</li>' +
      "<li>On that page, confirm that only the <strong>gist</strong> box is checked. For expiration, choose <strong>No expiration</strong> or <strong>1 year</strong>, then click <strong>Generate token</strong>.</li>" +
      "<li>Copy the token now. GitHub will not show it again.</li>" +
      "<li>Come back here, paste it below, and tap <strong>Connect</strong>.</li>" +
      "<li>On your PC, your Lenovo tablet, and your Motorola phone, open Credit Care and paste the <strong>same token</strong> on this Sync screen.</li></ol>" +
      '<p class="help">If you already made a gist-scope token for My Daily Journal or Business SuccessHQ, you can reuse it here. Credit Care will create or find its own private Gist named “Credit Care Sync,” and it will not mix with your other apps. Never paste the token into a chat or share it with anyone. If it expires, create a new one and connect again.</p>' +
      '<form data-form="connect-sync" autocomplete="off" id="syncConnectForm"><div class="field"><label><span>GitHub access token</span><input id="syncTokenInput" name="token" type="password" maxlength="200" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" placeholder="Paste your token"></label></div>' +
      '<p class="row"><button type="submit" class="btn primary">Connect</button></p><p id="syncConnectError" class="sync-error" role="alert"></p></form></div>' +
      '<div class="card mt"><h2>How it stays in sync</h2><p>The first device that connects creates a private Gist named “Credit Care Sync” (file credit-data.json). Other devices that connect with a token from the same account find that same Gist automatically. Changes are sent a few seconds after you make them, and again when you open the app or come back to it. If you are offline, the app keeps your changes and sends them when you are back online.</p>' +
      "<p>If you edit the same item on two devices before they sync, the later edit is kept. Deleting an item on one device is remembered so it does not come back from the other device, unless that other device changed it more recently.</p></div>" + disclaimer();
  }

  /* ---------- render ---------- */
  var VIEWS = { dashboard: viewDashboard, accounts: viewAccounts, report: viewReport, disputes: viewDisputes, letters: viewLetters, plan: viewPlan, maintain: viewMaintain, learn: viewLearn, settings: viewSettings, sync: viewSync };
  var lastRoute = "";
  function route() { var r = (location.hash || "").replace(/^#\/?/, "").split("/")[0]; return VIEWS[r] ? r : "dashboard"; }
  function renderNav() {
    var r = route(), grp = "", h = "";
    NAV.forEach(function (n) {
      if (n.group !== grp) { grp = n.group; h += '<div class="grp">' + esc(grp) + "</div>"; }
      h += '<a href="#/' + n.id + '" class="' + (n.id === r ? "active" : "") + '"><span class="ico">' + n.ico + "</span>" + esc(n.label) + "</a>";
    });
    document.getElementById("rail").innerHTML = h;
    document.getElementById("tabbar").innerHTML = TABS.map(function (id) {
      var n = NAV.filter(function (x) { return x.id === id; })[0];
      return '<a href="#/' + id + '" class="' + (id === r ? "active" : "") + '"><span class="ico">' + n.ico + "</span>" + esc(n.label.split(" ")[0]) + "</a>";
    }).join("") + '<a href="#" data-more="1"><span class="ico">☰</span>More</a>';
    document.getElementById("themeBtn").innerHTML = document.documentElement.dataset.theme === "dark" ? "☀" : "☾";
  }
  function render() {
    var r = route();
    var view = document.getElementById("view");
    view.innerHTML = VIEWS[r]();
    renderNav();
    if (r !== lastRoute) { window.scrollTo(0, 0); lastRoute = r; }
    if (r === "letters") updateLetterPreview();
    if (r === "sync") renderSyncStatus();
    renderSyncBadge();
    document.title = (NAV.filter(function (n) { return n.id === r; })[0] || {}).label + " · Credit Care";
  }
  function rerenderKeepScroll() { var y = window.scrollY; render(); window.scrollTo(0, y); }

  function updateLetterPreview() {
    var o = readLetterForm();
    ui.letter = o;
    var el = document.getElementById("letterPreview");
    if (el) el.textContent = buildLetter(ui.letterType, o);
  }
  function letterTitle(t, o) {
    var who = t === "bureau" ? (o.bureau || "bureau") : (br(o.toName).split("\n")[0] || (t === "goodwill" ? "lender" : "company"));
    return LETTER_TYPES[t] + " — " + who + " — " + fmtDate(o.date || todayStr());
  }
  function rememberProfile(o) {
    if (o.remember === false) return;
    ["name", "street", "city", "phone"].forEach(function (k) { if (o[k] != null && o[k] !== setting(k, "")) setSetting(k, o[k]); });
  }
  function printText(text) {
    var pa = document.getElementById("printArea");
    pa.textContent = text;
    setTimeout(function () { window.print(); }, 50);
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("Copied to clipboard"); }, function () { fallbackCopy(text); });
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Copied to clipboard"); } catch (e) { toast("Select the letter and copy it"); }
    ta.remove();
  }

  /* ---------- events ---------- */
  function formObj(form) {
    var o = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      o[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    return o;
  }
  function onSubmit(e) {
    var form = e.target.closest("form[data-form]");
    if (!form) return;
    e.preventDefault();
    var kind = form.getAttribute("data-form"), o = formObj(form);
    if (kind === "score") {
      var sc = parseInt(o.score, 10);
      if (!(sc >= 300 && sc <= 850)) { toast("Enter a score between 300 and 850"); return; }
      upsert("scores", { date: o.date, bureau: o.bureau, model: o.model, score: sc, source: o.source });
      toast("Score added"); render();
    } else if (kind === "reminder") {
      upsert("reminders", { title: o.title, date: o.date, done: false });
      toast("Reminder added"); rerenderKeepScroll();
    } else if (kind === "account") {
      if (o.last4 && !/^\d{4}$/.test(o.last4)) { toast("Use only the last 4 digits"); return; }
      var acc = { nickname: o.nickname, type: o.type, last4: o.last4, limit: o.limit.replace(/[$,]/g, ""), balance: o.balance.replace(/[$,]/g, ""), apr: o.apr.replace(/%/g, ""), minPay: o.minPay.replace(/[$,]/g, ""), dueDay: o.dueDay, status: o.status, autopay: !!o.autopay, notes: o.notes };
      if (o.id) acc.id = o.id;
      upsert("accounts", acc);
      ui.edit.accounts = null;
      toast(o.id ? "Account updated" : "Account added"); rerenderKeepScroll();
    } else if (kind === "negative") {
      if (o.last4 && !/^\d{4}$/.test(o.last4)) { toast("Use only the last 4 digits"); return; }
      var ng = { type: o.type, creditor: o.creditor, last4: o.last4, date: o.date, amount: o.amount.replace(/[$,]/g, ""), status: o.status, notes: o.notes, bureaus: BUREAUS.filter(function (b) { return o["b_" + b]; }) };
      if (o.id) ng.id = o.id;
      upsert("negatives", ng);
      ui.edit.negatives = null;
      toast(o.id ? "Item updated" : "Item logged"); rerenderKeepScroll();
    } else if (kind === "dispute") {
      var dp = { negId: o.negId, item: o.item, to: o.to, furnisher: o.furnisher, sent: o.sent, method: o.method, received: o.received, ref: o.ref, outcome: o.outcome, extended: !!o.extended, notes: o.notes };
      if (o.id) dp.id = o.id;
      upsert("disputes", dp);
      if (o.negId) { var n = find("negatives", o.negId); if (n && n.status === "Not disputed") upsert("negatives", { id: n.id, status: "Disputing" }); }
      ui.edit.disputes = null; ui.disputeDraft = null;
      toast(o.id ? "Dispute updated" : "Dispute added"); rerenderKeepScroll();
    } else if (kind === "profile") {
      ["name", "street", "city", "phone"].forEach(function (k) { setSetting(k, o[k]); });
      save(); toast("Saved");
    } else if (kind === "connect-sync") {
      connectSync();
    }
  }

  function onClick(e) {
    var more = e.target.closest("[data-more]");
    if (more) { e.preventDefault(); openMenu(); return; }
    var el = e.target.closest("[data-action]");
    if (!el || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "checkbox" && el.type !== "button")) return;
    var a = el.getAttribute("data-action"), id = el.getAttribute("data-id"), key = el.getAttribute("data-key"), v = el.getAttribute("data-v");
    if (el.tagName === "INPUT" && el.type === "checkbox") {
      if (a === "review-check") { setFlag("reviewChecks", ui.reviewBureau, id, el.checked); rerenderKeepScroll(); }
      else if (a === "routine") { setFlag("routines", el.getAttribute("data-p"), id, el.checked); rerenderKeepScroll(); }
      else if (a === "freeze") { setFlag("flags", "freeze", id, el.checked); toast(el.checked ? id + " freeze marked as placed" : id + " freeze unmarked"); }
      return;
    }
    if (a === "del") {
      if (!confirm("Delete this? This can't be undone.")) return;
      removeItem(key, id);
      if (key === "accounts") Object.keys(state.payLog).forEach(function (m) { if (state.payLog[m][id]) delete state.payLog[m][id]; });
      persist();
      toast("Deleted"); rerenderKeepScroll();
    } else if (a === "edit") {
      ui.edit[key] = id; render();
      var hd = document.getElementById(key === "accounts" ? "accountFormHead" : key === "negatives" ? "negFormHead" : "disputeFormHead");
      if (hd) hd.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (a === "cancel-edit") { ui.edit[key] = null; rerenderKeepScroll(); }
    else if (a === "all-scores") { ui.allScores = !ui.allScores; rerenderKeepScroll(); }
    else if (a === "score-model") { ui.scoreModel = v; rerenderKeepScroll(); }
    else if (a === "reminder-done") { upsert("reminders", { id: id, done: true }); toast("Marked done"); rerenderKeepScroll(); }
    else if (a === "target") { ui.target = +v; rerenderKeepScroll(); }
    else if (a === "review-bureau") { ui.reviewBureau = v; rerenderKeepScroll(); }
    else if (a === "finish-review") {
      upsert("reviews", { bureau: ui.reviewBureau, date: todayStr(), checked: REVIEW_ITEMS.filter(function (it) { return !!getFlag("reviewChecks", ui.reviewBureau, it.id); }).length });
      REVIEW_ITEMS.forEach(function (it) { if (getFlag("reviewChecks", ui.reviewBureau, it.id)) setFlag("reviewChecks", ui.reviewBureau, it.id, false); });
      toast(ui.reviewBureau + " review saved for " + fmtDate(todayStr())); rerenderKeepScroll();
    } else if (a === "dispute-from-neg") {
      var n = find("negatives", id);
      ui.disputeDraft = { negId: id, item: (NEG_TYPES[n.type] || {}).label + " — " + n.creditor + (n.last4 ? " ••" + n.last4 : ""), to: (n.bureaus && n.bureaus[0]) || "Equifax" };
      location.hash = "#/disputes";
      setTimeout(function () { var hd = document.getElementById("disputeFormHead"); if (hd) hd.scrollIntoView({ block: "start" }); }, 60);
    } else if (a === "letter-from-neg") {
      e.preventDefault();
      var ng = find("negatives", id);
      ui.letterType = "bureau"; ui.letterItems = 1;
      ui.letter = Object.assign({}, ui.letter || {}, { bureau: (ng.bureaus && ng.bureaus[0]) || "Equifax", src1: ng.creditor, kind1: (NEG_TYPES[ng.type] || {}).label.toLowerCase(), l41: ng.last4 || "" });
      ui.letter.toName = "Complaint Department\n" + ui.letter.bureau;
      location.hash = "#/letters";
    } else if (a === "letter-type" || a === "letter-type-go") {
      if (a === "letter-type-go") e.preventDefault();
      var keep = readLetterForm();
      ui.letterType = v;
      ui.letter = { name: keep.name, street: keep.street, city: keep.city, phone: keep.phone, date: keep.date };
      if (a === "letter-type-go") location.hash = "#/letters"; else rerenderKeepScroll();
    } else if (a === "letter-add-item") { ui.letter = readLetterForm(); ui.letterItems = Math.min(5, ui.letterItems + 1); rerenderKeepScroll(); }
    else if (a === "letter-remove-item") { ui.letter = readLetterForm(); ui.letterItems = Math.max(1, ui.letterItems - 1); rerenderKeepScroll(); }
    else if (a === "letter-copy") { updateLetterPreview(); rememberProfile(ui.letter); save(); copyText(buildLetter(ui.letterType, ui.letter)); }
    else if (a === "letter-print") { updateLetterPreview(); rememberProfile(ui.letter); save(); printText(buildLetter(ui.letterType, ui.letter)); }
    else if (a === "letter-save") {
      updateLetterPreview(); rememberProfile(ui.letter);
      upsert("letters", { type: ui.letterType, title: letterTitle(ui.letterType, ui.letter), text: buildLetter(ui.letterType, ui.letter) });
      toast("Letter saved"); rerenderKeepScroll();
    } else if (a === "letter-log") {
      updateLetterPreview(); var o = ui.letter;
      rememberProfile(o);
      upsert("letters", { type: ui.letterType, title: letterTitle(ui.letterType, o), text: buildLetter(ui.letterType, o) });
      ui.disputeDraft = { item: [o.src1, o.kind1].filter(Boolean).join(" — ") || "Disputed item", to: ui.letterType === "bureau" ? (o.bureau || "Equifax") : "Furnisher (creditor or collector)", furnisher: ui.letterType === "furnisher" ? br(o.toName).split("\n")[0] : "", method: "Certified mail (return receipt)", sent: todayStr() };
      toast("Letter saved — finish the dispute details");
      location.hash = "#/disputes";
      setTimeout(function () { var hd = document.getElementById("disputeFormHead"); if (hd) hd.scrollIntoView({ block: "start" }); }, 60);
    } else if (a === "saved-print") { printText((find("letters", id) || {}).text || ""); }
    else if (a === "saved-copy") { copyText((find("letters", id) || {}).text || ""); }
    else if (a === "pay-method") { ui.payMethod = v; document.getElementById("payoffOut").innerHTML = payoffHtml(); }
    else if (a === "habit") {
      var m = el.getAttribute("data-m"), cur = getFlag("payLog", m, id) || "";
      var next = cur === "" ? "ontime" : cur === "ontime" ? "late" : "";
      setFlag("payLog", m, id, next); rerenderKeepScroll();
    } else if (a === "theme") { setTheme(v); }
    else if (a === "export") { exportBackup(); }
    else if (a === "wipe") {
      if (!confirm("Delete all Credit Care data on this device? This doesn't remove your sync token. If Sync is connected, data from your other devices may come back the next time this device syncs.")) return;
      var tok = CreditSync.getToken();
      var fresh = emptyState();
      CreditSync.LIST_KEYS.forEach(function (k) { state[k].forEach(function (x) { fresh.tombstones[k][x.id] = nowISO(); }); });
      state = fresh; save(); void tok; toast("All data deleted on this device"); render();
    } else if (a === "sync-now") { runSync("manual"); }
    else if (a === "disconnect-sync") { disconnectSync(); }
  }

  function onChange(e) {
    var el = e.target;
    var a = el.getAttribute("data-action");
    if (a === "dispute-outcome") { upsert("disputes", { id: el.getAttribute("data-id"), outcome: el.value }); toast("Outcome saved"); rerenderKeepScroll(); return; }
    if (a === "import" && el.files && el.files[0]) { importBackup(el.files[0]); el.value = ""; return; }
    var live = el.getAttribute("data-live");
    if (live === "negtype") {
      var t = NEG_TYPES[el.value];
      var lab = document.getElementById("negDateLabel"), rule = document.getElementById("negRule");
      if (lab) lab.textContent = t.dateLabel; if (rule) rule.textContent = t.rule;
    } else if (live === "letterbureau") {
      ui.letter = readLetterForm();
      ui.letter.toName = "Complaint Department\n" + el.value;
      rerenderKeepScroll();
    } else if (live === "disputeneg") {
      var n = find("negatives", el.value);
      var form = el.form;
      if (n && form) {
        form.elements.item.value = (NEG_TYPES[n.type] || {}).label + " — " + n.creditor + (n.last4 ? " ••" + n.last4 : "");
        if (n.bureaus && n.bureaus[0]) form.elements.to.value = n.bureaus[0];
      }
    } else if (el.closest("#letterForm")) updateLetterPreview();
  }
  function onInput(e) {
    var el = e.target, live = el.getAttribute("data-live");
    if (live === "target") {
      var v = num(el.value);
      if (v != null && v >= 0 && v <= 100) { ui.target = v; document.getElementById("payDownOut").innerHTML = payDownHtml(); }
    } else if (live === "extra") {
      setSetting("extraPay", el.value.replace(/[$,]/g, ""));
      persist(); schedulePush();
      document.getElementById("payoffOut").innerHTML = payoffHtml();
    } else if (el.closest("#letterForm")) updateLetterPreview();
  }

  /* ---------- theme, menu ---------- */
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    setSetting("theme", t); save();
    rerenderKeepScroll();
  }
  function applyThemeFromSettings() {
    var t = setting("theme", "");
    if (t === "dark" || t === "light") { document.documentElement.dataset.theme = t; try { localStorage.setItem(THEME_KEY, t); } catch (e) {} }
  }
  function openMenu() { document.getElementById("rail").classList.add("open"); document.getElementById("railBackdrop").classList.add("show"); }
  function closeMenu() { document.getElementById("rail").classList.remove("open"); document.getElementById("railBackdrop").classList.remove("show"); }

  /* ---------- backup ---------- */
  function exportBackup() {
    var data = CreditSync.syncPayload(state);
    data.kind = "credit-care-backup";
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "credit-care-backup-" + todayStr() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("Backup downloaded");
  }
  function importBackup(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var d = CreditSync.parsePayload(reader.result);
        if (!d) throw new Error("bad");
        if (!confirm("Replace the data on this device with this backup?")) return;
        var fresh = emptyState();
        CreditSync.LIST_KEYS.forEach(function (k) { fresh[k] = Array.isArray(d[k]) ? d[k] : []; });
        CreditSync.FLAG_KEYS.forEach(function (k) { fresh[k] = d[k] && typeof d[k] === "object" ? d[k] : {}; });
        fresh.settings = d.settings || {}; fresh.settingsTimes = d.settingsTimes || {};
        var t = nowISO();
        CreditSync.LIST_KEYS.forEach(function (k) {
          var keepIds = {}; fresh[k].forEach(function (x) { keepIds[x.id] = 1; x.updatedAt = t; });
          state[k].forEach(function (x) { if (!keepIds[x.id]) fresh.tombstones[k][x.id] = t; });
        });
        state = fresh; save(); applyThemeFromSettings(); toast("Backup restored"); render();
      } catch (e) { toast("That file isn't a Credit Care backup."); }
    };
    reader.readAsText(file);
  }

  /* ---------- sync (same approach as Business SuccessHQ) ---------- */
  var pushTimer = 0, pullTimer = 0, syncing = false, dirty = false, syncStatus = "idle", syncError = "";
  function formatStampCentral(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) + " Central";
  }
  function schedulePush() {
    if (!CreditSync.getToken()) return;
    dirty = true; renderSyncBadge();
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { runSync("auto"); }, 3000);
  }
  function schedulePull(reason) {
    if (!CreditSync.getToken()) return;
    clearTimeout(pullTimer);
    pullTimer = setTimeout(function () { runSync(reason || "focus"); }, 400);
  }
  function applyMergedState(m) {
    CreditSync.LIST_KEYS.forEach(function (k) { state[k] = m[k] || []; });
    CreditSync.FLAG_KEYS.forEach(function (k) { state[k] = m[k] || {}; });
    state.settings = m.settings || {}; state.settingsTimes = m.settingsTimes || {};
    state.tombstones = m.tombstones || CreditSync.emptyTombs();
    state.version = 1;
    applyThemeFromSettings();
  }
  function isTyping() {
    var a = document.activeElement;
    return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT") && a.type !== "checkbox";
  }
  function runSync(reason) {
    var token = CreditSync.getToken();
    if (!token) return Promise.resolve();
    if (navigator.onLine === false) { syncStatus = "offline"; dirty = true; renderSyncStatus(); return Promise.resolve(); }
    if (syncing) { dirty = true; return Promise.resolve(); }
    syncing = true; syncStatus = reason === "connect" ? "connecting" : "syncing"; syncError = "";
    renderSyncStatus();
    var before = JSON.stringify(CreditSync.syncPayload(state).data);
    return Promise.resolve()
      .then(function () {
        var knownId = CreditSync.getGistId();
        if (!knownId) return null;
        return CreditSync.getGist(token, knownId).then(function (gist) { return { gist: gist, remote: CreditSync.readGistData(gist) }; })
          .catch(function () { CreditSync.setGistId(""); return null; });
      })
      .then(function (found) {
        if (found) return found;
        return CreditSync.findExistingGist(token).then(function (g) {
          if (!g) return null;
          CreditSync.setGistId(g.id);
          return CreditSync.getGist(token, g.id).then(function (gist) { return { gist: gist, remote: CreditSync.readGistData(gist) }; });
        });
      })
      .then(function (found) {
        if (found && found.remote) {
          var merged = CreditSync.mergeStates(state, found.remote);
          applyMergedState(merged);
          persist();
        }
        dirty = false;
        var content = JSON.stringify(CreditSync.syncPayload(state), null, 2);
        if (!CreditSync.getGistId()) {
          return CreditSync.createGist(token, content).then(function (created) { if (created && created.id) CreditSync.setGistId(created.id); });
        }
        return CreditSync.patchGist(token, CreditSync.getGistId(), content);
      })
      .then(function () {
        CreditSync.setLastSync(nowISO());
        syncStatus = "synced";
        var after = JSON.stringify(CreditSync.syncPayload(state).data);
        if (after !== before && !isTyping()) rerenderKeepScroll();
      }, function (err) {
        syncStatus = "error";
        syncError = err && err.message ? String(err.message) : "Sync could not be completed.";
      })
      .then(function () {
        syncing = false; renderSyncStatus();
        if (dirty && CreditSync.getToken() && navigator.onLine) schedulePush();
      });
  }
  function connectSync() {
    var input = document.getElementById("syncTokenInput"), err = document.getElementById("syncConnectError");
    var token = input ? input.value.trim() : "";
    if (err) err.textContent = "";
    if (!token) { if (err) err.textContent = "Paste your GitHub access token first."; return; }
    if (/\s/.test(token)) { if (err) err.textContent = "The token should not contain spaces. Copy it again from GitHub."; return; }
    CreditSync.setToken(token);
    if (input) input.value = "";
    syncStatus = "connecting";
    runSync("connect").then(function () {
      if (syncStatus === "error") {
        if (syncError.indexOf("not accepted") !== -1) CreditSync.clearToken();
        var e2 = document.getElementById("syncConnectError");
        if (e2) e2.textContent = syncError;
        renderSyncStatus();
      } else { toast("Sync connected"); rerenderKeepScroll(); }
    });
  }
  function disconnectSync() {
    if (!confirm("Disconnect Sync on this device? Your data stays on this device, and the private Gist stays on your GitHub account.")) return;
    clearTimeout(pushTimer); clearTimeout(pullTimer);
    CreditSync.clearToken(); CreditSync.setLastSync("");
    syncing = false; syncStatus = "idle"; syncError = "";
    toast("Sync disconnected"); rerenderKeepScroll();
  }
  function syncStatusText() {
    if (!CreditSync.getToken()) return "Not connected";
    if (syncStatus === "offline" || navigator.onLine === false) return "Offline — changes will sync when you are back online";
    if (syncStatus === "connecting") return "Connecting…";
    if (syncStatus === "syncing") return "Syncing…";
    if (syncStatus === "error") return "Sync needs attention";
    if (dirty) return "Changes waiting to sync";
    if (syncStatus === "synced" || CreditSync.getLastSync()) return "Connected";
    return "Connected";
  }
  function renderSyncBadge() {
    var b = document.getElementById("syncBadge");
    if (!b) return;
    if (!CreditSync.getToken()) { b.hidden = true; return; }
    b.hidden = false;
    b.textContent = "⟳ " + syncStatusText();
  }
  function renderSyncStatus() {
    renderSyncBadge();
    var line = document.getElementById("syncStatusLine");
    if (!line) return;
    var connected = !!CreditSync.getToken();
    line.textContent = syncStatusText() + (syncStatus === "error" && syncError ? " — " + syncError : "");
    var last = CreditSync.getLastSync();
    document.getElementById("syncLastLine").textContent = connected && last ? "Last synced " + formatStampCentral(last) : "";
    document.getElementById("syncTokenMask").textContent = connected ? "Token on this device: " + CreditSync.maskToken(CreditSync.getToken()) : "";
    document.getElementById("syncConnectedActions").hidden = !connected;
    var setup = document.getElementById("syncSetupCard");
    if (setup) setup.querySelector("h2").textContent = connected ? "Use a different token" : "Connect this device";
  }

  /* ---------- boot ---------- */
  document.getElementById("themeBtn").addEventListener("click", function () { setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"); });
  document.getElementById("menuBtn").addEventListener("click", function () { if (document.getElementById("rail").classList.contains("open")) closeMenu(); else openMenu(); });
  document.getElementById("railBackdrop").addEventListener("click", closeMenu);
  document.getElementById("rail").addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
  document.getElementById("tabbar").addEventListener("click", onClick);
  var viewEl = document.getElementById("view");
  viewEl.addEventListener("submit", onSubmit);
  viewEl.addEventListener("click", onClick);
  viewEl.addEventListener("change", onChange);
  viewEl.addEventListener("input", onInput);
  window.addEventListener("hashchange", render);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") schedulePull("focus"); });
  window.addEventListener("focus", function () { schedulePull("focus"); });
  window.addEventListener("online", function () { if (CreditSync.getToken()) runSync("online"); });
  applyThemeFromSettings();
  if (!location.hash) location.hash = "#/dashboard"; else render();
  if (CreditSync.getToken()) runSync("open");
})();
