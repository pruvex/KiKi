# KiKi Test-App

## Automatisierte End-to-End-Tests für die Electron+React-App „KiKi“

### Features
- Automatischer Start des Dev-Servers (Port 5175, Port-Freigabe inklusive)
- Playwright-Tests für Electron-Fenster und React-UI
- CI/CD-Integration via GitHub Actions (siehe `.github/workflows/playwright.yml`)
- Automatische Ressourcenbereinigung

### So startest du die Tests lokal

```sh
cd Test-App
start-test-app.cmd
```

### CI/CD (GitHub Actions)
- Bei jedem Commit und Pull-Request werden die Tests automatisch ausgeführt.
- Ergebnisse und Screenshots findest du im jeweiligen Workflow-Run auf GitHub.

### Neue Testfälle anlegen
- Lege pro Modul eine eigene `.spec.ts`-Datei im `tests/`-Ordner an.
- Nutze Playwright-API und prüfe auf sichtbare UI-Elemente oder Interaktionen.

### Troubleshooting
- Stelle sicher, dass Port 5175 frei ist (wird im Skript automatisch erledigt).
- Prüfe Logs und Screenshots im Fehlerfall.

---

*Diese Testumgebung ist agentisch und vollautomatisch vorbereitet – du kannst dich auf die Entwicklung und das Hinzufügen neuer Testfälle konzentrieren!*
