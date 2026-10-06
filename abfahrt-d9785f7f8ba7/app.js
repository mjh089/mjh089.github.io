/* Abfahrt – Bedienung: Einstellungen, Abrufe, Countdown, Darstellung. Die Logik steckt in logik.js. */
(function () {
  "use strict";
  var A = window.Abfahrt;
  var MAX_WAIT = 60 * 60000;   // Linien, die erst später fahren, ruhen („Heute keine Fahrt mehr“)
  var REFRESH = 30000;         // Abfahrten alle 30 s neu holen, solange die Seite sichtbar ist
  var SLOW = 10 * 60000;       // Meldungen (~370 KB) und Wetter nur alle 10 Min.
  var TICK = 10000;            // Countdown alle 10 s neu rechnen – ohne Abruf

  var timeF = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  var secF = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  var dayF = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });
  function hhmm(ms) { return timeF.format(new Date(ms)); }
  function serviceDay(ms) { return dayF.format(new Date(ms - 4 * 3600000)); }   // Betriebstag wechselt um 4 Uhr
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text !== undefined && text !== null) { e.textContent = text; }
    return e;
  }
  function store(key, value) {
    try {
      if (value === undefined) { return localStorage.getItem(key); }
      if (value === null) { localStorage.removeItem(key); } else { localStorage.setItem(key, value); }
    } catch (e) { /* privates Fenster o. Ä.: dann eben ohne Speicher */ }
    return null;
  }

  // ---------- Einstellungen: der Link (?h=…&l=…) hat Vorrang – so steckt die Haltestelle im Home-Symbol ----------
  function readSettings() {
    var p = new URLSearchParams(location.search), s = {};
    try { s = JSON.parse(store("abfahrt-settings") || "{}") || {}; } catch (e) { s = {}; }
    if (p.has("h")) { s = { h: p.get("h"), l: p.get("l") || "", w: p.get("w") !== "0" }; }
    return { h: (s.h || "").trim(), l: (s.l || "").trim(), w: s.w !== false };
  }
  function writeSettings(s) {
    store("abfahrt-settings", JSON.stringify(s));
    var p = new URLSearchParams();
    p.set("h", s.h);
    if (s.l) { p.set("l", s.l); }
    if (!s.w) { p.set("w", "0"); }
    history.replaceState(null, "", location.pathname + "?" + p.toString());
  }

  var settings = readSettings();
  var state = { stations: null, raw: null, horizon: null, fetchedAt: 0, messages: null, msgAt: 0, weather: null, wxAt: 0, error: null, loading: false };

  // ---------- Abrufe ----------
  function resolveAll(query) {
    var cacheKey = "abfahrt-st:" + query, cached = null;
    try { cached = JSON.parse(store(cacheKey) || "null"); } catch (e) { cached = null; }
    if (cached && cached.length) { return Promise.resolve(cached); }
    var parts = query.split(";").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3);
    return Promise.all(parts.map(A.resolveStation)).then(function (list) {
      if (!list.length || list.some(function (s) { return !s; })) { return null; }
      var slim = list.map(function (s) { return { globalId: s.globalId, name: s.name, latitude: s.latitude, longitude: s.longitude }; });
      store(cacheKey, JSON.stringify(slim));
      return slim;
    });
  }
  function load() {
    if (!settings.h || state.loading) { return; }
    state.loading = true;
    var started = Date.now();
    (state.stations ? Promise.resolve(state.stations) : resolveAll(settings.h)).then(function (sts) {
      if (!sts) { state.error = "Haltestelle „" + settings.h + "“ nicht gefunden – bitte unter „Ändern“ prüfen."; return null; }
      state.stations = sts;
      var jobs = sts.map(function (s) { return A.fetchDepartures(s.globalId).catch(function () { return null; }); });
      var side = [];
      if (!state.messages || started - state.msgAt > SLOW) {
        side.push(A.fetchMessages().then(function (m) { if (Array.isArray(m)) { state.messages = m; state.msgAt = Date.now(); } }, function () {}));
      }
      if (settings.w && sts[0].latitude && (!state.weather || started - state.wxAt > SLOW)) {
        side.push(A.fetchWeather(sts[0].latitude, sts[0].longitude).then(function (w) {
          var b = A.buildWeather(w);
          if (b) { state.weather = b; state.wxAt = Date.now(); }
        }, function () {}));
      }
      Promise.all(side).then(render);   // Meldungen und Wetter kommen nach, ohne die Abfahrten aufzuhalten
      return Promise.all(jobs).then(function (deps) {
        if (deps.some(function (d) { return d && d._http_error; })) {
          state.error = "Haltestelle ungültig – bitte unter „Ändern“ prüfen.";
        } else if (deps.every(function (d) { return !Array.isArray(d); })) {
          state.error = state.raw ? "Keine Verbindung zur MVG – angezeigt wird der Stand von " + hhmm(state.fetchedAt) + " Uhr." : "Die MVG ist gerade nicht erreichbar.";
        } else {
          var m = A.mergeDepartures(deps);
          state.raw = m.deps; state.horizon = m.horizonMs; state.fetchedAt = Date.now(); state.error = null;
        }
      });
    }).catch(function () {
      state.error = state.raw ? "Keine Verbindung – angezeigt wird der Stand von " + hhmm(state.fetchedAt) + " Uhr." : "Keine Verbindung.";
    }).then(function () {
      state.loading = false;
      render();
    });
  }

  // ---------- Darstellung ----------
  function countdown(t, now) {
    var m = Math.floor((t - now) / 60000);
    if (m < 1) { return "jetzt"; }
    if (m < 60) { return "in " + m + " Min."; }
    var h = Math.floor(m / 60), r = m % 60;
    return "in " + h + " Std." + (r ? " " + r + " Min." : "");
  }
  function badge(c) { return el("span", "badge badge--" + String(c.type || "").replace(/[^A-Z_]/g, ""), c.badge || c.line); }
  function card(c, now) {
    var box = el("article", "card" + (c.dormant ? " card--rest" : "")), head = el("div", "head");
    head.appendChild(badge(c));
    head.appendChild(el("div", "dest", c.destination));
    box.appendChild(head);
    if (c.dormant) {
      var rest = el("div", "rest", c.tomorrow ? "Heute keine Fahrt mehr" : "Nächste Fahrt");
      rest.appendChild(el("b", null, (c.tomorrow ? "morgen " : "erst ") + hhmm(c.t)));
      box.appendChild(rest);
      return box;
    }
    var next = el("div", "next");
    next.appendChild(el("span", "time" + (c.cancelled ? " x" : ""), hhmm(c.t)));
    if (c.delay > 0 && !c.cancelled) { next.appendChild(el("span", "delay", "+" + c.delay)); }
    var soon = !c.cancelled && c.t - now < 3 * 60000;
    next.appendChild(el("span", "count" + (soon ? " count--soon" : ""), c.cancelled ? "fällt aus" : countdown(c.t, now)));
    box.appendChild(next);
    if (c.live || c.platform) {
      var meta = el("div", "meta");
      if (c.live) { meta.appendChild(el("span", "live", "Echtzeit")); }
      if (c.platform) { meta.appendChild(el("span", null, "Gleis " + c.platform)); }
      box.appendChild(meta);
    }
    if (c.later.length) {
      var later = el("div", "later");
      later.appendChild(el("small", null, "danach"));
      c.later.forEach(function (l) { later.appendChild(el("span", l.cancelled ? "x" : null, hhmm(l.t))); });
      box.appendChild(later);
    } else if (c.last) {
      box.appendChild(el("div", "later", "letzte Fahrt"));
    }
    if (c.hint) { box.appendChild(el("div", "hint", c.hint)); }
    return box;
  }
  function stationName() {
    if (!state.stations) { return settings.h || "Abfahrt"; }
    var name = state.stations[0].name || settings.h;
    return state.stations.length > 1 ? name.replace(/\s*\([^)]*\)\s*$/, "") : name;   // „Hauptbahnhof (U, Tram)“ -> „Hauptbahnhof“
  }
  function render() {
    var now = Date.now(), rows = $("rows"), notices = $("notices"), empty = $("empty");
    $("title").textContent = settings.h ? stationName() : "Abfahrt";
    var w = settings.w ? state.weather : null, sub = $("sub");
    sub.textContent = "";
    if (w) {
      sub.appendChild(el("b", null, w.temp + "°"));
      sub.appendChild(document.createTextNode((w.hi !== null ? " (" + w.lo + "–" + w.hi + "°)" : "") + (w.text ? " " + w.text : "")));
      if (w.rain) { sub.appendChild(document.createTextNode(" · ")); sub.appendChild(el("b", null, w.rain)); }
    } else {
      sub.textContent = "Abfahrten der MVG, live";
    }
    notices.textContent = "";
    rows.textContent = "";
    $("heads").hidden = true;
    empty.hidden = true;
    if (state.error) { notices.appendChild(el("div", "notice offline", state.error)); }
    if (!settings.h) {
      empty.hidden = false;
      empty.textContent = "Noch keine Haltestelle gewählt – oben auf „Ändern“ tippen.";
      $("stand").textContent = "";
      return;
    }
    if (!state.raw) {
      if (!state.error) { empty.hidden = false; empty.textContent = "Abfahrten werden geladen …"; }
      return;
    }

    var dormant = [];
    var cards = A.buildCards(state.raw, now, hhmm, { maxWaitMs: MAX_WAIT, horizonMs: state.horizon, laterN: 4, dormant: dormant });
    if (!cards.length) {   // nachts: die ersten Fahrten des Morgens
      cards = A.buildCards(state.raw, now, hhmm, { horizonMs: state.horizon, laterN: 4 });
      dormant = [];
    }
    dormant.forEach(function (d) { d.tomorrow = serviceDay(d.t) !== serviceDay(now); });
    var alerts = state.messages ? A.buildAlerts(state.messages, new Set(cards.map(function (c) { return c.line; })), now, hhmm) : [];
    A.attachHints(cards, alerts).slice(0, 3).forEach(function (a) {
      var n = el("div", "notice");
      n.appendChild(el("b", null, a.lines + ": "));
      n.appendChild(document.createTextNode((a.from ? "Ab " + hhmm(a.from) + " Uhr: " : "") + a.title));
      notices.appendChild(n);
    });

    // Zeilen je Linie: links die Ziele aus „Linke Spalte“, rechts die Gegenrichtung. Ruhende Richtungen
    // nur, wenn die Linie heute nicht mehr fährt oder ihre andere Richtung gerade eine Karte hat.
    var terms = A.parseTerms(settings.l), split = terms.length > 0;
    var active = new Set(cards.map(function (c) { return c.line; }));
    var shown = cards.concat(dormant.filter(function (d) { return d.tomorrow || active.has(d.line); }));
    var groups = new Map();
    shown.forEach(function (c) {
      var key = c.sort.join("|") + "|" + c.line;
      if (!groups.has(key)) { groups.set(key, { sort: c.sort.concat([c.line]), L: [], R: [] }); }
      var g = groups.get(key);
      (split && !A.isLeft(c, terms) ? g.R : g.L).push(c);
    });
    var list = Array.from(groups.values()).sort(function (a, b) {
      for (var i = 0; i < a.sort.length; i++) { if (a.sort[i] !== b.sort[i]) { return a.sort[i] < b.sort[i] ? -1 : 1; } }
      return 0;
    });
    rows.className = "rows" + (split ? "" : " rows--single");
    if (split) {
      $("heads").hidden = false;
      $("headL").textContent = settings.l.split(",").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3).join(" · ");
      $("headR").textContent = "Gegenrichtung";
    }
    list.forEach(function (g) {
      var n = split ? Math.max(g.L.length, g.R.length) : g.L.length;
      for (var i = 0; i < n; i++) {
        var row = el("div", "row");
        row.appendChild(g.L[i] ? card(g.L[i], now) : el("div", "gap"));
        if (split) { row.appendChild(g.R[i] ? card(g.R[i], now) : el("div", "gap")); }
        rows.appendChild(row);
      }
    });
    if (!list.length) { empty.hidden = false; empty.textContent = "Derzeit keine Abfahrten."; }
    $("stand").textContent = "Stand " + secF.format(new Date(state.fetchedAt)) + " Uhr · aktualisiert sich alle 30 Sekunden, solange die Seite offen ist.";
  }

  // ---------- Einstellungen-Dialog ----------
  var dlg = $("settings"), q = $("q"), hits = $("hits"), searchTimer = null;
  function openSettings() {
    q.value = settings.h; $("left").value = settings.l; $("wx").checked = settings.w;
    hits.textContent = "";
    if (dlg.showModal) { dlg.showModal(); } else { dlg.setAttribute("open", ""); }
    if (!settings.h) { q.focus(); }
  }
  function closeSettings() { if (dlg.close) { dlg.close(); } else { dlg.removeAttribute("open"); } }
  q.addEventListener("input", function () {
    clearTimeout(searchTimer);
    var text = q.value.trim();
    if (text.length < 2 || text.indexOf(";") >= 0) { hits.textContent = ""; return; }
    searchTimer = setTimeout(function () {
      A.searchStations(text).then(function (list) {
        if (q.value.trim() !== text) { return; }
        hits.textContent = "";
        list.forEach(function (s) {
          var b = el("button", "chip", s.name);
          b.type = "button";
          if (s.place && s.place !== "München") { b.appendChild(el("span", null, " · " + s.place)); }
          b.addEventListener("click", function () {
            if (s.name !== settings.h) { $("left").value = ""; }   // die linke Spalte gehört zur alten Haltestelle
            q.value = s.name; hits.textContent = "";
          });
          hits.appendChild(b);
        });
      }, function () { hits.textContent = ""; });
    }, 250);
  });
  $("setForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var s = { h: q.value.trim(), l: $("left").value.trim(), w: $("wx").checked };
    if (!s.h) { q.focus(); return; }
    var changed = s.h !== settings.h;
    settings = s;
    writeSettings(s);
    if (changed) { state = { stations: null, raw: null, horizon: null, fetchedAt: 0, messages: state.messages, msgAt: state.msgAt, weather: null, wxAt: 0, error: null, loading: false }; }
    if (!s.w) { state.weather = null; state.wxAt = 0; }
    closeSettings();
    render();
    load();
  });
  $("cancel").addEventListener("click", closeSettings);
  $("edit").addEventListener("click", openSettings);

  // ---------- Takt ----------
  setInterval(function () {
    if (document.visibilityState !== "visible") { return; }
    render();
    if (Date.now() - state.fetchedAt > REFRESH) { load(); }
  }, TICK);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") { render(); load(); } });
  window.addEventListener("pageshow", function (e) { if (e.persisted) { load(); } });

  render();
  if (settings.h) { load(); } else { openSettings(); }
})();
