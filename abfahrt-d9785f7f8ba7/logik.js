/* Abfahrten – Logik. Übertragung von trmnl-mvg-abfahrten/src/transform.py (TRMNL-Plugin) nach
   JavaScript: reine Funktionen ohne DOM, damit sich das Ergebnis mit der Python-Fassung vergleichen
   lässt. Zeiten bleiben als Millisekunden erhalten, formatiert wird erst beim Anzeigen (Countdown). */
(function (root) {
  "use strict";

  var API = "https://www.mvg.de/api/bgw-pt/v3";
  var WEATHER_API = "https://api.open-meteo.com/v1/forecast";
  var TYPE_RANK = { UBAHN: 1, SBAHN: 2, TRAM: 3, BUS: 4, REGIONAL_BUS: 5 };
  var ALERT_LOOKAHEAD_H = 12;          // Meldungen, die gelten oder in den nächsten 12 h beginnen
  var RAIN_MM = 0.1;                   // ab so viel Niederschlag pro 15 Min. gilt es als Regen
  var DEP_LIMIT = 80;                  // so viele Abfahrten liefert die MVG je Haltestelle höchstens
  var LAST_MARGIN_MS = 2 * 3600000;    // „letzte Fahrt“ nur, wenn die Liste noch 2 h weiter reicht
  var DEST_EXTRA = { bf: 1, bahnhof: 1, west: 1, ost: 1, nord: 1, "süd": 1, sued: 1 };

  // ---------- kleine Helfer ----------
  function depTime(d) {
    var t = d.realtimeDepartureTime || d.plannedDepartureTime;
    return typeof t === "number" ? t : null;
  }
  function pad4(s) { s = String(s); while (s.length < 4) { s = "0" + s; } return s; }
  function cmp(a, b) {   // Tupel vergleichen wie in Python
    for (var i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] < b[i]) { return -1; }
      if (a[i] > b[i]) { return 1; }
    }
    return a.length - b.length;
  }
  function byTime(x, y) { return x[0] - y[0]; }
  function counter(list) { var m = new Map(); list.forEach(function (k) { m.set(k, (m.get(k) || 0) + 1); }); return m; }
  function mostCommon(list) {   // wie Counter.most_common: nach Anzahl, bei Gleichstand erstes Auftreten
    var m = counter(list), out = [];
    m.forEach(function (n, k) { out.push([k, n]); });
    return out.sort(function (a, b) { return b[1] - a[1]; });
  }
  function asInt(v, dflt) { var n = parseFloat(v); return isFinite(n) ? Math.trunc(n) : dflt; }
  function uniq(list) { var seen = new Set(); return list.filter(function (x) { if (!x || seen.has(x)) { return false; } seen.add(x); return true; }); }

  function direction(d) {   // „swm:20X30:G:H:016“ -> „H“ (Hin) bzw. „R“ (Rück)
    var p = String(d.lineId || "").split(":");
    return p.length > 4 && (p[3] === "H" || p[3] === "R") ? p[3] : "";
  }
  function groupKey(d) {    // Linie + Richtung (+ Steig); ohne Richtung der Steig bzw. das Ziel
    var dr = direction(d);
    return [String(d.label), dr, String(d.stopPointGlobalId || (dr ? "" : (d.destination || "")))];
  }
  function words(x) {
    x = String(x || "").toLowerCase().replace(/\(.*?\)/g, " ");
    return (x.match(/[^\s,\/.\-]+\.?/g) || []).map(function (w) { return [w.replace(/\.$/, ""), /\.$/.test(w)]; });
  }
  // Dasselbe Ziel, nur anders geschrieben? („Unterföhr.Fichtenst.“ / „Unterföhring, Fichtenstraße“)
  function sameDest(a, b) {
    var A = words(a), B = words(b);
    if (A.length > B.length) { var t = A; A = B; B = t; }
    for (var i = 0; i < A.length; i++) {
      var wa = A[i][0], ca = A[i][1], wb = B[i][0], cb = B[i][1];
      if (!(wa === wb || (ca && wb.indexOf(wa) === 0) || (cb && wa.indexOf(wb) === 0))) { return false; }
    }
    if (!A.length) { return false; }
    for (var j = A.length; j < B.length; j++) { if (!DEST_EXTRA[B[j][0]]) { return false; } }
    return true;
  }
  function destKey(dest) { return String(dest).toLowerCase().replace(/bf\./g, "").replace(/[()]/g, "").trim(); }
  function clean(text) {
    text = String(text || "").split(/\s+/).join(" ").replace(/^[ \-–]+|[ \-–]+$/g, "");
    return text.replace(/\(H\) /g, "Haltestelle ");
  }
  function shortLabel(label) {   // „LUFTHANSA EXPRESS BUS“ -> „Lufthansa“
    label = String(label);
    if (label.length <= 5) { return label; }
    var w = label.split(/\s+/)[0];
    if (w === w.toUpperCase() && w.length > 3) { w = w.charAt(0) + w.slice(1).toLowerCase(); }
    return w.length <= 9 ? w : w.slice(0, 8) + "…";
  }
  function arr(x) { return Array.isArray(x) ? x : []; }   // Daten von außen: nur echte Listen durchlassen
  function num(v, dflt) { return typeof v === "number" && isFinite(v) ? v : dflt; }
  function hintTexts(d) {
    var infos = arr(d.infos).filter(function (i) { return i && typeof i === "object" && i.message; });
    infos.sort(function (a, b) { return (a.type !== "INCIDENT") - (b.type !== "INCIDENT"); });   // Störungen zuerst
    var texts = infos.map(function (i) { return clean(i.message); })
      .concat(arr(d.messages).filter(function (m) { return typeof m === "string"; }).map(clean));
    if (d.sev) { texts.unshift("Ersatzverkehr"); }
    return texts;
  }

  // ---------- Karten: eine je Linie + Richtung ----------
  // opts: {maxWaitMs, lines (Set, klein geschrieben), horizonMs, laterN, dormant (Array zum Füllen)}
  function buildCards(deps, nowMs, fmt, opts) {
    opts = opts || {};
    var laterN = opts.laterN || 3, groups = new Map();
    deps.forEach(function (d) {
      if (!d || typeof d !== "object") { return; }
      if (opts.lines && opts.lines.size && !opts.lines.has(String(d.label || "").toLowerCase())) { return; }
      var t = depTime(d);
      if (t === null || t < nowMs || !d.label) { return; }
      var gk = groupKey(d), key = [TYPE_RANK[d.transportType] || 9, pad4(gk[0]), gk[1], gk[2]], ks = JSON.stringify(key);
      if (!groups.has(ks)) { groups.set(ks, { key: key, trips: [] }); }
      groups.get(ks).trips.push([t, d]);
    });
    // Steige derselben Linie + Richtung mit gleichen Zielen zusammenlegen (S1 nachts von anderem Gleis)
    var gs = Array.from(groups.values()).sort(function (a, b) { return cmp(a.key, b.key); });
    var parent = new Map(gs.map(function (g) { return [g, g]; }));
    function rootOf(g) { while (parent.get(g) !== g) { g = parent.get(g); } return g; }
    var dests = new Map(gs.map(function (g) { return [g, new Set(g.trips.map(function (x) { return x[1].destination; }))]; }));
    for (var i = 0; i < gs.length; i++) {
      for (var j = i + 1; j < gs.length; j++) {
        var a = gs[i], b = gs[j];
        if (a.key[0] === b.key[0] && a.key[1] === b.key[1] && (!a.key[2] || !b.key[2] || a.key[2] === b.key[2])) {
          var overlap = false;
          dests.get(a).forEach(function (x) { if (dests.get(b).has(x)) { overlap = true; } });
          if (overlap) { parent.set(rootOf(b), rootOf(a)); }
        }
      }
    }
    var merged = new Map();
    gs.forEach(function (g) { var r = rootOf(g); if (!merged.has(r)) { merged.set(r, []); } merged.get(r).push.apply(merged.get(r), g.trips); });
    var roots = Array.from(merged.keys()).sort(function (a, b) { return cmp(a.key, b.key); });

    // Gabelung (S2 nach Petershausen bzw. Altomünster): Ziele mit ≥ 40 % der Fahrten eigene Karte
    var split = [];
    roots.forEach(function (r) {
      var trips = merged.get(r).slice().sort(byTime), clusters = [];
      mostCommon(trips.map(function (x) { return x[1].destination || ""; })).forEach(function (e) {
        if (!clusters.some(function (c) { return sameDest(e[0], c[0]); })) { clusters.push([e[0], []]); }
      });
      trips.forEach(function (x) {
        var dst = x[1].destination || "";
        clusters.find(function (c) { return c[0] === dst || sameDest(dst, c[0]); })[1].push(x);
      });
      var big = clusters.filter(function (c) { return c[1].length >= 2 && c[1].length * 5 >= trips.length * 2; });
      if (big.length < 2) { split.push(trips); return; }
      clusters.forEach(function (c) { if (big.indexOf(c) < 0) { big[0][1].push.apply(big[0][1], c[1]); } });
      big.forEach(function (c) { split.push(c[1].slice().sort(byTime)); });
    });

    var cards = [];
    split.forEach(function (trips) {
      var first = trips[0][1];
      var sort = [TYPE_RANK[first.transportType] || 9, pad4(first.label)];
      var mainDest = mostCommon(trips.map(function (x) { return x[1].destination || ""; }))[0][0];
      var dc = counter(trips.map(function (x) { return (x[1].destination || "").toLowerCase(); }));
      // fährt erst nach der Wartezeit wieder: ruhende Richtung (z. B. 149 nach Betriebsschluss)
      if (opts.maxWaitMs != null && trips[0][0] > nowMs + opts.maxWaitMs) {
        var nx = trips.find(function (x) { return !x[1].cancelled; });
        if (opts.dormant && nx) {
          opts.dormant.push({ line: String(first.label), badge: shortLabel(first.label), type: first.transportType || "BUS",
                              destination: mainDest, t: nx[0], dormant: true, dests: dc, sort: sort });
        }
        return;
      }
      // groß: die nächste Fahrt, die nicht ausfällt; fallen alle aus, bleibt die Karte durchgestrichen
      var iNxt = trips.findIndex(function (x) { return !x[1].cancelled; });
      var allCancelled = iNxt < 0, nxt = allCancelled ? trips[0] : trips[iNxt], gone = allCancelled ? [] : trips.slice(0, iNxt);
      var t = nxt[0], d = nxt[1];
      var later = trips.filter(function (x) { return x[0] > t; }).slice(0, laterN);
      var texts = hintTexts(d);
      if (mainDest && d.destination && !sameDest(d.destination, mainDest) &&
          !texts.some(function (x) { return x.toLowerCase().indexOf("nur bis") >= 0; })) {
        texts.unshift("fährt nur bis " + d.destination);
      }
      if (gone.length) { texts.unshift(gone.length === 1 ? fmt(gone[0][0]) + " fällt aus" : "Ausfälle bis " + fmt(gone[gone.length - 1][0])); }
      cards.push({
        line: String(d.label), badge: shortLabel(d.label), type: d.transportType || "BUS",
        destination: mainDest || d.destination || "", t: t, live: !!d.realtime, cancelled: allCancelled,
        platform: d.platform, delay: asInt(d.delayInMinutes, 0),
        later: later.map(function (x) { return { t: x[0], cancelled: !!x[1].cancelled }; }),
        last: !later.length && opts.horizonMs != null && opts.horizonMs - t >= LAST_MARGIN_MS,
        hint: uniq(texts).join(" · ") || null, dests: dc, sort: sort
      });
    });
    return cards;
  }

  // ---------- Richtungsspalten ----------
  // links, wenn das Hauptziel passt oder die Mehrheit der Fahrten dorthin geht (Kurzläufer zählen nicht)
  function isLeft(c, terms) {
    var hits = 0, total = 0;
    (c.dests || new Map()).forEach(function (n, d) { total += n; if (terms.some(function (t) { return d.indexOf(t) >= 0; })) { hits += n; } });
    return terms.some(function (t) { return c.destination.toLowerCase().indexOf(t) >= 0; }) || hits * 2 > total;
  }
  function parseTerms(s) { return String(s || "").split(",").map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean); }

  // ---------- stadteinwärts / stadtauswärts – automatisch ----------
  // Liegt das Ziel von der Haltestelle aus in Richtung Marienplatz (Winkel unter 90°), ist es
  // stadteinwärts. Je Linie stehen die beiden Richtungen dann links und rechts – auch bei Linien,
  // die die Stadt umfahren (X30): die Richtung mit dem kleineren Winkel kommt nach links.
  var CENTER = [48.13725, 11.57542];   // Marienplatz
  function flat(p, ref) { return [(p[1] - ref[1]) * Math.cos(ref[0] * Math.PI / 180), p[0] - ref[0]]; }
  function distKm(a, b) { var v = flat(b, a); return Math.sqrt(v[0] * v[0] + v[1] * v[1]) * 111.2; }
  function angleToCenter(stop, dest) {
    var a = flat(dest, stop), b = flat(CENTER, stop), la = Math.hypot(a[0], a[1]), lb = Math.hypot(b[0], b[1]);
    if (!la || !lb) { return null; }
    return Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (la * lb)))) * 180 / Math.PI;
  }
  // cards: Karten (auch ruhende), stop: [lat, lon], coordsOf(ziel) -> [lat, lon] | null
  // Ergebnis: Map Karte -> "L" | "R"; null, wenn die Haltestelle selbst in der Innenstadt liegt
  function directionSides(cards, stop, coordsOf) {
    if (!stop || distKm(stop, CENTER) < 1.5) { return null; }   // Innenstadt: eine Liste
    var sides = new Map(), groups = new Map();
    cards.forEach(function (c) {
      var p = coordsOf(c.destination), ang = p ? angleToCenter(stop, p) : null;
      c._angle = ang;
      if (!groups.has(c.line)) { groups.set(c.line, []); }
      groups.get(c.line).push(c);
    });
    if (cards.every(function (c) { return c._angle === null; })) {   // Lage noch unbekannt: erst einmal eine Liste
      cards.forEach(function (c) { delete c._angle; });
      return null;
    }
    groups.forEach(function (list) {
      var known = list.filter(function (c) { return c._angle !== null; }).sort(function (a, b) { return a._angle - b._angle; });
      known.forEach(function (c) { sides.set(c, c._angle < 90 ? "L" : "R"); });
      var hasL = known.some(function (c) { return sides.get(c) === "L"; }), hasR = known.some(function (c) { return sides.get(c) === "R"; });
      if (known.length >= 2 && !hasL) { sides.set(known[0], "L"); hasL = true; }                     // umfährt die Stadt
      if (known.length >= 2 && !hasR) { sides.set(known[known.length - 1], "R"); hasR = true; }
      list.forEach(function (c) { if (c._angle === null) { sides.set(c, hasL && !hasR ? "R" : "L"); } });   // Lage unbekannt
    });
    cards.forEach(function (c) { delete c._angle; });
    return sides;
  }

  // ---------- Meldungen ----------
  function buildAlerts(messages, labels, nowMs, fmt) {
    var horizon = nowMs + ALERT_LOOKAHEAD_H * 3600000, out = [];
    (Array.isArray(messages) ? messages : []).forEach(function (m) {
      if (!m || typeof m !== "object") { return; }
      var ls = new Set();
      arr(m.lines).forEach(function (l) {
        var lab = Array.isArray(l) ? l[0] : l && typeof l === "object" ? l.label : null;
        if (lab) { ls.add(String(lab).replace(/^SEV\s+/, "")); }   // „SEV S2“ betrifft die S2
      });
      var hit = Array.from(ls).filter(function (l) { return labels.has(l); }).sort(function (a, b) { return pad4(a) < pad4(b) ? -1 : pad4(a) > pad4(b) ? 1 : 0; });
      if (!hit.length) { return; }
      var spans = arr(m.incidentDurations).length ? m.incidentDurations : [{ from: m.validFrom, to: m.validTo }];
      var span = spans.find(function (s) { return s && typeof s === "object" && num(s.from, 0) <= horizon && num(s.to, 9e15) >= nowMs; });
      if (!span) { return; }
      var starts = num(span.from, 0);
      out.push([[m.type !== "INCIDENT" ? 1 : 0, starts], {
        lines: hit.slice(0, 4).join(" · ") + (hit.length > 4 ? " …" : ""), title: clean(m.title),
        from: starts <= nowMs ? null : starts, hit: hit, description: clean(m.description || "")
      }]);
    });
    out.sort(function (a, b) { return cmp(a[0], b[0]); });
    return out.map(function (x) { return x[1]; });
  }
  function stripDirection(text, dest) {   // „in Richtung Arabellapark“ ist auf der Arabellapark-Karte doppelt
    var key = destKey(dest), low = text.toLowerCase(), i = low.indexOf(key), prefixes = ["in richtung ", "richtung "];
    for (var p = 0; p < prefixes.length; p++) {
      var j = i - prefixes[p].length;
      if (i >= 0 && j >= 0 && low.slice(j, i) === prefixes[p]) {
        var rest = text.slice(i + key.length).replace(/^\s+/, "");
        if (rest.toLowerCase().indexOf("bf") === 0) { rest = rest.charAt(2) === "." ? rest.slice(3) : rest.slice(2); }
        var stripped = (text.slice(0, j) + " " + rest).split(/\s+/).join(" ").trim();
        return stripped.length >= 8 ? stripped : text;
      }
    }
    return text;
  }
  // Laufende Meldungen an die passenden Karten hängen; Rest (und Künftiges) fürs Banner
  function attachHints(cards, alerts) {
    var rest = [];
    alerts.forEach(function (a) {
      var used = false;
      if (a.from === null) {
        var same = cards.filter(function (c) { return c && !c.dormant && a.hit.indexOf(c.line) >= 0; });
        var title = a.title.toLowerCase();
        var named = same.filter(function (c) { return title.indexOf(destKey(c.destination)) >= 0; });
        if (!named.length && title.indexOf("richtung") >= 0) { same = []; }   // Richtung ohne Karte -> Banner
        (named.length ? named : same).forEach(function (c) {
          if (!c.hint) { c.hint = named.length ? stripDirection(a.title, c.destination) : a.title; }
          used = true;
        });
      }
      if (!used) { rest.push(a); }
    });
    return rest;
  }

  // ---------- Wetter ----------
  function weatherKind(code, isDay) {
    if (code === 0) { return [isDay ? "sun" : "moon", "klar"]; }
    if (code === 1 || code === 2) { return [isDay ? "partly" : "moon", code === 1 ? "heiter" : "wolkig"]; }
    if (code === 3) { return ["cloud", "bedeckt"]; }
    if (code === 45 || code === 48) { return ["fog", "Nebel"]; }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) { return ["snow", "Schnee"]; }
    if (code >= 95) { return ["thunder", "Gewitter"]; }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { return ["rain", "Regen"]; }
    return ["cloud", ""];
  }
  function buildWeather(w) {
    try {
      var cur = w.current, k = weatherKind(Math.trunc(cur.weather_code), !!(cur.is_day === undefined ? 1 : cur.is_day));
      var times = w.minutely_15.time, pr = w.minutely_15.precipitation, slots = [];
      for (var i = 0; i < Math.min(13, times.length); i++) { slots.push([times[i], pr[i]]); }   // jetzt + 3 h
      var wet = slots.map(function (s) { return (s[1] || 0) >= RAIN_MM; }), word = k[0] === "snow" ? "Schnee" : "Regen", rain = null;
      if (wet.length && wet[0]) {
        var dryAt = slots.find(function (s, n) { return !wet[n]; });
        rain = dryAt ? word + " bis " + dryAt[0].slice(11, 16) : word + " hält an";
      } else if (wet.indexOf(true) >= 0) {
        rain = word + " ab " + slots[wet.indexOf(true)][0].slice(11, 16);
      }
      var temps = ((w.hourly || {}).temperature_2m || []).filter(function (x) { return typeof x === "number"; });
      var lo = temps.length ? Math.round(Math.min.apply(null, temps)) : null, hi = temps.length ? Math.round(Math.max.apply(null, temps)) : null;
      if (typeof cur.temperature_2m !== "number") { return null; }
      return { temp: Math.round(cur.temperature_2m), kind: k[0], text: k[1], rain: rain, lo: lo, hi: lo !== null && hi !== lo ? hi : null };
    } catch (e) {
      return null;
    }
  }

  // ---------- Abrufe ----------
  function getJSON(url, params, timeoutMs) {
    var q = params ? "?" + Object.keys(params).filter(function (k) { return params[k] !== undefined && params[k] !== ""; })
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&") : "";
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 8000) : null;
    return fetch(url + q, { headers: { Accept: "application/json" }, signal: ctl ? ctl.signal : undefined,
                            credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" })
      .then(function (r) {
        if (r.status >= 400 && r.status < 500) { return { _http_error: r.status }; }
        if (!r.ok) { throw new Error("HTTP " + r.status); }
        return r.json();
      })
      .finally(function () { if (timer) { clearTimeout(timer); } });
  }
  // Haltestelle aus Name, Adresse oder Global-ID
  function resolveStation(query) {
    var q = String(query || "").trim();
    if (/^de:\d+:\d+$/.test(q)) {
      return getJSON(API + "/stations/" + q).then(function (s) { return s && s.globalId ? s : { globalId: q, name: q }; },
                                                   function () { return { globalId: q, name: q }; });
    }
    return getJSON(API + "/locations", { query: q }).then(function (hits) {
      hits = arr(hits).filter(function (h) { return h && typeof h === "object"; });
      if (!hits.length) { return null; }
      if (hits[0].type === "STATION" && hits[0].globalId) { return hits[0]; }
      var first = hits[0];
      if (first.latitude && first.longitude) {
        return getJSON(API + "/stations/nearby", { latitude: first.latitude, longitude: first.longitude }).then(function (near) {
          return Array.isArray(near) && near.length ? near[0] : hits.find(function (h) { return h.type === "STATION"; }) || null;
        });
      }
      return hits.find(function (h) { return h.type === "STATION"; }) || null;
    });
  }
  function searchStations(query) {
    return getJSON(API + "/locations", { query: query }).then(function (hits) {
      return arr(hits).filter(function (h) { return h && h.type === "STATION" && h.globalId && h.name; }).slice(0, 8);
    });
  }
  function fetchNearby(lat, lon) {   // auf ~100 m gerundet: genauer muss die MVG den Standort nicht kennen
    return getJSON(API + "/stations/nearby", { latitude: lat.toFixed(3), longitude: lon.toFixed(3) }).then(function (list) {
      return arr(list).filter(function (h) { return h && h.globalId && h.name; }).slice(0, 8);
    });
  }
  function locate(name) {           // Lage eines Ziels (für stadteinwärts / stadtauswärts)
    return getJSON(API + "/locations", { query: String(name).replace(/\s*\([^)]*\)\s*$/, "") }).then(function (hits) {
      var h = arr(hits).find(function (x) { return x && x.type === "STATION" && typeof x.latitude === "number"; }) ||
              arr(hits).find(function (x) { return x && typeof x.latitude === "number"; });
      return h ? [h.latitude, h.longitude] : null;
    });
  }
  function fetchDepartures(globalId, types, offsetMin) {
    return getJSON(API + "/departures", { globalId: globalId, limit: DEP_LIMIT, transportTypes: types || "", offsetInMinutes: offsetMin });
  }
  // Abends und nachts liefert die MVG oft nur ~3 h: Linien, die heute enden (149) oder erst später fahren
  // (Nachtbus N74), fehlen darin. Lückenlos weiterlesen – das nächste Fenster beginnt, wo das vorige endet –,
  // höchstens zwei Fenster, bis 7 Uhr früh. Fällt eines aus, ist Schluss (lieber nichts als eine falsche
  // erste Fahrt). Liefert die Abfahrten der Linien, die in deps fehlen (wie transform.py).
  function fetchAhead(globalId, deps, nowMs, untilMs) {
    var known = new Set(deps.map(function (d) { return String(d.label); }));
    var reach = robustHorizon(deps.map(depTime)) || 0, out = [], seen = new Set();
    function hop(n) {
      if (n >= 2 || !reach || reach >= untilMs) { return Promise.resolve(out); }
      return fetchDepartures(globalId, "", Math.max(0, Math.floor((reach - nowMs) / 60000))).then(function (r) {
        var list = arr(r), end = robustHorizon(list.map(depTime)) || 0;
        if (!list.length || end <= reach) { return out; }
        list.forEach(function (d) {
          if (!d || typeof d !== "object" || known.has(String(d.label))) { return; }
          var k = JSON.stringify([d.tripId || d.destination, d.label, d.plannedDepartureTime]);
          if (!seen.has(k)) { seen.add(k); out.push(d); }
        });
        reach = end;
        return hop(n + 1);
      }, function () { return out; });
    }
    return hop(0);
  }
  function fetchMessages() { return getJSON(API + "/messages", null, 12000); }
  function fetchWeather(lat, lon) {
    return getJSON(WEATHER_API, { latitude: lat, longitude: lon, timezone: "Europe/Berlin",
                                  current: "temperature_2m,weather_code,is_day", minutely_15: "precipitation",
                                  forecast_minutely_15: 13, hourly: "temperature_2m", forecast_hours: 12 });
  }
  // mehrere Haltestellen zusammenführen: eine Fahrt nur einmal, innerhalb einer Haltestelle nie aussortieren
  // Ende einer Abfahrtsliste ohne einzelne Ausreißer am Ende (wie robust_horizon in transform.py): Am Karlsplatz
  // kamen 79 Abfahrten bis 17:55 und eine um 00:01 – mit 00:01 als Ende stünde „letzte Fahrt“ an Linien, die um 18 Uhr fahren
  function robustHorizon(times) {
    var ts = times.filter(function (x) { return typeof x === "number"; }).sort(function (a, b) { return a - b; });
    if (ts.length < 3) { return ts.length ? ts[ts.length - 1] : null; }
    var gaps = ts.slice(1).map(function (t, i) { return t - ts[i]; }).sort(function (a, b) { return a - b; });
    var typical = gaps[Math.floor(gaps.length / 2)];
    while (ts.length > 2 && ts[ts.length - 1] - ts[ts.length - 2] > Math.max(30 * 60000, 4 * typical)) { ts.pop(); }
    return ts[ts.length - 1];
  }
  function mergeDepartures(results) {
    var deps = [], seen = new Set(), horizons = [];
    results.forEach(function (r) {
      if (!Array.isArray(r)) { return; }
      var mine = [];
      r.forEach(function (d) {
        if (!d || typeof d !== "object") { return; }
        var k = JSON.stringify([d.tripId || d.destination, d.label, d.plannedDepartureTime]);
        if (seen.has(k)) { return; }
        mine.push(k);
        deps.push(d);
      });
      mine.forEach(function (k) { seen.add(k); });
      var ts = r.map(function (d) { return d && depTime(d); }).filter(function (x) { return typeof x === "number"; });
      if (ts.length) { horizons.push(robustHorizon(ts)); }
    });
    return { deps: deps, horizonMs: horizons.length ? Math.min.apply(null, horizons) : null };
  }

  root.Abfahrt = {
    API: API, buildCards: buildCards, isLeft: isLeft, parseTerms: parseTerms, buildAlerts: buildAlerts,
    attachHints: attachHints, buildWeather: buildWeather, sameDest: sameDest, direction: direction,
    shortLabel: shortLabel, stripDirection: stripDirection, resolveStation: resolveStation,
    searchStations: searchStations, fetchDepartures: fetchDepartures, fetchAhead: fetchAhead, fetchNearby: fetchNearby, locate: locate,
    directionSides: directionSides, angleToCenter: angleToCenter, distKm: distKm, fetchMessages: fetchMessages,
    fetchWeather: fetchWeather, mergeDepartures: mergeDepartures, depTime: depTime, robustHorizon: robustHorizon
  };
})(window);
