# michaelhofauer.com

Statische One-Page-Site, zwei Dateien (`index.html`, `404.html`). Kein Build,
keine externen Abhängigkeiten — auch keine Google Fonts, nur der
System-Schriftstack (`Helvetica Neue`, Helvetica, Arial, sans-serif).

Design: Swiss-Grid-System (12-Spalten-Raster, Rasterschalter, Hell/Dunkel-
Umschalter, DE/EN/JA), inspiriert von Josef Müller-Brockmann / Karl Gerstner.

## Ordnerstruktur

```
/
├── index.html
├── 404.html
├── CNAME          → enthält: michaelhofauer.com
├── robots.txt
├── sitemap.xml
├── llms.txt       → Kurzüberblick für KI-Crawler
└── images/
```

Die Seite lädt nichts von fremden Servern. Eine Content-Security-Policy im
`<head>` erzwingt das technisch: erlaubt sind nur eigene Dateien, `data:` für
das Favicon und `youtube-nocookie.com` als Frame — Letzteres greift erst, wenn
jemand ein Video anklickt. Wer eine externe Einbindung ergänzt, muss die Policy
bewusst aufmachen; das ist die Bremse, die verhindert, dass die Aussagen in der
Datenschutzerklärung unbemerkt unwahr werden.

## Bilder, die die Seite erwartet

Dateinamen exakt so, alles klein geschrieben. GitHub Pages unterscheidet Groß-
und Kleinschreibung — `Fredperry-Hero.JPG` wird nicht gefunden,
`fredperry-hero.jpg` schon. Es gibt bewusst keinen Platzhalter-Dienst als
Rückfallebene mehr: Die Seite lädt ausschließlich Dateien von der eigenen
Domain, damit die Zusage in der Datenschutzerklärung technisch stimmt. Fehlt
eine Datei, bleibt die Fläche leer — das fällt beim Prüfen auf, statt sich
hinter einem Fremdbild zu verstecken.

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

Die Prozessreihen setzen die Bilder als ausgerichtete Zeile: Alle Bilder
einer Reihe teilen sich dieselbe Höhe, die Breite ergibt sich aus dem
jeweiligen Seitenverhältnis (`--ar` am `.strip-item`, Flexbox verteilt
proportional). Dadurch wird nichts beschnitten und es entstehen keine Ränder.
Wird ein Bild ausgetauscht, muss `--ar` mitgezogen werden.

Zwei licht+spiel-Prozessbilder sind entfallen — es werden stattdessen zwei
YouTube-Videos eingebunden (IDs `2O1iceiNoVI` und `4aS7LRck3JM`), über
`youtube-nocookie.com`, geladen erst nach Klick. Die Vorschaubilder liegen als
`lichtspiel-video1.jpg` und `lichtspiel-video2.jpg` lokal im Ordner, damit vor
dem Klick keine Verbindung zu Google entsteht.

### Person und Teilen

| Datei | Inhalt | Format |
|---|---|---|
| `portrait.jpg` | Porträt, einmalig im Profilbereich verwendet | 3:4 |
| `og.jpg` | Vorschaubild beim Teilen | 1200 × 630 |
| `lichtspiel-video1.jpg`, `lichtspiel-video2.jpg` | YouTube-Vorschaubilder, lokal | 16:9, 1280 px |

## Veröffentlichen

1. Repository anlegen, diese Dateien in den Hauptzweig legen.
2. Settings → Pages → Source: `main`, Ordner `/ (root)`.
3. Settings → Pages → Custom domain: `michaelhofauer.com`, „Enforce HTTPS" anhaken.
4. Beim Domain-Anbieter setzen:
   - `A` auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` auf die passende GitHub-Pages-IPv6-Adresse
   - `CNAME` für `www` auf `<dein-github-name>.github.io`

Das Zertifikat braucht nach dem DNS-Eintrag meist 15 Minuten bis eine Stunde.

Deployment läuft über GitHub Desktop (Commit → Push origin); alternativ über
die GitHub-Weboberfläche. Browser-Cache beim Prüfen unzuverlässig — im
Inkognito-Fenster gegenchecken, GitHub Pages braucht ein bis zwei Minuten für
den Rebuild.

Das Meta-Tag `google-site-verification` im `<head>` hält die Bestätigung der
Search Console aufrecht und darf nicht entfernt werden.

## Farbschema

Hell/Dunkel wird global über `data-theme="dark"|"light"` auf `<html>`
gesteuert (Schalter `#themeToggle`, oben rechts). Die Farbwerte stecken als
CSS-Variablen in `:root` und `html[data-theme="dark"]`. Auswahl wird in
`localStorage['mjh-theme']` gemerkt, respektiert beim ersten Besuch
`prefers-color-scheme`. Rot (`#E1000F`) bleibt in beiden Modi identisch.

