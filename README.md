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
| `fashionlab-hero.jpg` | Fashion Lab, Runway-Rendering, logofrei | 16:10 |
| `fashionlab-layout.jpg` | Draufsicht mit den Zonen A/B/C | 1,36:1 |
| `fashionlab-plan.jpg` | Bauzeichnung, acht LED-Flächen nummeriert | 1,10:1 |
| `fashionlab-led.jpg` | Talk-Ecke, drei LED-Flächen vor der Rundwand | 5:3 |
| `fashionlab-fashion.jpg` | Set mit Fashion | 5:4 |
| `fashionlab-cosmetics.jpg` | Set mit Cosmetics | 5:4 |
| `fashionlab-schmuck.jpg` | Set mit Schmuck, Rundbogen im Hochformat | 3:5 |
| `lichtspiel-hero.jpg` | Projektion auf Architektur | 16:10 |
| `lichtspiel-motiv.jpg` | Gesichtsprojektion mit Textmotiv, Text vollständig lesbar | 3:2 |
| `lichtspiel-mapping.jpg` | Gespiegelte Projektion über die Raumecke | 4:5 |

Die Prozessreihen setzen die Bilder als ausgerichtete Zeile: Alle Bilder
einer Reihe teilen sich dieselbe Höhe, die Breite ergibt sich aus dem
jeweiligen Seitenverhältnis (`--ar` am `.strip-item`, Flexbox verteilt
proportional). Dadurch wird nichts beschnitten und es entstehen keine Ränder.
Wird ein Bild ausgetauscht, muss `--ar` mitgezogen werden.

Die Fashion-Lab-Bilder sind logofrei: Marken auf Wänden, LED-Flächen und
Produkten sind im Quellprojekt entfernt (`mjh_ci`, `praesentation/hse24/
portfolio/logos-entfernen.py`, erzeugt mit `portfolio-bilder.py`). Ersetzen
nur von dort, nie aus den Original-Renderings. Der Abschnitt steht an
zweiter Stelle und zeigt die Nummer 02, trägt aber die id `p9`, damit die
von außen verlinkten Anker `#p1` bis `#p8` gültig bleiben. Die angezeigten
Nummern folgen der Reihenfolge auf der Seite, nicht der id.

### 360-Grad-Umfahrt (Fashion Lab, noch nicht eingesetzt)

CSS und Skript für den Dreh-Viewer stehen schon in `index.html`, das HTML
fehlt bewusst: Die Einzelbilder kommen aus einem neuen Render ohne Logos.
Sobald sie als `images/fashionlab-360/u001.jpg` bis `u120.jpg` liegen
(erzeugt mit `umfahrt-web.py` im Quellprojekt), dieses Stück im Abschnitt
`#p9` direkt vor `</section>` einsetzen:

```html
  <div class="strip">
    <div class="strip-item strip-full" style="--ar:1.7778">
      <div class="thumb umfahrt" style="background:#c9bdb1" data-pfad="images/fashionlab-360/u" data-anzahl="120"
           tabindex="0" role="img" aria-label="360-Grad-Umfahrt durch das Set. Im Bild ziehen oder Pfeiltasten zum Drehen.">
        <img src="images/fashionlab-360/u001.jpg" width="1280" height="720" alt="" loading="lazy">
        <canvas width="1280" height="720" aria-hidden="true"></canvas>
        <span class="umfahrt-hinweis" aria-hidden="true"><b>&#8596;</b><span data-i18n="p9.dreh">Im Bild ziehen</span></span>
        <span class="umfahrt-laden" aria-hidden="true" hidden></span>
      </div>
      <div class="label"><span class="letter">g</span><span class="cap" data-i18n="p9.stripG">360°-Umfahrt durch alle fünf Bereiche</span></div></div>
```

Die Texte `p9.stripG` und `p9.dreh` stehen in beiden Wörterbüchern bereits.
Der Viewer lädt erst beim ersten Anfassen (rund 7 MB), vorher nur `u001.jpg`.

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

## Abfahrt (unverlinkte Unterseite)

`/abfahrt-d9785f7f8ba7/` zeigt Live-Abfahrten einer MVG-Haltestelle fürs iPhone
(Safari → Teilen → Zum Home-Bildschirm). Die Haltestelle wird in der Seite gewählt
(Suche mit Vorschlägen, „In meiner Nähe“ per Standort, zuletzt gewählte) und steckt im
Link (`?h=Vogelweideplatz`, dazu `w=0` ohne Wetter, `r=0` ohne Richtungsspalten, `m=0` ohne
Störungsmeldungen) bzw. im
Speicher des Geräts – nicht im Code. `noindex`, nirgends verlinkt.

