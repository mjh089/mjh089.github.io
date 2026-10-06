/* Hell/Dunkel wie auf michaelhofauer.com: eine dort getroffene Wahl (localStorage „mjh-theme“) gilt
   auch hier, sonst folgt die Seite dem System. Läuft im <head>, damit nichts aufblitzt. */
try {
  var mjhTheme = localStorage.getItem("mjh-theme");
  if (mjhTheme === "dark" || mjhTheme === "light") { document.documentElement.setAttribute("data-theme", mjhTheme); }
} catch (e) { /* ohne Speicher: System-Einstellung */ }
