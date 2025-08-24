# KI-Schulbüro - Intelligenter Chatbot für das Gymnasium Alster

Ein fortschrittlicher Chatbot mit KI-gestützten Antworten, PDF-Integration, intelligenten Kontext-Features und vollständigem Termin-Management.

## 🚀 **Neue intelligente Features**

### 1. **Kontext-Bewusstsein** 🧠
- **Gesprächsverlauf**: Das System merkt sich den kompletten Chat-Verlauf
- **Session-Management**: Jede Konversation wird mit einer eindeutigen Session-ID verfolgt
- **Intelligente Referenzen**: Der Bot kann auf vorherige Nachrichten Bezug nehmen
- **Automatische Bereinigung**: Alte Sessions werden nach 24 Stunden gelöscht

### 2. **Personalisierung** 👤
- **Namen-Erkennung**: Automatische Erkennung von "Ich heiße..." oder "My name is..."
- **Persönliche Ansprache**: Der Bot verwendet den Namen in seinen Antworten
- **Profil-Editor**: Benutzer können ihren Namen über den Profil-Button bearbeiten
- **Session-Persistenz**: Persönliche Einstellungen bleiben über die Session erhalten

### 3. **Mehrsprachigkeit** 🌍
- **Automatische Spracherkennung**: Erkennt Deutsch, Englisch, Französisch und Türkisch
- **Sprachauswahl-Button**: Manuelle Sprachauswahl über das 🌍-Symbol
- **Kontextuelle Antworten**: Antwortet in der erkannten/gewählten Sprache
- **Unterstützte Sprachen**:
  - 🇩🇪 Deutsch (Standard)
  - 🇺🇸 English
  - 🇫🇷 Français
  - 🇹🇷 Türkçe

### 4. **Termin-Management** 📅 **NEU!**
- **Verfügbarkeitsprüfung**: Sofortige Anzeige freier Termine für jedes Datum
- **Termin-Buchung**: Direkte Buchung über den Chat oder das Interface
- **Termin-Verwaltung**: Anzeige, Bearbeitung und Stornierung eigener Termine
- **Intelligente Zeitslots**: Automatische Verwaltung von 8:00-16:00 Uhr (Mo-Fr), 9:00-12:00 Uhr (Sa)
- **Session-basierte Verwaltung**: Jeder Benutzer sieht nur seine eigenen Termine

## 📋 **Installation & Setup**

### Voraussetzungen
- Node.js 18+
- OpenAI API Key
- Weaviate (optional, Fallback verfügbar)

### Umgebungsvariablen
```bash
OPENAI_API_KEY=your_openai_api_key
WEAVIATE_HOST=your_weaviate_host
WEAVIATE_API_KEY=your_weaviate_api_key
WEAVIATE_CLASS=Gymnasiumalsterschulbuero
```

### Installation
```bash
npm install
npm start
```

## 🔧 **API-Endpunkte**

### Chat
```http
POST /chat
Content-Type: application/json

{
  "message": "Deine Nachricht",
  "memory": "Vorherige Nachrichten",
  "sessionId": "eindeutige_session_id",
  "userProfile": {
    "name": "Max",
    "language": "de"
  }
}
```

### Termin-Management **NEU!**
```http
# Verfügbarkeit prüfen
GET /appointments/availability/:date

# Verfügbarkeit für Zeitraum
GET /appointments/availability?start=2025-08-26&end=2025-09-02

# Termin buchen
POST /appointments/book
{
  "userName": "Max Mustermann",
  "date": "2025-08-26",
  "time": "10:00",
  "reason": "Beratungsgespräch",
  "sessionId": "session_id"
}

# Termin stornieren
DELETE /appointments/:id
{
  "sessionId": "session_id"
}

# Benutzer-Termine abrufen
GET /appointments/user/:sessionId

# Alle Termine (Admin)
GET /appointments/all
```

### Response
```json
{
  "reply": "Bot-Antwort",
  "context": {
    "language": "de",
    "userName": "Max",
    "sessionDuration": 5,
    "conversationLength": 10
  }
}
```

## 🎯 **Verwendung**

