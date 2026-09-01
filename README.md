# rwrfolio - Home Assistant Add-on Repository

Krypto Portfolio & DCA Tracker mit **persistenter SQLite-Datenbank** im Samba-Share (`/share/rwrfolio`) und Live-Kursen für Home Assistant OS.

---

## 🚀 Installation als Repository im Home Assistant Add-on Store

1. Öffne dein **Home Assistant**.
2. Gehe zu **Einstellungen** > **Add-ons** > **Add-on Store** (unten rechts).
3. Klicke oben rechts auf das Drei-Punkte-Menü `⋮` > **Repositories**.
4. Füge die URL deines GitHub-Repositories ein:
   ```text
   https://github.com/rawwry/rwrfolio-homeassistant-addon
   ```
5. Klicke auf **Hinzufügen** und schließe das Dialogfenster.
6. Klicke erneut auf das Drei-Punkte-Menü `⋮` > **Neu laden** (oder drücke F5).
7. Das Add-on **rwrfolio** erscheint nun im Add-on Store. Klicke darauf und wähle **Installieren**.
8. Aktiviere **In Seitenleiste anzeigen** und starte das Add-on!

---

## 💾 Persistente Speicherung auf dem Raspberry Pi

- **SQLite-Datenbank:** Wird automatisch unter `/share/rwrfolio/db/rwrfolio.db` gespeichert.
- **CSV-Importe:** Werden automatisch mit Zeitstempel unter `/share/rwrfolio/imported/` archiviert.
- Über dein Home Assistant Samba-Share (`\\homeassistant\share\rwrfolio\`) hast du direkten Zugriff auf deine Backups und die Datenbank.
