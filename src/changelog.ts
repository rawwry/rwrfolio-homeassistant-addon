export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  badge?: 'Aktuell' | 'Major' | 'Feature';
  changes: {
    type: 'feat' | 'fix' | 'ui' | 'perf';
    text: string;
  }[];
}

export const APP_VERSION = '0.4.1';

export const CHANGELOG_DATA: ChangelogRelease[] = [
  {
    version: '0.4.1',
    date: '01.09.2026',
    title: 'Steuer-Berechnung (FIFO) & Interface-Bereinigung',
    badge: 'Aktuell',
    changes: [
      {
        type: 'feat',
        text: 'Steuer- & Haltedauer-Rechner (FIFO § 23 EStG): Detaillierte Haltefristen (365 Tage), steuerfreie Tranchen und Export für die Steuererklärung.',
      },
      {
        type: 'ui',
        text: 'Branding auf rwr/folio angepasst und Menüleiste bereinigt.',
      },
      {
        type: 'ui',
        text: 'Analysen-Ansicht auf Kern-Charts und Asset-Details fokussiert.',
      },
    ],
  },
  {
    version: '0.4.0',
    date: '01.09.2026',
    title: 'Einstellungen, Light & Dark Mode, E-Mail Alarme & GitHub Audit',
    changes: [
      {
        type: 'feat',
        text: 'Neues Einstellungsmenü mit Benutzerprofil (Benutzername, E-Mail und optionaler lokaler Passwortschutz).',
      },
      {
        type: 'ui',
        text: 'Vollständiger Hell- & Dunkelmodus (Light & Dark Theme) inklusive Diskretionsmodus zum Ausblenden von Beträgen.',
      },
      {
        type: 'feat',
        text: 'E-Mail & SMTP Benachrichtigungskonfiguration für Preisalarme und tägliche Portfolioberichte inklusive Test-E-Mail Funktion.',
      },
      {
        type: 'feat',
        text: 'GitHub Privacy Audit & Schutz: .gitignore optimiert, sodass keine privaten Datenbanken (*.db), CSVs oder Schlüssel im öffentlichen GitHub-Repo landen.',
      },
    ],
  },
  {
    version: '0.3.0',
    date: '01.09.2026',
    title: 'Samba-Share Integration (/share/rwrfolio)',
    changes: [
      {
        type: 'feat',
        text: 'Dauerhafte SQLite-Datenbank wird standardmäßig im Home Assistant Samba-Share unter /share/rwrfolio/db/rwrfolio.db gespeichert.',
      },
      {
        type: 'feat',
        text: 'Automatisches CSV-Archiv: Alle importierten CSV-Dateien (z. B. Crypto.com Exporte) werden mit Zeitstempel im Samba-Share unter /share/rwrfolio/imported/ abgelegt.',
      },
      {
        type: 'feat',
        text: 'Home Assistant Add-on Berechtigungen um map: - share:rw erweitert, inklusive automatischer Ordner-Erstellung und Migrationsroutine.',
      },
    ],
  },
  {
    version: '0.2.1',
    date: '01.09.2026',
    title: 'Typografie & Layout Feinschliff',
    changes: [
      {
        type: 'ui',
        text: 'Layout-Fix bei langen Asset-Namen: Einzeiliges Wrapping verhindert Zeilensprünge bei Kryptowährungen mit langen Bezeichnungen, inkl. Tooltip beim Hovern.',
      },
      {
        type: 'ui',
        text: 'Gewinn/Verlust Spalte optimiert: Prozentuale Rendite steht nun prominent oben, der absolute Euro-Betrag dezent darunter.',
      },
    ],
  },
  {
    version: '0.2.0',
    date: '01.09.2026',
    title: 'SQLite-Datenbank & Home Assistant OS Add-on',
    badge: 'Feature',
    changes: [
      {
        type: 'feat',
        text: 'Vollständige SQLite-Datenbankpersistenz für unbegrenzten Datenerhalt auch bei Neustarts und Container-Updates.',
      },
      {
        type: 'feat',
        text: 'Home Assistant OS Add-on Konfiguration (config.yaml, Dockerfile, Ingress Support für die Seitenleiste).',
      },
      {
        type: 'feat',
        text: 'Echtzeit-Synchronisation zwischen Frontend und lokalem Express/SQLite Backend mit Statusindikator in der Navigation.',
      },
    ],
  },
  {
    version: '0.1.0',
    date: '31.08.2026',
    title: 'Initialer Release: Krypto DCA & Portfolio Tracker',
    changes: [
      {
        type: 'feat',
        text: 'Automatischer Import von Crypto.com CSV-Transaktionsexporten mit Erkennung von Kauf, Verkauf, Staking Rewards und Cashbacks.',
      },
      {
        type: 'feat',
        text: 'DCA-Durchschnittskaufpreis-Berechnung und Echtzeit-Portfolio-Kennzahlen.',
      },
      {
        type: 'feat',
        text: 'Live-Kursabfrage über Krypto-APIs mit automatischem Fallback und manueller Kursanpassung.',
      },
      {
        type: 'feat',
        text: 'Interaktive Allokations- und Rendite-Charts sowie CSV/JSON Backup-Export.',
      },
    ],
  },
];
