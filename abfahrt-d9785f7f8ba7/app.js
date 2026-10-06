/* Abfahrt – Bedienung: Einstellungen, Abrufe, Countdown, Darstellung. Die Logik steckt in logik.js. */
(function () {
  "use strict";
  var A = window.Abfahrt;
  // in fremde Seiten eingebettet? Dann nur ein Link – keine Bedienung in einem fremden Rahmen
  if (window.top !== window.self) {
    document.body.textContent = "";
    var out = document.createElement("a");
    out.href = location.href; out.target = "_top"; out.rel = "noopener"; out.textContent = "Abfahrt öffnen";
    document.body.appendChild(out);
    return;
  }
  // Seite und Skript passen nicht zusammen (alte Seite aus dem Zwischenspeicher, neues Skript – GitHub
  // Pages hält Dateien 10 Min.): einmal frisch laden; der Zusatz im Link umgeht den Zwischenspeicher.
  var NEEDED = ["title", "sub", "notices", "heads", "rows", "empty", "stand", "edit", "settings", "setForm", "q", "opts", "dir", "msg", "wx", "cancel"];
  var healed = null;
  try { healed = sessionStorage.getItem("abfahrt-frisch"); } catch (e) { healed = "x"; }
  if (NEEDED.some(function (id) { return !document.getElementById(id); })) {
    if (!healed) {
      try { sessionStorage.setItem("abfahrt-frisch", "1"); } catch (e) { /* dann eben ohne */ }
      var fresh = new URL(location.href);
      fresh.searchParams.set("frisch", String(Date.now()));
      location.replace(fresh.toString());
    } else {
      var hint = document.getElementById("stand") || document.body;
      hint.textContent = "Es gibt eine neue Version. Bitte die Seite neu laden bzw. die App schließen und neu öffnen.";
    }
    return;
  }
  try { sessionStorage.removeItem("abfahrt-frisch"); } catch (e) { /* egal */ }
  if (/[?&]frisch=/.test(location.search)) {   // Zusatz wieder aus dem Link nehmen
    var clean = new URL(location.href);
    clean.searchParams.delete("frisch");
    history.replaceState(null, "", clean.pathname + clean.search);
  }
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

  // ---------- Einstellungen ----------
  // Der Link (?h=Haltestelle) bringt die Haltestelle mit – so steckt sie im Home-Symbol. Ändert man sie in
  // der App, merkt sich das Gerät die neue Wahl zu genau diesem Startlink: iOS öffnet das Symbol immer
  // mit dem ursprünglichen Link, die Änderung soll trotzdem bleiben. w=0: ohne Wetter, r=0: eine Liste.
  var LIMIT = 200;   // Eingaben begrenzen
  function sessionGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* egal */ } }
  var launch = sessionGet("abfahrt-launch");
  if (launch === null) { launch = location.search; sessionSet("abfahrt-launch", launch); }
  function readJSON(key, fallback) {
    var v = null;
    try { v = JSON.parse(store(key) || "null"); } catch (e) { v = null; }
    return v === null || typeof v !== typeof fallback || Array.isArray(v) !== Array.isArray(fallback) ? fallback : v;
  }
  function sane(s) {
    s = s && typeof s === "object" ? s : {};
    return { h: String(s.h || "").trim().slice(0, LIMIT), w: s.w !== false, d: s.d !== false, m: s.m !== false };
  }
  function readSettings() {
    var p = new URLSearchParams(location.search), map = readJSON("abfahrt-links", {});
    if (p.has("h")) { return sane(map[location.search] || { h: p.get("h"), w: p.get("w") !== "0", d: p.get("r") !== "0", m: p.get("m") !== "0" }); }
    return sane(readJSON("abfahrt-settings", {}));
  }
  function writeSettings(s) {
    var p = new URLSearchParams();
    p.set("h", s.h);
    if (!s.w) { p.set("w", "0"); }
    if (!s.d) { p.set("r", "0"); }
    if (!s.m) { p.set("m", "0"); }
    var search = "?" + p.toString(), map = readJSON("abfahrt-links", {});
    map[launch] = s; map[search] = s;
    var keys = Object.keys(map);
    keys.slice(0, Math.max(0, keys.length - 12)).forEach(function (k) { if (k !== launch && k !== search) { delete map[k]; } });
    store("abfahrt-links", JSON.stringify(map));
    store("abfahrt-settings", JSON.stringify(s));
    history.replaceState(null, "", location.pathname + search);
  }

  var settings = readSettings();
  function freshState(keep) {
    return { stations: null, raw: null, horizon: null, fetchedAt: 0, triedAt: 0, failures: 0,
             messages: keep ? keep.messages : null, msgAt: keep ? keep.msgAt : 0, weather: null, wxAt: 0, error: null, loading: false };
  }
  var state = freshState(null);
  // nach Fehlschlägen seltener fragen: 30 s, 1, 2, 4 Min. … höchstens 5 Min. – die MVG nicht bedrängen
  function nextDue() { return state.triedAt + Math.min(REFRESH * Math.pow(2, state.failures), 5 * 60000); }

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
    state.triedAt = started;
    (state.stations ? Promise.resolve(state.stations) : resolveAll(settings.h)).then(function (sts) {
      if (!sts) { state.error = "Haltestelle „" + settings.h + "“ nicht gefunden – bitte unter „Ändern“ prüfen."; state.failures++; return null; }
      state.stations = sts;
      var jobs = sts.map(function (s) { return A.fetchDepartures(s.globalId).catch(function () { return null; }); });
      var side = [];
      if (settings.m && (!state.messages || started - state.msgAt > SLOW)) {   // Meldungen nur, wenn gewünscht (~370 KB)
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
          state.raw = m.deps; state.horizon = m.horizonMs; state.fetchedAt = Date.now(); state.error = null; state.failures = 0;
        }
        if (state.error) { state.failures++; }
      });
    }).catch(function () {
      state.error = state.raw ? "Keine Verbindung – angezeigt wird der Stand von " + hhmm(state.fetchedAt) + " Uhr." : "Keine Verbindung.";
      state.failures++;
    }).then(function () {
      state.loading = false;
      render();
    });
  }

  // ---------- Lage der Ziele (stadteinwärts / stadtauswärts), auf dem Gerät zwischengespeichert ----------
  var coords = readJSON("abfahrt-ziele", {}), pending = {}, failed = {}, redraw = null;
  function coordsOf(name) {
    if (!name) { return null; }
    var v = coords[name];
    if (Array.isArray(v) && typeof v[0] === "number" && typeof v[1] === "number") { return v; }
    if (v === 0) { return null; }                                   // gesucht, nicht gefunden
    if (!pending[name] && !(failed[name] > Date.now() - 10 * 60000) && Object.keys(pending).length < 4) {
      pending[name] = true;
      A.locate(name).then(function (p) {
        coords[name] = p || 0;
        var keys = Object.keys(coords);
        if (keys.length > 400) { keys.slice(0, keys.length - 400).forEach(function (k) { delete coords[k]; }); }
        store("abfahrt-ziele", JSON.stringify(coords));
      }, function () { failed[name] = Date.now(); }).then(function () {
        delete pending[name];
        clearTimeout(redraw);
        redraw = setTimeout(render, 80);                            // sobald die Lage da ist, richtig einsortieren
      });
    }
    return null;
  }

  // ---------- Darstellung ----------
  var firstTrip = false;   // nachts: die angezeigten Fahrten sind die ersten des Morgens
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
    next.appendChild(el("span", "count" + (soon ? " count--soon" : ""), c.cancelled ? "fällt aus" : (firstTrip ? "erste Fahrt · " : "") + countdown(c.t, now)));
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
    try { draw(); } catch (e) {   // ein Fehler bei Meldungen o. Ä. darf nicht die ganze Seite leeren
      if (window.console) { console.error(e); }
      var n = $("notices");
      n.textContent = "";
      n.appendChild(el("div", "notice offline", "Die Anzeige konnte nicht aufgebaut werden. Bitte die Seite neu laden."));
    }
  }
  function draw() {
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
    var night = false;
    if (!cards.length) {   // nachts: die ersten Fahrten des Morgens (wie im TRMNL-Plugin: „erste Fahrt“)
      cards = A.buildCards(state.raw, now, hhmm, { horizonMs: state.horizon, laterN: 4 });
      night = cards.length > 0 && cards.every(function (c) { return c.t - now >= 60 * 60000; });
      dormant = [];
    }
    firstTrip = night;
    dormant.forEach(function (d) { d.tomorrow = serviceDay(d.t) !== serviceDay(now); });
    var alerts = settings.m && state.messages ? A.buildAlerts(state.messages, new Set(cards.map(function (c) { return c.line; })), now, hhmm) : [];
    A.attachHints(cards, alerts).slice(0, 3).forEach(function (a) {
      var n = el("div", "notice");
      n.appendChild(el("b", null, a.lines + ": "));
      n.appendChild(document.createTextNode((a.from ? "Ab " + hhmm(a.from) + " Uhr: " : "") + a.title));
      notices.appendChild(n);
    });

    // Zeilen je Linie: links stadteinwärts, rechts stadtauswärts (automatisch, siehe logik.js). Ruhende
    // Richtungen nur, wenn die Linie heute nicht mehr fährt oder ihre andere Richtung gerade eine Karte hat.
    var active = new Set(cards.map(function (c) { return c.line; }));
    var shown = cards.concat(dormant.filter(function (d) { return d.tomorrow || active.has(d.line); }));
    var st = state.stations && state.stations[0];
    var sides = settings.d && st && typeof st.latitude === "number" ? A.directionSides(shown, [st.latitude, st.longitude], coordsOf) : null;
    var split = !!sides;
    var groups = new Map();
    shown.forEach(function (c) {
      var key = c.sort.join("|") + "|" + c.line;
      if (!groups.has(key)) { groups.set(key, { sort: c.sort.concat([c.line]), L: [], R: [] }); }
      var g = groups.get(key);
      (split && sides.get(c) === "R" ? g.R : g.L).push(c);
    });
    var list = Array.from(groups.values()).sort(function (a, b) {
      for (var i = 0; i < a.sort.length; i++) { if (a.sort[i] !== b.sort[i]) { return a.sort[i] < b.sort[i] ? -1 : 1; } }
      return 0;
    });
    rows.className = "rows" + (split ? "" : " rows--single");
    $("heads").hidden = !split;
    list.forEach(function (g) {
      var n = split ? Math.max(g.L.length, g.R.length) : g.L.length;
      for (var i = 0; i < n; i++) {
        var row = el("div", "row");
        row.appendChild(g.L[i] ? card(g.L[i], now) : el("div", "gap"));
        if (split) { row.appendChild(g.R[i] ? card(g.R[i], now) : el("div", "gap")); }
        rows.appendChild(row);
      }
    });
    if (!list.length) { empty.hidden = false; empty.textContent = state.error ? "Keine aktuellen Daten." : "Derzeit keine Abfahrten."; }
    $("stand").textContent = "Stand " + secF.format(new Date(state.fetchedAt)) + " Uhr · aktualisiert sich alle 30 Sekunden, solange die Seite offen ist.";
  }

  // ---------- Haltestelle wählen ----------
  var dlg = $("settings"), q = $("q"), opts = $("opts"), searchTimer = null, searchSeq = 0;
  var MODES = { UBAHN: ["U", "U-Bahn"], SBAHN: ["S", "S-Bahn"], TRAM: ["T", "Tram"], BUS: ["B", "Bus"], REGIONAL_BUS: ["B", "Bus"] };
  function recent() { return readJSON("abfahrt-zuletzt", []).filter(function (s) { return s && s.globalId && s.name; }); }
  function slim(s) { return { globalId: String(s.globalId), name: String(s.name), place: s.place ? String(s.place) : "", latitude: s.latitude, longitude: s.longitude,
                              transportTypes: Array.isArray(s.transportTypes) ? s.transportTypes.map(String).slice(0, 6) : [] }; }
  function option(s, extra) {
    var b = el("button", "opt"), seen = {};
    b.type = "button"; b.setAttribute("role", "option");
    b.appendChild(el("span", "opt-name", s.name));
    var sub = [];
    if (s.place && s.place !== "München") { sub.push(s.place); }
    if (extra) { sub.push(extra); }
    if (sub.length) { b.appendChild(el("span", "opt-sub", sub.join(" · "))); }
    var modes = el("span", "opt-modes");
    (s.transportTypes || []).forEach(function (t) {
      var m = MODES[t];
      if (m && !seen[m[0]]) { seen[m[0]] = 1; var x = el("span", "mode mode--" + m[0], m[0] === "T" ? "Tram" : m[0] === "B" ? "Bus" : m[0]); x.title = m[1]; modes.appendChild(x); }
    });
    b.appendChild(modes);
    b.addEventListener("click", function () { pickStation(s); });
    return b;
  }
  function message(text) { opts.textContent = ""; opts.appendChild(el("div", "opt-msg", text)); }
  function showStart() {   // ohne Eingabe: „In der Nähe“ und zuletzt gewählte Haltestellen
    opts.textContent = "";
    if (navigator.geolocation) {
      var near = el("button", "opt opt--near", "📍 Haltestellen in meiner Nähe");
      near.type = "button";
      near.addEventListener("click", findNearby);
      opts.appendChild(near);
    }
    var r = recent();
    if (r.length) {
      opts.appendChild(el("div", "opt-head", "Zuletzt gewählt"));
      r.forEach(function (s) { opts.appendChild(option(s)); });
    }
  }
  function findNearby() {
    message("Standort wird bestimmt …");
    navigator.geolocation.getCurrentPosition(function (pos) {
      message("Haltestellen in der Nähe werden gesucht …");
      A.fetchNearby(pos.coords.latitude, pos.coords.longitude).then(function (list) {
        if (!list.length) { message("Keine Haltestelle in der Nähe gefunden."); return; }
        opts.textContent = "";
        opts.appendChild(el("div", "opt-head", "In der Nähe"));
        list.forEach(function (s) {
          var d = typeof s.distanceInMeters === "number" ? (s.distanceInMeters < 1000 ? Math.round(s.distanceInMeters / 10) * 10 + " m" : (s.distanceInMeters / 1000).toFixed(1).replace(".", ",") + " km") : "";
          opts.appendChild(option(s, d));
        });
      }, function () { message("Die MVG ist gerade nicht erreichbar."); });
    }, function (err) {
      message(err && err.code === 1 ? "Standort nicht freigegeben – bitte den Namen der Haltestelle eintippen." : "Standort nicht verfügbar – bitte den Namen eintippen.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 });
  }
  function search() {
    var text = q.value.trim(), seq = ++searchSeq;
    clearTimeout(searchTimer);
    if (!text) { showStart(); return; }
    if (text.indexOf(";") >= 0) { message("Mehrere Haltestellen: mit der Eingabetaste übernehmen."); return; }
    if (text.length < 2) { return; }
    searchTimer = setTimeout(function () {
      A.searchStations(text).then(function (list) {
        if (seq !== searchSeq) { return; }
        if (!list.length) { message("Nichts gefunden – andere Schreibweise oder eine Adresse versuchen."); return; }
        opts.textContent = "";
        list.forEach(function (s) { opts.appendChild(option(s)); });
      }, function () { if (seq === searchSeq) { message("Die MVG ist gerade nicht erreichbar."); } });
    }, 200);
  }
  function apply(h, station) {
    h = String(h || "").trim().slice(0, LIMIT);
    if (!h) { return; }
    if (station) { store("abfahrt-st:" + h, JSON.stringify([station])); }   // genau die gewählte Haltestelle
    var changed = h !== settings.h;
    settings = sane({ h: h, w: settings.w, d: settings.d, m: settings.m });
    writeSettings(settings);
    if (changed) { state = freshState(state); }
    closeSettings();
    render();
    load();
  }
  function pickStation(s) {
    s = slim(s);
    var r = recent().filter(function (x) { return x.globalId !== s.globalId; });
    r.unshift(s);
    store("abfahrt-zuletzt", JSON.stringify(r.slice(0, 6)));
    // Name im Link, wenn eindeutig (München), sonst die Global-ID – „Rotkreuzstraße“ gibt es mehrfach
    apply(!s.place || s.place === "München" ? s.name : s.globalId, s);
  }
  function openSettings() {
    q.value = "";
    $("dir").checked = settings.d; $("wx").checked = settings.w; $("msg").checked = settings.m;
    showStart();
    if (dlg.showModal) { dlg.showModal(); } else { dlg.setAttribute("open", ""); }
    q.focus();
  }
  function closeSettings() { if (dlg.close) { dlg.close(); } else { dlg.removeAttribute("open"); } }
  q.addEventListener("input", search);
  $("setForm").addEventListener("submit", function (e) {   // Eingabetaste: erster Treffer bzw. mehrere mit „;“
    e.preventDefault();
    var text = q.value.trim();
    if (text.indexOf(";") >= 0) { apply(text, null); return; }
    var first = opts.querySelector(".opt:not(.opt--near)");
    if (first) { first.click(); } else if (text) { apply(text, null); }
  });
  function toggle() {
    settings = sane({ h: settings.h, w: $("wx").checked, d: $("dir").checked, m: $("msg").checked });
    if (settings.h) { writeSettings(settings); }
    if (!settings.w) { state.weather = null; state.wxAt = 0; }
    if (!settings.m) { state.messages = null; state.msgAt = 0; }
    render();
    if (settings.w || settings.m) { load(); }
  }
  $("dir").addEventListener("change", toggle);
  $("wx").addEventListener("change", toggle);
  $("msg").addEventListener("change", toggle);
  $("cancel").addEventListener("click", closeSettings);
  $("edit").addEventListener("click", openSettings);
  $("title").addEventListener("click", openSettings);

  // ---------- Takt ----------
  setInterval(function () {
    if (document.visibilityState !== "visible") { return; }
    render();
    if (Date.now() >= nextDue()) { load(); }
  }, TICK);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") { render(); load(); } });
  window.addEventListener("pageshow", function (e) { if (e.persisted) { load(); } });

  render();
  if (settings.h) { load(); } else { openSettings(); }
})();
