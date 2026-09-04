# michaelhofauer.com

Statische Seite, ein File. Kein Build, keine Abhängigkeiten außer der Schrift von Google Fonts.

## Ordnerstruktur

```
/
├── index.html
├── CNAME          → enthält: michaelhofauer.com
├── .nojekyll      → verhindert, dass GitHub die Dateien durch Jekyll schickt
└── images/
```

## Bilder, die die Seite erwartet

Dateinamen exakt so, alles klein geschrieben. GitHub Pages unterscheidet Groß- und
Kleinschreibung — `Fredperry-Hero.JPG` wird nicht gefunden, `fredperry-hero.jpg` schon.
Solange eine Datei fehlt, springt der `onerror`-Fallback auf picsum ein; die Seite
sieht also nie kaputt aus, auch nicht halb befüllt.

### Kopf

| Datei | Inhalt | Format |
|---|---|---|
| `start-01.jpg` | Kopfbild, volle Breite | quer, 2400 px |

### Projekte

| Datei | Inhalt | Format |
|---|---|---|
| `spring-hero.jpg` | Spring Inside, fertige Fläche | 16:10 — **liegt bereits im Ordner** |
| `spring-plan.jpg` | Elevation mit Maßen | 3:2 — **liegt bereits im Ordner** |
| `spring-detail.jpg` | Blumenaufhängung, Farbcodierung | 4:5 — **liegt bereits im Ordner** |
| `canadagoose-hero.jpg` | Backstage Nature, fertige Fläche | 16:10 — **liegt bereits im Ordner** |
| `canadagoose-moodboard.jpg` | Moodboard | 3:2 — **liegt bereits im Ordner** |
| `canadagoose-bau.jpg` | Aufbau mit Studiolicht | 4:5 — **liegt bereits im Ordner** |
| `tagesbar-hero.jpg` | Tagesbar Tracht, fertige Fläche | 16:10 — **liegt bereits im Ordner** |
| `tagesbar-plan.jpg` | 3D-Rendering, ins Raumfoto integriert | 3:2 — **liegt bereits im Ordner** |
| `tagesbar-detail.jpg` | Trachtenjacken, Detail | 4:5 — **liegt bereits im Ordner** |
| `lego-treppenhaus.jpg` | Installation im Treppenhaus | 16:10 — **liegt bereits im Ordner** |
| `lego-plan.jpg` | Planung, Fensterabwicklung | 3:2 — **liegt bereits im Ordner** |
| `lego-fenster.jpg` | Umgesetztes Schaufenster (Hochformat) | 4:5 — **liegt bereits im Ordner** |
| `lego-flaeche.jpg` | Rückwand, LEGO-Modell und Warenpräsentation | 3:2 — **liegt bereits im Ordner** |
| `fredperry-hero.jpg` | Fred Perry Window, fertiges Fenster | 16:10 — **liegt bereits im Ordner** |
| `fredperry-planung.jpg` | 3D-Voransicht vor dem Bau | 3:2 — **liegt bereits im Ordner** |
| `fredperry-grundriss.jpg` | Grundriss von oben, 3D-Rendering | 4:5 — **liegt bereits im Ordner** |
| `dressler-hero.jpg` | Dressler Window, fertiges Fenster | 16:10 — **liegt bereits im Ordner** |
| `dressler-punktc.jpg` | 3D-Voransicht der Leuchtkasten-Konstruktion | 3:2 — **liegt bereits im Ordner** |
| `windsor-hero.jpg` | Windsor Pop-up, fertige Fläche | 16:10 — **liegt bereits im Ordner** |
| `windsor-aufbau.jpg` | Sitzreihen mit Ware | 3:2 — **liegt bereits im Ordner** |
| `windsor-detail.jpg` | Kinosessel als Warenträger | 4:5 — **liegt bereits im Ordner** |
| `windsor-moodboard.jpg` | Moodboard, Referenz Deutsche Oper Berlin | 3:2 — **liegt bereits im Ordner** |
| `lichtspiel-hero.jpg` | Projektion auf Architektur | 16:10 — **liegt bereits im Ordner** |
| `lichtspiel-motiv.jpg` | Gesichtsprojektion mit Textmotiv, Text vollständig lesbar | 3:2 — **liegt bereits im Ordner** |
| `lichtspiel-mapping.jpg` | Gespiegelte Projektion über die Raumecke | 4:5 — **liegt bereits im Ordner** |

Die beiden Prozessbilder sind entfallen — licht+spiel zeigt jetzt zwei YouTube-Videos
statt Fotos. Die Videos werden im Code direkt über ihre YouTube-ID eingebunden
(aktuell `2O1iceiNoVI` und `4aS7LRck3JM`), dafür ist keine lokale Bilddatei nötig.
Der Vorschau-Thumbnail kommt automatisch von YouTube.


### Person und Teilen

| Datei | Inhalt | Format |
|---|---|---|
| `portrait.jpg` | Porträt, wird für Profil und Footer verwendet | 3:4 — **liegt bereits im Ordner** |
| `og.jpg` | Vorschaubild beim Teilen | 1200 × 630 |

## Veröffentlichen

1. Repository anlegen, diese Dateien in den Hauptzweig legen.
2. Settings → Pages → Source: `main`, Ordner `/ (root)`.
3. Settings → Pages → Custom domain: `michaelhofauer.com`, „Enforce HTTPS" anhaken.
4. Beim Domain-Anbieter setzen:
   - `A` auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` für `www` auf `<dein-github-name>.github.io`

Das Zertifikat braucht nach dem DNS-Eintrag meist 15 Minuten bis eine Stunde.

## Farbschema umstellen

Die hellen Projektabschnitte lassen sich einzeln auf Schwarz drehen. Dafür genügt
`class="invert"` an der jeweiligen Sektion:

```html
<section class="case invert wrap" id="case-001" data-num="001">
```

Die Farbwerte stecken als CSS-Variablen im Block `.invert` ganz oben. Die Kopfleiste
erkennt selbst, ob sie gerade über einem dunklen Abschnitt steht, und färbt sich um.

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
| Kopfbild `start-01.jpg` | 2400 px | 75 |
| Heldenbilder der Projekte | 2000 px | 75 |
| Prozessbilder | 1400 px | 75 |
| Porträts | 1200 px | 80 |
| `og.jpg` | 1200 × 630 px | 80 |
