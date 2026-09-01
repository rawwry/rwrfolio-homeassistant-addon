# rwrfolio - Home Assistant OS Add-on

Krypto Portfolio- und DCA-Tracker mit **persistenter SQLite-Datenbank** und Live-Kursen für Home Assistant OS.

---

## 🚀 Installation in Home Assistant OS

Du kannst diese App direkt als **lokales Add-on** in Home Assistant OS installieren:

1. **Dateien kopieren:**
   - Erstelle auf deinem Home Assistant (z. B. per Samba Share oder SSH & Web Terminal) einen Ordner unter:
     `/addons/local/rwrfolio`
   - Kopiere alle Dateien dieses Repositories in diesen Ordner.

2. **Add-on im Home Assistant Store laden:**
   - Öffne in Home Assistant **Einstellungen > Add-ons > Add-on Store**.
   - Klicke oben rechts auf das Drei-Punkte-Menü `⋮` und wähle **Neu laden**.
   - Das Add-on **rwrfolio** erscheint nun unter der Kategorie *Lokal*.

3. **Installieren & Starten:**
   - Klicke auf **rwrfolio** und auf **Installieren**.
   - Aktiviere die Optionen **Beim Systemstart starten** und **In Seitenleiste anzeigen (Ingress)**.
   - Klicke auf **Starten** und anschließend auf **Benutzeroberfläche öffnen**.

---

## 💾 Persistente SQLite-Datenbank

- Die SQLite-Datenbank wird standardmäßig unter `/config/rwrfolio.db` abgelegt.
- Dadurch bleibt dein Portfolio bei Add-on-Updates, Container-Neustarts oder Home Assistant-Backups dauerhaft und sicher erhalten!
- Über die Weboberfläche kannst du jederzeit auch zusätzliche CSV- und JSON-Sicherungen herunterladen.
