/* Hell/Dunkel wie auf michaelhofauer.com: eine dort oder hier (Schalter unten) getroffene Wahl
   (localStorage „mjh-theme“) gilt auf beiden Seiten, sonst folgt die Seite dem System. Läuft im <head>,
   damit nichts aufblitzt; app.js bedient darüber den Schalter. */
(function () {
  var root = document.documentElement, PAPER = { light: "#FFFFFF", dark: "#0A0A0A" };
  var sys = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function system() { return sys && sys.matches ? "dark" : "light"; }
  function saved() {
    try { var t = localStorage.getItem("mjh-theme"); return t === "dark" || t === "light" ? t : null; }
    catch (e) { return null; }   // ohne Speicher: System-Einstellung
  }
  function paint(t) {          // t: "dark" | "light" | null (= System)
    if (t) { root.setAttribute("data-theme", t); } else { root.removeAttribute("data-theme"); }
    var metas = document.querySelectorAll('meta[name="theme-color"]');   // Leiste von Safari mitfärben
    for (var i = 0; i < metas.length; i++) {
      var own = /dark/.test(metas[i].getAttribute("media") || "") ? "dark" : "light";
      metas[i].setAttribute("content", PAPER[t || own]);
    }
  }
  paint(saved());
  window.AbfahrtThema = {
    current: function () { return root.getAttribute("data-theme") || system(); },
    set: function (t) {        // dieselbe Wahl wie das System = wieder automatisch (abends dunkel usw.)
      var keep = t === system() ? null : t;
      try { if (keep) { localStorage.setItem("mjh-theme", keep); } else { localStorage.removeItem("mjh-theme"); } } catch (e) { /* egal */ }
      paint(keep);
    },
    reload: function () { paint(saved()); },
    onSystemChange: function (fn) { if (sys && sys.addEventListener) { sys.addEventListener("change", fn); } }
  };
})();
