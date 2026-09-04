# michaelhofauer.com

Statische One-Page-Site, zwei Dateien (`index.html`, `404.html`). Kein Build,
keine externen Abhängigkeiten — auch keine Google Fonts, nur der
System-Schriftstack (`Helvetica Neue`, Helvetica, Arial, sans-serif).

Design: Swiss-Grid-System (12-Spalten-Raster, Rasterschalter, Hell/Dunkel-
Umschalter, DE/EN), inspiriert von Josef Müller-Brockmann / Karl Gerstner.

## Ordnerstruktur

```
/
├── index.html
├── 404.html
├── CNAME          → enthält: michaelhofauer.com
└── images/
```

## Bilder, die die Seite erwartet

Dateinamen exakt so, alles klein geschrieben. GitHub Pages unterscheidet Groß-
und Kleinschreibung — `Fredperry-Hero.JPG` wird nicht gefunden,
`fredperry-hero.jpg` schon. Solange eine Datei fehlt, springt der
`onerror`-Fallback auf picsum ein; die Seite sieht also nie kaputt aus, auch
nicht halb befüllt.

### Projekte

| Datei | Inhalt | Format |
|---|---|---|
| `spring-hero.jpg` | Spring Inside, fertige Fläche | 16:10 |
| `spring-plan.jpg` | Elevation mit Maßen | 3:2 |
| `spring-detail.jpg` | Blumenaufhängung, Farbcodierung | 4:5 |
| `canadagoose-hero.jpg` | Backstage Nature, fertige Fläche | 16:10 |
| `canadagoose-moodboard.jpg` | Moodboard | 3:2 |
| `canadagoose-bau.jpg` | Aufbau mit Studiolicht | 4:5 |
| `tagesbar-hero.jpg` | Tagesbar Tracht, fertige Fläche | 16:10 |
| `tagesbar-plan.jpg` | 3D-Rendering, ins Raumfoto integriert | 3:2 |
| `tagesbar-detail.jpg` | Trachtenjacken, Detail | 4:5 |
| `lego-treppenhaus.jpg` | Installation im Treppenhaus | 16:10 |
| `lego-plan.jpg` | Planung, Fensterabwicklung | 3:2 |
| `lego-fenster.jpg` | Umgesetztes Schaufenster (Hochformat) | 4:5 |
| `lego-flaeche.jpg` | Rückwand, LEGO-Modell und Warenpräsentation | 3:2 |
| `fredperry-hero.jpg` | Fred Perry Window, fertiges Fenster | 16:10 |
| `fredperry-planung.jpg` | 3D-Voransicht vor dem Bau | 3:2 |
| `fredperry-grundriss.jpg` | Grundriss von oben, 3D-Rendering | 4:5 |
| `dressler-hero.jpg` | Dressler Window, fertiges Fenster | 16:10 |
| `dressler-punktc.jpg` | 3D-Voransicht der Leuchtkasten-Konstruktion | 3:2 |
| `windsor-hero.jpg` | Windsor Pop-up, fertige Fläche | 16:10 |
| `windsor-aufbau.jpg` | Sitzreihen mit Ware | 3:2 |
| `windsor-detail.jpg` | Kinosessel als Warenträger | 4:5 |
| `windsor-moodboard.jpg` | Moodboard, Referenz Deutsche Oper Berlin | 3:2 |
| `lichtspiel-hero.jpg` | Projektion auf Architektur | 16:10 |
| `lichtspiel-motiv.jpg` | Gesichtsprojektion mit Textmotiv, Text vollständig lesbar | 3:2 |
| `lichtspiel-mapping.jpg` | Gespiegelte Projektion über die Raumecke | 4:5 |

Die Prozessbilder mit landschaftlichem Format (3:2) laufen in der
Prozessreihe per `object-fit:contain` — sie werden nicht beschnitten, sondern
zeigen das komplette Bild auf grauem Grund (`--thumb-bg`).

Zwei licht+spiel-Prozessbilder sind entfallen — es werden stattdessen zwei
YouTube-Videos eingebunden (IDs `2O1iceiNoVI` und `4aS7LRck3JM`), über
`youtube-nocookie.com`, geladen erst nach Klick.

### Person und Teilen

| Datei | Inhalt | Format |
|---|---|---|
| `portrait.jpg` | Porträt, einmalig im Profilbereich verwendet | 3:4 |
| `og.jpg` | Vorschaubild beim Teilen | 1200 × 630 — **fehlt noch** |

## Veröffentlichen

1. Repository anlegen, diese Dateien in den Hauptzweig legen.
2. Settings → Pages → Source: `main`, Ordner `/ (root)`.
3. Settings → Pages → Custom domain: `michaelhofauer.com`, „Enforce HTTPS" anhaken.
4. Beim Domain-Anbieter setzen:
   - `A` auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` auf die passende GitHub-Pages-IPv6-Adresse
   - `CNAME` für `www` auf `<dein-github-name>.github.io`

Das Zertifikat braucht nach dem DNS-Eintrag meist 15 Minuten bis eine Stunde.

Deployment ist manuell: Dateien über die GitHub-Weboberfläche hochladen
(Add file → Upload files → Commit changes). `index.html`/`404.html` ins
Repository-Root, Bilder in `images/`. Browser-Cache beim Prüfen unzuverlässig
— im Inkognito-Fenster gegenchecken.

## Farbschema

Hell/Dunkel wird global über `data-theme="dark"|"light"` auf `<html>`
gesteuert (Schalter `#themeToggle`, oben rechts). Die Farbwerte stecken als
CSS-Variablen in `:root` und `html[data-theme="dark"]`. Auswahl wird in
`localStorage['mjh-theme']` gemerkt, respektiert beim ersten Besuch
`prefers-color-scheme`. Rot (`#E1000F`) bleibt in beiden Modi identisch.

## Sprache

Deutsch ist der Grundzustand im HTML. `#langToggle` schaltet per
`data-i18n`-Attributen auf Englisch um (Dictionary `i18n.en` im Script-Block).
Zurück auf Deutsch löst einfach `location.reload()` aus. Auswahl wird in
`localStorage['mjh-lang']` gemerkt.

## Bildexport

- **Farbraum sRGB.** Kein Adobe RGB, kein ProPhoto. Browser ignorieren eingebettete
  Profile teilweise, deine Rot- und Grüntöne kippen dann ins Stumpfe.
- **Metadaten entfernen.** Kameradaten, GPS-Koordinaten und Ebenennamen brauchen im
  Web niemand. In Photoshop: „Exportieren als" → Metadaten „Keine".
- **Kein Hochrechnen.** Ein altes Handyfoto vom Aufbau bleibt in seiner Größe. Kleiner
  und scharf schlägt groß und weich.
- **Zielgewicht:** Heldenbilder unter 400 KB, Prozessbilder unter 250 KB. Die ganze
  Seite sollte unter 2 MB laden.

| Rolle | Breite | Qualität |
|---|---|---|
| Heldenbilder der Projekte | 2000 px | 75 |
| Prozessbilder | 1400 px | 75 |
| Porträt | 1200 px | 80 |
| `og.jpg` | 1200 × 630 px | 80 |