### 1. **Chatbot öffnen**
- Klicke auf das Chatbot-Symbol (rechts unten)
- Akzeptiere die Datenschutzrichtlinien

### 2. **Sprache wählen**
- Klicke auf 🌍 im Header
- Wähle deine gewünschte Sprache

### 3. **Profil bearbeiten**
- Klicke auf 👤 im Header
- Gib deinen Namen ein
- Der Bot wird dich persönlich ansprechen

### 4. **Termine verwalten** **NEU!**
- Klicke auf 📅 im Header
- **Verfügbarkeit prüfen**: Wähle ein Datum und prüfe freie Termine
- **Termin buchen**: Wähle Datum, Uhrzeit und Grund
- **Meine Termine**: Sieh alle deine gebuchten Termine
- **Termin stornieren**: Storniere Termine direkt im Interface

### 5. **Kontext nutzen**
- Der Bot merkt sich deine Anfragen
- Du kannst auf vorherige Themen Bezug nehmen
- Beispiel: "Was haben wir vorhin besprochen?"

## 🔍 **Technische Details**

### Kontext-Management
```javascript
class ConversationContext {
    constructor() {
        this.conversations = new Map(); // sessionId -> conversation data
        this.userProfiles = new Map();  // sessionId -> user profile
    }
    
    addMessage(sessionId, role, message, timestamp)
    getContext(sessionId, maxMessages)
    updateUserProfile(sessionId, profileData)
    setLanguage(sessionId, language)
}
```

### Termin-Management **NEU!**
```javascript
class AppointmentManager {
    constructor() {
        this.appointments = new Map(); // appointmentId -> appointment data
        this.availability = new Map(); // date -> available slots
    }
    
    getAvailableSlots(date)
    bookAppointment(userName, date, time, reason, sessionId)
    cancelAppointment(appointmentId, sessionId)
    getUserAppointments(sessionId)
}
```

### Sprachdetektion
- **RegEx-basiert**: Erkennt Schlüsselwörter in verschiedenen Sprachen
- **Fallback**: Standardmäßig Deutsch
- **Dynamisch**: Kann während der Konversation geändert werden

### Personalisierung
- **Automatisch**: Erkennt Namen aus der Nachricht
- **Manuell**: Über den Profil-Editor
- **Persistent**: Bleibt über die gesamte Session erhalten

## 🚀 **Deployment**

### Lokale Entwicklung
```bash
npm run dev
# Server läuft auf http://localhost:3001
```

### Scalingo
```bash
git push scalingo main
# Automatisches Deployment mit Umgebungsvariablen
```

## 🔧 **Troubleshooting**

### Kontext funktioniert nicht
- Prüfe, ob `sessionId` korrekt gesendet wird
- Überprüfe die Browser-Konsole auf Fehler
- Stelle sicher, dass der Server läuft

### Sprache wird nicht erkannt
- Verwende den Sprachauswahl-Button 🌍
- Schreibe eine Nachricht in der gewünschten Sprache
- Prüfe die Browser-Konsole auf Sprach-Informationen

### Personalisierung funktioniert nicht
- Verwende den Profil-Button 👤
- Gib deinen Namen ein und klicke "Speichern"
- Der Bot sollte dich dann persönlich ansprechen

### Termin-Management funktioniert nicht **NEU!**
- Prüfe, ob der 📅-Button im Header sichtbar ist
- Überprüfe die Browser-Konsole auf API-Fehler
- Stelle sicher, dass alle Felder ausgefüllt sind
- Prüfe, ob das Datum in der Zukunft liegt

## 📚 **Weitere Features**

- **PDF-Integration**: Speichern und Abrufen von Dokumenten
- **RAG-System**: Intelligente Antworten basierend auf Schuldaten
- **Fallback-System**: Funktioniert auch ohne Weaviate
- **Responsive Design**: Optimiert für alle Geräte
- **Session-Management**: Persistente Konversationen
- **Termin-System**: Vollständiges Buchungs- und Verwaltungssystem

## 🤝 **Beitragen**

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere deine Änderungen
4. Erstelle einen Pull Request

## 📄 **Lizenz**

Dieses Projekt ist Teil des KI-Schulbüro Systems des Gymnasium Alster.

