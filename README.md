# SkupOS — jedno repo: aplikacja właściciela + portal klienta

- `/`        → aplikacja właściciela i pracowników (config.js: APP_MODE = "owner")
- `/klient/` → portal klienta (klient/config.js: APP_MODE = "client")

Kod jest jeden: `app.js` + `cloud.js` w głównym folderze. Każda poprawka działa od razu w obu aplikacjach.
Każda aplikacja ma własną nazwę i ikonę na telefonie (manifest.webmanifest).
