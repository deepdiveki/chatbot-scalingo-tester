# 🤖 Gymnasium Alster Chatbot Widget

Ein einbettbarer Chatbot für das Gymnasium Alster, der als Widget in andere Websites integriert werden kann.

## ✨ Features

- **Einfach einbettbar**: Nur ein Script-Tag erforderlich
- **Vollständig anpassbar**: Verschiedene Themes, Positionen und Sprachen
- **Responsive Design**: Funktioniert auf allen Geräten
- **Datenschutzkonform**: Integrierte DSGVO-konforme Datenschutzrichtlinien
- **Moderne UI**: Schönes, benutzerfreundliches Design
- **API-Integration**: Verbindet sich mit der Gymnasium Alster Chatbot-API

## 🚀 Schnellstart

### 1. Widget-Datei einbinden

Fügen Sie das Widget-Script in Ihre HTML-Datei ein:

```html
<script src="chatbot-widget.js"></script>
```

### 2. Widget initialisieren

```javascript
ChatbotWidget.init({
    apiUrl: 'https://your-api.com',
    position: 'bottom-right',
    theme: 'default',
    language: 'de'
});
```

### 3. Fertig!

Der Chatbot erscheint automatisch als schwebender Button auf Ihrer Website.

## 📋 Vollständiges Beispiel

```html
<!DOCTYPE html>
<html>
<head>
    <title>Meine Website</title>
</head>
<body>
    <h1>Willkommen auf meiner Website</h1>
    
    <!-- Chatbot Widget einbinden -->
    <script src="chatbot-widget.js"></script>
    
    <script>
        // Widget initialisieren
        ChatbotWidget.init({
            apiUrl: 'https://your-api.com',
            position: 'bottom-right',
            theme: 'default',
            language: 'de',
            showLogo: true,
            onMessage: function(sender, message) {
                console.log(sender + ': ' + message);
            },
            onOpen: function() {
                console.log('Chat geöffnet');
            },
            onClose: function() {
                console.log('Chat geschlossen');
            }
        });
    </script>
</body>
</html>
```

## ⚙️ Konfigurationsoptionen

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|--------------|
| `apiUrl` | string | `'http://localhost:3001'` | URL zu Ihrer Chatbot-API |
| `position` | string | `'bottom-right'` | Position des Widgets |
| `theme` | string | `'default'` | Design-Theme |
| `language` | string | `'de'` | Sprache des Widgets |
| `showLogo` | boolean | `true` | Logo anzeigen |
| `zIndex` | number | `1000` | CSS z-index |
| `onMessage` | function | `null` | Callback für neue Nachrichten |
| `onOpen` | function | `null` | Callback wenn Chat geöffnet wird |
| `onClose` | function | `null` | Callback wenn Chat geschlossen wird |

### Verfügbare Positionen

- `'bottom-right'` - Unten rechts (Standard)
- `'bottom-left'` - Unten links
- `'top-right'` - Oben rechts
- `'top-left'` - Oben links

### Verfügbare Themes

- `'default'` - Standard-Theme (blau)
- `'dark'` - Dunkles Theme
- `'light'` - Helles Theme

### Verfügbare Sprachen

- `'de'` - Deutsch
- `'en'` - English

## 🔧 API-Methoden

### Widget steuern

```javascript
// Widget öffnen
ChatbotWidget.open();

// Widget schließen
ChatbotWidget.close();

// Widget entfernen
ChatbotWidget.destroy();
```

### Nachrichten senden

```javascript
// Nachricht an den Bot senden
ChatbotWidget.sendMessage('Hallo!');
```

### Status abfragen

```javascript
// Prüfen ob Chat geöffnet ist
if (ChatbotWidget.isOpen()) {
    console.log('Chat ist geöffnet');
}
```

## 📱 Responsive Design

Das Widget passt sich automatisch an verschiedene Bildschirmgrößen an:

- **Desktop**: 350x500px
- **Tablet**: Automatische Anpassung
- **Mobile**: Optimiert für Touch-Bedienung

## 🎨 Anpassung des Designs

### Themes ändern

```javascript
ChatbotWidget.init({
    theme: 'dark' // oder 'light'
});
```

### Eigene CSS-Styles

Sie können das Widget mit CSS anpassen:

```css
#chatbot-widget {
    /* Ihre eigenen Styles */
}

#chatbot-widget button {
    /* Button-Styles anpassen */
}
```

## 🔒 Datenschutz

Das Widget ist DSGVO-konform und zeigt automatisch:

- Datenschutzrichtlinien beim ersten Öffnen
- Akzeptieren-Button für Datenschutz
- Link zu den vollständigen Datenschutzrichtlinien

## 🌐 Browser-Unterstützung

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 📁 Projektstruktur

```
chatbot-scalingo-tester/
├── app.js                    # Backend-Server
├── public/
│   ├── chatbot-widget.js    # Widget-Script
│   ├── widget-example.html  # Beispiel-Integration
│   ├── chatbot.js          # Ursprünglicher Chatbot
│   └── index.html          # Ursprüngliche Demo-Seite
├── package.json
└── README.md
```

## 🧪 Testen

1. Starten Sie den Server: `npm start`
2. Öffnen Sie `public/widget-example.html` im Browser
3. Testen Sie verschiedene Konfigurationen
4. Integrieren Sie das Widget in Ihre eigene Website

## 📞 Support

Bei Fragen oder Problemen:

- **Email**: info@deepdive-ki.de
- **Website**: https://www.deepdive-ki.de
- **Datenschutz**: https://www.deepdive-ki.de/datenschutz

## 📄 Lizenz

Dieses Projekt ist für das Gymnasium Alster entwickelt. Alle Rechte vorbehalten.

---

**Entwickelt von DeepDive KI** 🤖

