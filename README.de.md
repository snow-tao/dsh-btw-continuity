# DSH BTW Continuity

Fortlaufende Nebenfragen in DeepSeek Harness: ein chronologisches Panel pro Sitzung, direkte Folgefragen und keine Unterbrechung der Hauptaufgabe.

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · Deutsch · [Русский](README.ru.md) · [Português](README.pt.md)

> **BTW Continuity ist eine unabhängige Änderung von [MichengAI DSH BTW 1.3.10](https://github.com/MichengAI/dsh-btw)**, lizenziert unter Apache-2.0 und nicht von DeepSeek AI oder MichengAI unterstützt. Siehe [NOTICE.md](NOTICE.md) für Herkunft und Änderungen.

## Funktionen

- Alle BTW-Fragen und Antworten einer Sitzung erscheinen in einem einzigen chronologischen Panel.
- Das untere Eingabefeld ermöglicht direkte Folgefragen: Enter sendet, Umschalt+Enter fügt eine neue Zeile ein.
- Das Feld beginnt einzeilig, wächst auf bis zu vier Zeilen und scrollt danach intern; nach dem Senden wird es wieder einzeilig.
- X blendet das Panel nur aus; die nächste Frage stellt den sichtbaren Verlauf wieder her.
- Das Papierkorbsymbol löscht den BTW-Verlauf der aktuellen Sitzung und beginnt neu.
- Antworten bleiben standardmäßig außerhalb der Hauptunterhaltung; eine Rückmeldung erfolgt nur bei ausdrücklicher Anfrage über `send_message`.
- Schreibgeschützte Antworten, Fragen zu ausgewähltem Text, Markdown, Formeln, Kopieren und acht Sprachen.

## Aktuelle Oberfläche

![BTW-Continuity-Einzelpanel mit Verlauf und Eingabefeld für Folgefragen](assets/screenshots/btw-continuity-panel.webp)

## Voraussetzungen

- DeepSeek Harness `>=0.2.0-rc.1 <0.3.0-0`
- Node.js 22+
- Ein konfigurierter Modellanbieter

**Nicht zusammen mit `@michengai/dsh-btw` installieren oder aktivieren**, da beide `/btw` registrieren.

## Installation

Ersetzen Sie `desktop` durch Ihr tatsächliches Profil:

```bash
dsh plugin --profile desktop add dsh-btw-continuity@latest --registry=https://registry.npmjs.org/
```

Falls die Aktivierung nicht automatisch erfolgt, laden Sie die Desktop-App neu oder starten Sie den entsprechenden DSH-Dienst neu.

## Verwendung

```text
/btw Fassen Sie den aktuellen Vorschlag in einem Satz zusammen
```

Sie können auch `btw` im Menü `/` wählen oder **BTW fragen** auf ausgewählten Text anwenden.

Erweitern Sie das Panel und verwenden Sie das untere Eingabefeld. Folgefragen im Panel und `/btw` verwenden denselben Verlauf.

| Aktion | Verhalten |
| --- | --- |
| X | Blendet das Panel aus, ohne den Verlauf zu löschen; die nächste Frage stellt ihn wieder her. |
| Papierkorb | Löscht den gesamten BTW-Verlauf dieser Sitzung und entfernt das Panel. |
| Kopieren | Kopiert das ursprüngliche Markdown der entsprechenden Antwort. |

## Verlauf und Datenschutz

- Spätere Anfragen enthalten abgeschlossene BTW-Runden und den Kontext der Hauptsitzung, was die Token-Nutzung erhöhen kann.
- Anfragen gehen nur an den konfigurierten Modellanbieter; es wird kein zusätzlicher Drittempfänger eingeführt.
- Der Verlauf liegt im Host-Speicher und geht beim Neustart des Hosts verloren. Kopieren Sie Antworten, die Sie dauerhaft behalten möchten.

## Konfiguration

Unter **Plugins → BTW Continuity → Konfigurieren** können Sie zusätzliche Tools außer `send_message` (eines pro Zeile) erlauben und den integrierten Prompt ersetzen. Standardmäßig sind nur Textantworten aktiviert.

## Deinstallation

```bash
dsh plugin --profile desktop remove dsh-btw-continuity
```

## Entwicklung

```bash
npm ci --ignore-scripts
npm run check
```

## Lizenz

[Apache-2.0](LICENSE) · [Herkunft und Änderungen](NOTICE.md)