Stadteinwärts/stadtauswärts ordnet die Seite selbst: Liegt ein Ziel von der Haltestelle
aus in Richtung Marienplatz (Winkel unter 90°), steht es links; je Linie kommen die beiden
Richtungen nebeneinander. Die Lage der Ziele fragt sie einmal bei der MVG ab und merkt sie
sich auf dem Gerät. In der Innenstadt (unter 1,5 km zum Marienplatz) gibt es eine Liste.
„In meiner Nähe“ schickt den Standort auf ~100 m gerundet an die MVG, nur nach Antippen.
Abends und nachts (18–5 Uhr) liest die Seite – wie das Plugin – lückenlos weiter bis 7 Uhr
früh (höchstens alle 10 Min., im Hintergrund), damit Linien mit Betriebsschluss („149 · morgen
05:56“) und Nachtbusse („N74 · erst 01:36“) als ruhende Zeile erscheinen; die MVG liefert sonst
abends oft nur ~3 Stunden.

Darstellung: hochkant zwei Spalten (die beiden Richtungen); ab 720 px Breite (iPhone quer,
iPad, Rechner) zwei Linien nebeneinander, also vier Karten je Reihe; iPhone quer zusätzlich
mit knappem Kopf und einzeiligen Folgezeiten. Hell/Dunkel folgt dem System; der Schalter
„Dunkelmodus“ unten schreibt dieselbe Wahl wie `#themeToggle` der Hauptseite
(`localStorage['mjh-theme']`) – stimmt sie mit dem System überein, wird sie gelöscht und
die Seite folgt wieder dem System (`thema.js`).

Ausnahme vom Grundsatz „nichts von fremden Servern“, bewusst und eng: Die eigene
Content-Security-Policy dieser Unterseite erlaubt `connect-src` nur zu `www.mvg.de`
(Abfahrten, Meldungen – inoffizielle Schnittstelle) und `api.open-meteo.com` (Wetter).
Schrift (Manrope, OFL, `OFL.txt`) und Symbole liegen hier. Die Logik ist eine
Übertragung des TRMNL-Plugins (`trmnl-mvg-abfahrten/src/transform.py`) und wurde mit
dessen Ergebnissen auf Echtdaten abgeglichen.

Sicherheit: `default-src 'none'`, nur eigene Skripte/Styles/Schrift/Bilder, kein
Inline-Code, `require-trusted-types-for 'script'` (Chromium sperrt damit jede
HTML-Einfügung; der Code setzt Texte ausschließlich per `textContent`). Abrufe ohne
Cookies und ohne Referrer. In fremde Seiten eingebettet zeigt sie nur einen Link.
Daten von außen werden auf ihren Typ geprüft, bevor sie verarbeitet werden.

**Beim Ändern:** `?v=…` an den Dateien in `index.html` hochzählen – GitHub Pages lässt
Dateien zehn Minuten im Gerätespeicher; ohne neue Nummer mischt das iPhone kurz neue
Seite und alte Skripte. Passiert es doch (alte Seite, neues Skript), lädt sich die Seite
einmal frisch am Zwischenspeicher vorbei (`&frisch=…`, wird danach wieder entfernt). Prüfen mit `python3 tools/web_check.py` im Projekt
`trmnl-mvg-abfahrten` (Einzelfälle + Abgleich mit dem Plugin auf Echtdaten).

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

Eigene Rasterzeile in licht+spiel, Spalten 3–11, gesetzt zwischen die
Bildreihe und die Videoreihe: Die Textfläche trennt dort zwei Bildbänder
und lockert den Abschnitt auf, statt ihn nur zu beenden. Zwei Eigenheiten,
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

**Kein Zusatzabstand zwischen den Gliedern.** Der Block läuft auf einem
einzigen Zeilenabstand. Ein `margin-top` auf `.pq-l + .pq-l` wirkt nur
zwischen den Gliedern, nicht innerhalb eines Glieds, das umbricht — und
sobald eines umbricht (im Deutschen das dritte, mobil alle), stehen zwei
verschiedene Rhythmen im selben Absatz. Die Gliederung tragen allein die
Umbrüche an den Sinngrenzen; das reicht, weil die vorderen Glieder
sichtbar vor dem Satzspiegel enden. Nachmessen lässt sich das mit einer
`Range` über `.pq-l`: `getClientRects()` liefert eine Box je gerenderter
Zeile, die Abstände müssen alle gleich sein.

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
