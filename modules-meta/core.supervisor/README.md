# CascadeGehirn Supervisor

**Produktionsreifer Supervisor für das CascadeGehirn-Ökosystem**

## Features
- Startet und überwacht alle Kernmodule (z.B. Code-Normalisierer)
- Automatischer Neustart bei Absturz (Hot-Reload für Watcher)
- Zentrale Konfiguration über `config.json`
- Erweiterbar für beliebige weitere Dienste/Module

## Nutzung

1. **Konfiguration prüfen/anpassen:**
   - Siehe `config.json` im selben Verzeichnis.
   - Beispiel:
     ```json
     {
       "modules": [
         {
           "name": "code-normalizer",
           "start": "node scripts/watch-and-normalize.js",
           "watch": true
         }
       ]
     }
     ```

2. **Supervisor starten:**
   ```sh
   node modules-meta/core.supervisor/supervisor.js
   ```

3. **Module werden automatisch gestartet und überwacht.**
   - Logs erscheinen im Terminal.
   - Bei Absturz eines Moduls mit `watch: true` wird es automatisch neu gestartet.

## Erweiterung
- Weitere Module können in `config.json` hinzugefügt werden (z.B. Build, Test, KI-Bridge, ...).
- Die Überwachung/Steuerung kann beliebig ausgebaut werden (z.B. Status-API, Web-UI, Notification).

---

**Dieses Setup sorgt für maximale Automatisierung, Konsistenz und Sicherheit beim parallelen Arbeiten mit Gemini CLI, Cascade und anderen Tools.**

> _"Supervisor = Dirigent, Normalizer = Orchester, du = Komponist!"_
