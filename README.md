# Salamon – AI‑gestützter Yu‑Gi‑Oh!™‑Deck‑Generator

Salamon dreht sich in erster Linie um dein **Autocomplete‑Deck**: Gib unvollständige Kartenzüge oder Basislisten ein und erhalte in Sekundenschnelle vollständige, spielbare Decks, die optimal aufeinander abgestimmt sind. Zusätzlich steht dir ein **RAG‑gestützter Chat** zur Verfügung, der auf die Karten‑DB und das Regelwerk zugreifen kann, um bei Bedarf weiterführende Fragen zu beantworten.

---
## Kern‑Features

| Feature                  | Beschreibung                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| **Deck‑Generator**       | Erstelle komplette Main‑, Extra‑ und Side‑Decks anhand deines Spielstils oder einer Startkarte. |
| **Autocomplete‑Deck**    | Lässt unvollständige Listen automatisch vervollständigen (ARM‑basierte Suggestions).            |
| **RAG‑Chat**             | Chat‑Interface mit Zitatenachweisen aus Karten‑DB & Rulebook.                                   |
| **Graph‑Visualisierung** | Interaktive Graphen zeigen Synergien.                                                           |
| **Analytics**            | Meta‑Statistiken, Matchup‑Daten, Hand‑Ranges u. v. m.                                           |
| **Card Details**         | Effekt Kategorien und Bäume.                                                                    |

---

## Tech‑Stack

- **Next.js 14** mit **React 19 (Canary)**
- **TypeScript**, **Tailwind CSS**, **shadcn/ui**
- **Gemini** (Google Generative AI) & **Azure AI Search** für RAG
- **Azure AI Search** als Vektor‑Index (Cards & Rulebook)
- **SQLite** (Persistence) & **FastAPI**‑Backend
- **Recharts** & **React‑3D‑Force‑Graph** für Visualisierung

> ⚠️ React 19 ist experimentell. Darum **muss** `npm install --force` ausgeführt werden.

---

## Schnellstart

```bash
# 1. Repository klonen
git clone https://github.com/<user>/salamon.git
cd salamon

# 2. Installation von npm und Node.Js via vscode Extensions oder per manueller Installation

# 3. .env.local einfügen ins Root-Verzeichnis

# 4. Abhängigkeiten installieren (React 19 erfordert --force)
npm install --force

# 5. Dev‑Server starten
npm run dev
# öffne http://localhost:3000
```



---

## Environment‑Variablen (`.env`)

| Variable                        | Beispielwert                                 | Zweck                               |
| ------------------------------- |----------------------------------------------| ----------------------------------- |
|                                 |                                              |                                     |
| **Azure Cognitive Search**      |                                              |                                     |
| `AZURE_SEARCH_ENDPOINT`         | `https://salamonaisearch.search.windows.net` | Endpunkt des Azure Search Service   |
| `AZURE_SEARCH_KEY`              | `api-key`                                    | Admin‑/Query‑Key für Azure Search   |
| `AZURE_SEARCH_INDEX_NAME`       | `salamon-indexed-ygo-cards`                  | Karten‑Embed‑Index                  |
| `AZURE_SEARCH_INDEX_NAME_RULES` | `salamon-indexed-ygo-rulebook`               | Regelbuch‑Embed‑Index               |
| `AZURE_SEARCH_VECTOR_FIELD`     | `text-vector`                                | Feldname der Vektor‑Embeddings      |
| `AZURE_SEARCH_CONTENT_FIELD`    | `chunk`                                      | Feldname des Original­texts (Chunk) |
| **Google Generative AI**        |                                              |                                     |
| `GOOGLE_GENERATIVE_AI_API_KEY`  | `api-key…`                                   | API‑Key für Gemini‑Modelle          |
| `GOOGLE_VERTEX_PROJECT`         | `spotahead`                                  | GCP‑Projekt‑ID für Vertex AI        |

> Nutze die mitgelieferte `.env`, passe aber **mindestens** die geheimen Schlüssel an.
---
## Lizenz

MIT – siehe `LICENSE`. 



---
## Azure Setup
Unser aktueller Academic Azure Account läuft Ende Mai 2025 aus.
Sollten Sie es bis dahin noch nicht geschafft haben sollten, ist im nachfolgenden beschrieben, wie Sie ihr Azure aufsetzen müssen um den Salamon Wizard zu verwenden.

## 1. Ressourcengruppe erstellen
- Neues Azure-Portal öffnen
- Ressourcengruppe anlegen

## 2. Azure Storage Account anlegen
- Im Azure-Portal "Storage Account" erstellen
- Konfigurationsdetails eingeben
- Ressourcengruppe aus Schritt 1 auswählen

## 3. Container erstellen
- Im Storage Account zwei Container anlegen:
  - Einer für Yu-Gi-Oh Karten
  - Einer für das Regelwerk

## 4. Daten hochladen
- **4.1 Karten hochladen:**
  - Link: [Pre-processed YGO Cards](https://www.icloud.com/iclouddrive/0dfclQt8ABElDEG8QQTGk8FGg#pre-processed-ygo-cards)
  - Daten in den entsprechenden Container hochladen
- **4.2 Regelwerk hochladen:**
  - Link: [YGO Rulebook](https://www.yugioh-card.com/en/rulebook/)
  - Regelwerk herunterladen und in den entsprechenden Container hochladen

## 5. Azure OpenAI anlegen
- **5.1** Azure AI Foundry Portal öffnen
- **5.2** Zu "Bereitstellungen" navigieren
- **5.3** "Modell bereitstellen" klicken (Basismodelle)
- **5.4** Filter auf Embedding Modelle setzen
- **5.5** "text-embedding-ada-002" auswählen und Bereitstellung bestätigen

## 6. Azure AI Search anlegen
- **6.1** AI Search Ressource erstellen und Tarif auswählen (empfohlen: Basis Tier)
- **6.2** Innerhalb der AI Search:
  - **6.2.1** "Importieren und Vektorisieren von Daten" klicken
  - **6.2.2** Azure Blob Storage auswählen
  - **6.2.3** Für YGO Karten:
    - **6.2.3.1** Entsprechenden Storage Account und Blob Container auswählen
    - **6.2.3.2** Analysemodus auf JSON setzen
    - **6.2.3.3** Vektorisierende Spalte "SearchableText" auswählen
    - **6.2.3.4** OpenAI Service aus Schritt 5 auswählen
    - **6.2.3.5** Modellimplementierung "text-embedding-ada-002" auswählen
  - **6.2.4** Für YGO Regelwerk:
    - **6.2.4.1** Entsprechenden Storage Account und Blob Container auswählen
    - **6.2.4.2** Analysemodus auf Default setzen
    - **6.2.4.3** OpenAI Service aus Schritt 5 auswählen
    - **6.2.4.4** Modellimplementierung "text-embedding-ada-002" auswählen

## 7. Konfiguration abschließen
- **7.** AI Search URL austauschen
- **8.** AI Search Primary Key austauschen
- **9.** AI Search Index Bezeichnungen austauschen
- **10.** Azure OpenAI Endpoint austauschen
- **11.** Azure OpenAI Keys austauschen




