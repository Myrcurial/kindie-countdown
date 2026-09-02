// Kindie Countdown
// Everything here runs in the browser using the device clock.
// Data lives in data.csv: date,event,importance,no_school (ISO dates, booleans TRUE/FALSE.

(function () {
  "use strict";

  var app = document.getElementById("app");

  // Friendly emoji per event so each day gets a little face.
  var ICONS = {
    "first day of school": "🎒",
    "thanksgiving": "🦃",
    "pa day": "📋",
    "diwali": "🪔",
    "winter holiday": "☃️",
    "back to school": "🎒",
    "lunar new year": "🏮",
    "family day": "💛",
    "eid al-fitr": "🌙",
    "pi day": "🥧",
    "spring break": "🌷",
    "good friday": "🌤️",
    "easter monday": "🥚",
    "star wars day": "🛰️",
    "victoria day": "🎆",
    "eid al-adha": "🌙",
    "last day of school": "🎉"
  };

  function iconFor(nameValue) {
    var key = nameValue.toLowerCase();
    if (ICONS[key]) return ICONS[key];
    return "🗓️";
  }

function parseDate(strValue) {
    var p = strValue.split("-");
    var y = parseInt(p[0], 10);
    var m = parseInt(p[1], 10) - 1;
    var d = parseInt(p[2], 10);
    return new Date(y, m, d);
  }

  // Local midnight for "now".
  function today() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  // Whole days from today (positive future, zero today.
  function daysFromToday(dateValue, todayVal) {
    return Math.round((dateValue.getTime() - todayVal.getTime()) / 86400000);
  }

  function prettyDate(dateValue) {
    return dateValue.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
  }

  function shortDate(dateValue) {
    var m = dateValue.toLocaleDateString("en-CA", { month: "short" });
    var d = dateValue.getDate();
    return m + " " + d;
  }

  // Parse the CSV. Rows: date,event,importance,no_school
  function parseCSV(textValue) {
    var rows = [];
    var lines = textValue.split(/\r?\n/);
    for (var i =  0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line === "") continue;
      if (/^date,event/i.test(line)) continue;
      var cols = line.split(",");
      if (cols.length < 4) continue;
      rows.push({
        date: parseDate(cols[0].trim()),
        name: cols[1].trim(),
        important: (cols[2].trim().toUpperCase() === "TRUE"),
        noSchool: (cols[3].trim().toUpperCase() === "TRUE")
      });
    }
    rows.sort(function (aDate, bDate) { return aDate.date.getTime() - bDate.date.getTime(); });
    return rows;
  }
  // Escape CSV-sourced text before dropping it into HTML.
  function esc(value) {
    var s = String(value);
    s = s.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/"/g, "&quot;");
    s = s.replace(/'/g, "&#39;");
    return s;
  }

  // A pill that says whether kids go to school or stay home.
  function badge(eventValue) {
    if (eventValue.noSchool) return '<span class="badge no-school">🎉 No School</span>';
    return '<span class="badge school-day">🏫 School Day</span>';
  }

  function importantStar(eventValue) {
    if (eventValue.important) return '<span class="star">⭐</span>';
    return "";
  }

  // A DST-safe numeric key (YYYYMMDD) so we always compare calendar dates.
  function dKey(d) {
    return (d.getFullYear() * 10000) + ((d.getMonth() + 1) * 100) + d.getDate();
  }

  // School days = weekdays not marked "no school", first to last day.
  function schoolProgress(recordsValue, nowValue) {
    var firstDate = recordsValue[0].date;
    var lastDate = recordsValue[recordsValue.length - 1].date;
    var noSet = {};
    recordsValue.forEach(function (r) { if (r.noSchool) noSet[dKey(r.date)] = true; });
    var total =  0;
    var elapsed =  0;
    var cursor = new Date(firstDate.getTime());
    var lastKey = dKey(lastDate);
    var nowKey = dKey(nowValue);
    while (dKey(cursor) <= lastKey) {
      var weekday = cursor.getDay();
      var skip = (weekday === 6 || weekday === 0);
      if (noSet[dKey(cursor)]) skip = true;
      if (!skip) {
        total = total + 1;
        if (dKey(cursor) < nowKey) elapsed = elapsed + 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (elapsed > total) elapsed = total;
    var percent =  0;
    if (total > 0) percent = Math.round((elapsed / total) * 100);
    return { firstDate: firstDate, lastDate: lastDate, total: total, elapsed: elapsed, percent: percent };
  }


  function nextCard(nextRec, todayValue) {
    if (!nextRec) {
      return '<section class="card next-card">' +
        '<p class="next-eyebrow">Next up</p>' +
        '<div class="next-icon">🎉</div>' +
        '<h2 class="next-name">School year is all done!</h2>' +
        '<p class="next-sub">Everyone did amazing. Have a wonderful break! 💛</p>' +
        '</section>';
    }
    var days = daysFromToday(nextRec.date, todayValue);
    var sub = (days === 0) ? "is TODAY!" : ((days === 1) ? "1 day to go" : "days to go");
    return '<section class="card next-card">' +
      '<p class="next-eyebrow">Next up</p>' +
      '<div class="next-icon">' + iconFor(nextRec.name) + '</div>' +
      '<h2 class="next-name">' + esc(nextRec.name) + importantStar(nextRec) + '</h2>' +
      '<div class="next-days">' + days + '</div>' +
      '<p class="next-sub">' + sub + '</p>' +
      '<p class="next-date">' + prettyDate(nextRec.date) + '</p>' +
      badge(nextRec) +
      '</section>';
  }

  function markersMarkup(recordsValue, progressValue, todayValue) {
    var spanMs = progressValue.lastDate.getTime() - progressValue.firstDate.getTime();
    var dots = "";
    recordsValue.forEach(function (rec) {
      var pos = (spanMs === 0) ? 0 : ((rec.date.getTime() - progressValue.firstDate.getTime()) / spanMs) * 100;
      if (pos < 0) pos =  0;
      if (pos > 100) pos = 100;
      var cls = "dot";
      if (rec.date <= todayValue) cls = cls + " past";
      dots = dots + '<span class="' + cls + '" style="left:' + pos.toFixed(2) + '%"></span>';
    });
    return '<div class="markers">' + dots + '</div>';
  }


  function numCard(recordsValue, progressValue, todayValue) {
    return '<section class="card num-card">' +
      '<div class="num-head">' +
        '<h2 class="card-title">Our School Year</h2>' +
        '<div class="percent-box">' + progressValue.percent + '%<span>done</span></div>' +
      '</div>' +
      '<div class="numbers">' +
        '<span class="bookend">' + shortDate(progressValue.firstDate) + '</span>' +
        '<div class="line-shell">' +
          '<div class="line"><div class="fill" style="width:' + progressValue.percent + '%"></div></div>' +
          markersMarkup(recordsValue, progressValue, todayValue) +
        '</div>' +
        '<span class="bookend">' + shortDate(progressValue.lastDate) + '</span>' +
      '</div>' +
      '<p class="num-sub">' + progressValue.elapsed + ' of ' + progressValue.total + ' school days done</p>' +
      '</section>';
  }

  function importantGrid(upcomingValue, todayValue) {
    var cards = "";
    upcomingValue.forEach(function (rec) {
      if (!rec.important) return;
      cards = cards +
        '<div class="imp-card">' +
        '<div class="imp-icon">' + iconFor(rec.name) + '</div>' +
        '<div class="imp-name">' + esc(rec.name) + '</div>' +
        '<div class="imp-days">' + daysFromToday(rec.date, todayValue) + '</div>' +
        '<div class="imp-sub">days</div>' +
        badge(rec) +
        '</div>';
    });
    if (cards === "") return "";
    return '<section class="card">' +
      '<h2 class="card-title">Big Important Days</h2>' +
      '<div class="important-grid">' + cards + '</div>' +
      '</section>';
  }


  function eventList(upcomingValue, todayValue) {
    var rows = "";
    upcomingValue.forEach(function (rec) {
      var days = daysFromToday(rec.date, todayValue);
      var daysHtml = (days === 0) ? "Today" : '<strong>' + days + '</strong> days';
      rows = rows +
        '<li class="event-row">' +
        '<div class="row-icon">' + iconFor(rec.name) + '</div>' +
        '<div class="row-mid">' +
        '<div class="row-name">' + esc(rec.name) + importantStar(rec) + '</div>' +
        '<div class="row-date">' + prettyDate(rec.date) + '</div>' +
        '</div>' +
        badge(rec) +
        '<div class="row-days">' + daysHtml + '</div>' +
        '</li>';
    });
    return '<section class="card">' +
      '<h2 class="card-title">All Upcoming Days</h2>' +
      '<ul class="event-list">' + rows + '</ul>' +
      '</section>';
  }

  function render(recordsValue) {
    var t = today();
    var visible = recordsValue.filter(function (r) { return (r.name || "").trim() !== ""; });
    var upcomingValue = visible.filter(function (r) { return r.date.getTime() >= t.getTime(); });
    var nextRec = (upcomingValue.length > 0) ? upcomingValue[0] : null;
    var progressValue = schoolProgress(recordsValue, t);
    var html = nextCard(nextRec, t);
    html = html + numCard(recordsValue, progressValue, t);
    html = html + importantGrid(upcomingValue, t);
    if (upcomingValue.length > 0) html = html + eventList(upcomingValue, t);
    app.innerHTML = html;
  }

  function fail() {
    app.innerHTML = '<p class="msg">😕 Could not load <code>data.csv</code>. Please try again later.</p>';
  }

  fetch("data.csv")
    .then(function (res) { if (!res.ok) throw new Error("bad response"); return res.text(); })
    .then(function (textValue) {
      var recordsValue = parseCSV(textValue);
      if (recordsValue.length === 0) { fail(); return; }
      render(recordsValue);
    })
    .catch(function () { fail(); });
})();