## Sprache

Drei Sprachen in einer Datei. Deutsch ist der Grundzustand im Markup und hat
kein Wörterbuch; Englisch und Japanisch liegen als `i18n.en` und `i18n.ja` im
Script-Block und werden über `data-i18n`-Attribute per `textContent` eingesetzt.
Zurück auf Deutsch löst `location.reload()` aus, weil der Ausgangszustand damit
ohne zweites Wörterbuch wiederhergestellt ist.

Die Auswahl sitzt als Feldgruppe `.lang-select` in der Kopfleiste, das aktive
Feld ist über `aria-current="true"` ausgezeichnet. Auswahl wird in
`localStorage['mjh-lang']` gemerkt; ein unbekannter Wert fällt auf Deutsch
zurück.

**Beim Ergänzen von Inhalten:** Jeder neue Text braucht ein `data-i18n` und
einen Eintrag in *beiden* Wörterbüchern. Ein Element ohne Attribut bleibt in
allen Sprachen deutsch — das ist der Fehler, der hier schon mehrfach passiert
ist. Prüfen lässt sich das, indem man die Schlüsselmengen von Markup, `i18n.en`
und `i18n.ja` vergleicht; sie müssen deckungsgleich sein.

Eigennamen bleiben bewusst lateinisch (Projekttitel, Venues, Firmen, Software).
Ortsnamen stehen in der japanischen Fassung im Katakana, ebenso Marken mit
amtlicher japanischer Schreibweise (レゴ、カナダグース、フレッドペリー).
Datumsangaben folgen dort japanischer Konvention (`2020年9月`).

## Typografie

Anführungszeichen und Apostrophe folgen je Sprache der dortigen Konvention.
Gerade Zeichen (" und ') gehören in den Code, nicht in den Text:

| Sprache | Anführung | Apostroph |
|---|---|---|
| Deutsch | `„Wort“` (U+201E / U+201C) | `’` (U+2019) |
| Englisch | `“Word”` (U+201C / U+201D) | `’` (U+2019) |
| Japanisch | `「言葉」`, Werktitel `『…』` | – |

Im Wörterbuch stehen die Zeichen literal, nicht als `\uXXXX`-Kürzel — die
Datei ist UTF-8, und literale Zeichen bleiben beim Bearbeiten lesbar.

### Pull Quote (`.pq`)

Eigene Rasterzeile am Ende von licht+spiel, Spalten 3–11. Zwei Eigenheiten,
die beim Kopieren des Musters leicht verlorengehen:

- **`figure` braucht `margin:0`.** Browser geben dem Element von sich aus
  `margin: 1em 40px` mit. Ohne das Zurücksetzen sitzt der Block 40 px
  eingerückt und berechnet seine zwölf Spalten auf der verschmälerten
  Breite — er läuft dann sichtbar neben dem Seitenraster. Gegenprobe: Die
  linke Kante muss exakt auf der von `.idx-name` liegen, das ebenfalls auf
  Spalte 3 sitzt.
- **Das öffnende Anführungszeichen hängt im Rand** (`text-indent:-0.4em`,
  im Japanischen `-0.5em`, weil `「` vollbreit ist und die Glyphe nur die
  rechte Hälfte füllt). Damit sitzt der erste Buchstabe optisch auf der
  Spaltenkante — dieselbe Logik wie das negative `margin-left` an den roten
  Ziffern. `hanging-punctuation` wird bewusst *nicht* verwendet: Safari
  kennt es, alle anderen nicht, und zusammen mit dem `text-indent` würde
  der Versatz dort doppelt greifen.

Das Zitat ist in seine Sinnglieder zerlegt (`.pq-l`, je ein eigener
`data-i18n`-Schlüssel), weil `textContent` beim Sprachwechsel jedes
Innenmarkup löschen würde. Jede Sprache setzt ihre Umbrüche damit selbst.

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
