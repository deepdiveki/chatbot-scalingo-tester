# KI-Schulbüro - Intelligenter Chatbot für das Gymnasium Alster

Ein fortschrittlicher Chatbot mit KI-gestützten Antworten, PDF-Integration und intelligenten Kontext-Features.

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

### 4. **Kontext nutzen**
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

## 📚 **Weitere Features**

- **PDF-Integration**: Speichern und Abrufen von Dokumenten
- **RAG-System**: Intelligente Antworten basierend auf Schuldaten
- **Fallback-System**: Funktioniert auch ohne Weaviate
- **Responsive Design**: Optimiert für alle Geräte
- **Session-Management**: Persistente Konversationen

## 🤝 **Beitragen**

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere deine Änderungen
4. Erstelle einen Pull Request

## 📄 **Lizenz**

Dieses Projekt ist Teil des KI-Schulbüro Systems des Gymnasium Alster.

