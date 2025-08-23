# 📄 PDF-Integration in den Chatbot

Diese Anleitung erklärt, wie du PDF-Links in den Chatbot einbindest, damit Benutzer nach Dokumenten fragen und direkten Zugriff darauf erhalten können.

## 🚀 Schnellstart

### 1. PDF-Upload-Seite öffnen
Gehe zu `/pdf-upload.html` in deinem Browser, um PDF-Links hinzuzufügen.

### 2. PDF-Informationen eingeben
- **Titel**: Beschreibender Name des Dokuments (z.B. "Anmeldebogen Klassenreise")
- **PDF-URL**: Direkter Link zur PDF-Datei
- **Inhalt** (optional): Textinhalt für bessere Suche

### 3. Speichern
Klicke auf "PDF speichern" - das Dokument wird automatisch in Weaviate gespeichert.

## 🔧 Technische Details

### Weaviate-Schema
Die Weaviate-Klasse wurde um folgende Properties erweitert:
- `fileUrl`: URL zur PDF-Datei
- `title`: Titel des Dokuments
- `source`: Wird auf 'pdf' gesetzt

### API-Endpunkte
- **POST /pdf**: PDF-Link speichern
- **POST /chat**: Chat mit PDF-Integration (automatisch)

### Frontend-Integration
PDF-Links werden im Chat automatisch schön formatiert angezeigt:
- 📄 Dokumenttitel
- "PDF öffnen" Button
- Moderne Karten-Design

## 📋 Verwendung im Chat

### Beispiel-Fragen
- "Wo finde ich den Anmeldebogen für die Klassenreise?"
- "Kannst du mir das Formular für die Schulbuchbestellung zeigen?"
- "Ich brauche den Elternbrief vom letzten Monat"

### Automatische Antworten
Der Chatbot erkennt PDF-Links und antwortet etwa so:
> "Hier ist der Anmeldebogen für die Klassenreise: 📄 Anmeldebogen Klassenreise [PDF öffnen]"

## 🔗 Link-Anforderungen

### ✅ Unterstützte Formate
- **iCloud**: `https://www.icloud.com/iclouddrive/...`
- **Google Drive**: `https://drive.google.com/file/d/.../view`
- **Dropbox**: `https://www.dropbox.com/s/.../document.pdf`
- **Direkte URLs**: `https://example.com/document.pdf`

### ⚠️ Wichtige Hinweise
1. **Öffentlicher Zugriff**: Der Link muss ohne Login funktionieren
2. **Direkte Auslieferung**: Browser sollte PDF öffnen/herunterladen
3. **Keine Zwischenseiten**: Vermeide Weiterleitungen

### 🔍 Link testen
1. Öffne den Link in einem Inkognito-Fenster
2. PDF sollte sich öffnen oder herunterladen
3. Falls nicht: Nutze "Direktlink kopieren" oder lade PDF herunter

## 🛠️ Erweiterte Funktionen

### Semantische Suche
Falls du den Textinhalt hinzufügst:
- Weaviate erstellt Vektoren für bessere Suche
- Benutzer finden Dokumente auch über Inhaltsbeschreibungen
- Höhere Trefferquote bei relevanten Fragen

### Batch-Upload
Für mehrere PDFs kannst du die API direkt nutzen:
```bash
curl -X POST /pdf \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dokumenttitel",
    "fileUrl": "https://example.com/document.pdf",
    "content": "Optionaler Textinhalt"
  }'
```

## 🐛 Troubleshooting

### PDF wird nicht gefunden
1. Prüfe, ob der Link in Weaviate gespeichert wurde
2. Teste den Link in einem neuen Browser-Fenster
3. Stelle sicher, dass der Link öffentlich ist

### Chatbot zeigt PDF nicht an
1. Prüfe die Weaviate-Verbindung
2. Schaue in die Server-Logs
3. Teste mit einem einfachen PDF-Link

### Weaviate-Fehler
1. Prüfe die Umgebungsvariablen
2. Stelle sicher, dass der Weaviate-Server läuft
3. Schaue in die Server-Logs für Details

## 📚 Code-Beispiele

### PDF in Weaviate speichern
```javascript
await savePdfToWeaviate(
  'Anmeldebogen Klassenreise',
  'https://www.icloud.com/iclouddrive/...',
  'Optionaler Textinhalt'
);
```

### PDF-Links im Chat formatieren
```javascript
// Automatisch durch formatMessage() Funktion
message.replace(
  /PDF:\s*(.*?)\s*\[(https?:\/\/[^\s\]]+)\]/g,
  '<div class="pdf-card">📄 $1 <a href="$2">PDF öffnen</a></div>'
);
```

## 🔄 Updates und Wartung

### PDF entfernen
- Aktuell nur über Weaviate-Admin-Interface möglich
- Oder alle PDFs löschen und neu hochladen

### Schema-Änderungen
- Neue Properties werden automatisch hinzugefügt
- Bestehende Daten bleiben erhalten

### Backup
- Weaviate-Daten regelmäßig sichern
- PDF-Links in separater Datei dokumentieren

## 📞 Support

Bei Problemen oder Fragen:
1. Schaue in die Server-Logs
2. Prüfe die Weaviate-Verbindung
3. Teste mit einfachen Beispielen
4. Kontaktiere das Entwicklungsteam

---

**Hinweis**: Diese Integration funktioniert nur, wenn Weaviate korrekt konfiguriert ist und läuft.
