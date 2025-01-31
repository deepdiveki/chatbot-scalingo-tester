//Blocker mit Button und link für Datenschutz Accept
function showAcceptConditionsScreen(chatbotContainer, toggleButton) {
    // Check if this is the first time the chatbot is opened
    const isFirstTime = !sessionStorage.getItem("chatbotFirstTime");

    if (isFirstTime) {
        // Create an overlay container
        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "2000";

        // Create the message content
        const message = document.createElement("div");
        message.innerHTML = 'Willkommen zum Chatbot TES Mölln! <br> Bitte akzeptieren Sie unsere <a href="https://till-eulenspiegel-schule.lernnetz.de/datenschutz.html" target="_blank" style="color: #FF0000; text-decoration: underline;">Datenschutzrichtlinien</a>, um fortzufahren.';
        message.style.color = "#000";
        message.style.fontSize = "16px";
        message.style.textAlign = "center";
        message.style.marginBottom = "20px";

        // Create the dismiss button
        const button = document.createElement("button");
        button.innerText = "Akzeptieren";
        button.style.padding = "10px 20px";
        button.style.backgroundColor = "#FF0000";   //Farbe des Buttons
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.cursor = "pointer";

        // Append the message and button to the overlay
        overlay.appendChild(message);
        overlay.appendChild(button);

        // Append the overlay to the chatbot container
        chatbotContainer.appendChild(overlay);

        // Handle button click to remove the overlay
        button.addEventListener("click", () => {
            sessionStorage.setItem("chatbotFirstTime", "true"); // Mark as not the first time
            chatbotContainer.removeChild(overlay); // Remove the overlay
            chatbotContainer.style.display = "flex"; // Open the chatbot
        });
    } else {
        // If it's not the first time, show the chatbot directly
        chatbotContainer.style.display = "flex";
    }
}

// Speichert ob Chat geöffnet ist
function saveChatbotVisibilityState(isOpen) {
    sessionStorage.setItem("chatbotVisibility", isOpen ? "open" : "closed");
}
// Ruf den Status der Funktion darüber auf
function loadChatbotVisibilityState() {
    return sessionStorage.getItem("chatbotVisibility") === "open";
}

// Save messages to sessionStorage (jedes Mal wenn eine dazu kommt wird der aufgerufen)
function saveConversationToSessionStorage(message, sender) {

    let conversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];
    conversation.push({ sender, message });
    sessionStorage.setItem("chatbotConversation", JSON.stringify(conversation));

}

// Load messages from sessionStorage (wenn fenster neu geladen oder auf neue Seite gegangen)
function loadConversationFromSessionStorage(chatArea) {

    const conversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];

    conversation.forEach(({ sender, message }) => {
        // Call createMessage with proper arguments
        const [messageWrapper, messageElement] = createMessage(message, sender);
        // Append elements to the chat area
        chatArea.appendChild(messageWrapper);
    });
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Load last X msgs so it "remembers" what happend before
function getLastMessages(count) {
    const conversation = JSON.parse(sessionStorage.getItem('chatbotConversation')) || [];
    const userMessages = conversation.filter(msg => msg.sender === 'user').slice(-count);
    return userMessages.map(msg => msg.message);
}

function addTypingIndicator(chatArea) {

    // Create a typing wrapper
    const typingWrapper = document.createElement("div");
    typingWrapper.id = "typing-indicator-wrapper";
    typingWrapper.style.display = "flex";
    typingWrapper.style.justifyContent = "flex-start"; // Align to left like a bot message
    typingWrapper.style.marginTop = "10px";

    // Create the bubble around the dots
    const bubble = document.createElement("div");
    bubble.style.padding = "15px 10px";
    bubble.style.borderRadius = "12px";
    bubble.style.backgroundColor = "#FFF";
    bubble.style.boxShadow = "0px 2px 4px rgba(0, 0, 0, 0.1)";
    bubble.style.display = "flex";
    bubble.style.justifyContent = "center";
    bubble.style.alignItems = "center";

    // Add animated dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.style.width = "8px";
        dot.style.height = "8px";
        dot.style.margin = "0 4px";
        dot.style.borderRadius = "50%";
        dot.style.backgroundColor = "#aaa";
        dot.style.animation = `typing 1.5s infinite ease-in-out`;
        dot.style.animationDelay = `${i * 0.2}s`; // Delay each dot's animation
        bubble.appendChild(dot);
    }

    typingWrapper.appendChild(bubble);
    chatArea.appendChild(typingWrapper);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to the bottom
}

function removeTypingIndicator(chatArea) {
    const typingWrapper = document.getElementById("typing-indicator-wrapper");
    if (typingWrapper) {
        typingWrapper.remove();
    }
}

// Zeigt willkommensnachrichten an
function displayInitialMessage(chatArea) {

    const willkommensNachricht = "Hier ist der Chatbot der Till-Eulenspiegel-Schule! Wie können wir dir helfen?";

    // Call createMessage with proper arguments
    const [messageWrapper, messageElement] = createMessage(willkommensNachricht, "bot");
    // Append elements to the chat area
    chatArea.appendChild(messageWrapper);

    // Save Bot Message
    saveConversationToSessionStorage(willkommensNachricht, "bot");

    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom

}

// Function to preprocess markdown-like formatting to HTML
function formatMessage(message) {
    // Replace **text** with <b>text</b> for bold
    message = message.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    // Replace _text_ with <i>text</i> for italics
    message = message.replace(/_(.*?)_/g, "<i>$1</i>");
    // Replace line breaks (\n) with <br> for proper formatting
    message = message.replace(/\n/g, "<br>");
    // Replace links in the format "Description: [URL]"
    message = message.replace(
        /(.+?):\s*\[(https?:\/\/[^\s\]]+)\]/g,
        '<a href="$2" target="_blank" style="color: #FF0000; text-decoration: underline;">$1</a>'
    );
    // Replace standalone URLs
    message = message.replace(
        /\b(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" style="color: #FF0000; text-decoration: underline;">$1</a>'
    );
    // Handle unordered lists (e.g., "- Item")
    message = message.replace(
        /(?:^|\n)- (.*?)(?=\n|$)/g,
        (match, p1) => `<ul><li>${p1}</li></ul>`
    );
    // Handle numbered lists (e.g., "1. Item")
    const numberedListRegex = /^(\d+\.\s)(.*)$/gm;
    message = message.replace(
        numberedListRegex,
        (match, prefix, content) => `<li>${content}</li>`
    );
    // Wrap the numbered list with <ol> if items are found
    if (message.includes("<li>")) {
        message = message.replace(/(<li>.*<\/li>)/g, "<ol>$1</ol>");
    }
    // Replace triple backticks (```code```) with <pre><code> for code blocks
    message = message.replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>");
    // Replace single backticks (`code`) with <code> for inline code
    message = message.replace(/`([^`]+)`/g, "<code>$1</code>");
    return message;
}


// Einstellungen für Message Design (Kreiert die Nachrichten)
function createMessage(message, sender) {

    const messageWrapper = document.createElement("div");
    messageWrapper.style.margin = "10px 0";

    const messageElement = document.createElement("div");
    messageElement.innerHTML = formatMessage(message); // Use innerHTML instead of innerText
    messageElement.style.padding = "10px";
    messageElement.style.borderRadius = "12px";
    messageWrapper.style.display = "flex";
    messageElement.style.fontSize = "16px"; // Einheitliche Schriftgröße
    messageElement.style.lineHeight = "1.5";
    messageElement.style.maxWidth = "80%";
    messageElement.style.boxShadow = "0px 2px 4px rgba(0, 0, 0, 0.1)";

    if (sender === "user") {
        messageWrapper.style.justifyContent = "flex-end";
        messageElement.style.margin = "10px 0";
        messageElement.style.backgroundColor = "#FF0000";
        messageElement.style.color = "white";
    } else {
        // Create bot message structure

        // Überschrift der BotßAntworten Nicht mehr benötigt?
//        const botName = document.createElement("div");
//        botName.innerText = "Till-Eulenspiegel-Schule Mölln";
//        botName.style.fontWeight = "bold";
//        botName.style.marginBottom = "5px";
//        botName.style.textAlign = "left";
//        botName.style.color = "black";
//
//        messageWrapper.appendChild(botName);

        messageWrapper.style.justifyContent = "flex-start";
        messageElement.style.backgroundColor = "#FFF";
        messageElement.style.color = "#000";

    }

    // Append the message element to the wrapper
    messageWrapper.appendChild(messageElement);

    return [messageWrapper, messageElement]

}

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    // Create chatbot toggle button
    const toggleButton = document.createElement("button");
    toggleButton.id = "chat-toggle-button";
    toggleButton.innerText = "Chatbot der Till-Eulenspiegel-Schule";
    toggleButton.style.position = "fixed";
    toggleButton.style.bottom = "20px";
    toggleButton.style.right = "20px";
    toggleButton.style.backgroundColor = "#FF0000";
    toggleButton.style.color = "white";
    toggleButton.style.border = "none";
    toggleButton.style.padding = "10px 20px";
    toggleButton.style.borderRadius = "30px";
    toggleButton.style.cursor = "pointer";
    toggleButton.style.fontSize = "14px";
    toggleButton.style.zIndex = "1000";
    toggleButton.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
    document.body.appendChild(toggleButton);

    // Create chatbot container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot";
    chatbotContainer.style.position = "fixed";
    chatbotContainer.style.bottom = "80px";
    chatbotContainer.style.right = "20px";
    chatbotContainer.style.width = "350px";
    chatbotContainer.style.height = "500px";
    chatbotContainer.style.border = "1px solid #ddd";
    chatbotContainer.style.borderRadius = "15px";
    chatbotContainer.style.backgroundColor = "#f5f5f5"; // Leicht grauer Hintergrund
    chatbotContainer.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
    chatbotContainer.style.overflow = "hidden";
    chatbotContainer.style.display = "none"; // Default hidden
    chatbotContainer.style.flexDirection = "column";
    chatbotContainer.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(chatbotContainer);

    // Add header
    const header = document.createElement("div");
    header.style.backgroundColor = "rgba(255, 0, 0, 0.9)";
    header.style.color = "white";
    header.style.padding = "15px";
    header.style.textAlign = "center";
    header.style.fontWeight = "bold";
    header.style.fontSize = "16px";
    header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.1)";
    header.innerText = "Chatbot der Till-Eulenspiegel-Schule";
    chatbotContainer.appendChild(header);

    // Add chat area
    const chatArea = document.createElement("div");
    chatArea.id = "chat-area";
    chatArea.style.flex = "1";
    chatArea.style.padding = "15px";
    chatArea.style.overflowY = "auto";
    chatArea.style.backgroundColor = "#f9f9f9"; // Leicht grauer Hintergrund für den Dialogbereich
    chatbotContainer.appendChild(chatArea);


    // Restore Messages
    loadConversationFromSessionStorage(chatArea);

    // Check if there are existing messages in sessionStorage
    const existingConversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];
    if (existingConversation.length === 0) {
        showAcceptConditionsScreen(chatbotContainer, toggleButton);
        displayInitialMessage(chatArea);
    }

    // Add input area
    const inputArea = document.createElement("div");
    inputArea.style.display = "flex";
    inputArea.style.borderTop = "1px solid #ddd";
    inputArea.style.backgroundColor = "#ffffff";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Stelle deine Frage hier...";
    input.style.flex = "1";
    input.style.border = "none";
    input.style.padding = "10px";
    input.style.outline = "none";

    const sendButton = document.createElement("button");
    sendButton.innerHTML = "&#10148;"; // Unicode for a right-pointing arrow (➤)
    sendButton.style.backgroundColor = "#FF0000";
    sendButton.style.color = "white";
    sendButton.style.border = "none";
    sendButton.style.padding = "10px 15px";
    sendButton.style.cursor = "pointer";
    sendButton.style.borderRadius = "5px";
    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    chatbotContainer.appendChild(inputArea);

    // Restore visibility state
    const isChatbotOpen = loadChatbotVisibilityState();
    chatbotContainer.style.display = isChatbotOpen ? "flex" : "none";

    // Handle toggle button click
    toggleButton.addEventListener("click", () => {
        const isCurrentlyClosed = chatbotContainer.style.display === "none";
        chatbotContainer.style.display = isCurrentlyClosed ? "flex" : "none";
        saveChatbotVisibilityState(isCurrentlyClosed);
    });

    // Handle send button click
    sendButton.addEventListener("click", () => {
        const userMessage = input.value.trim();

        if (userMessage) {

            // Call createMessage with proper arguments
            const [messageWrapper, messageElement] = createMessage(userMessage, "user");
            // Append elements to the chat area
            chatArea.appendChild(messageWrapper);

            // Save User Message
            saveConversationToSessionStorage(userMessage, "user");

            input.value = "";
            chatArea.scrollTop = chatArea.scrollHeight;

            // started nice punkte-lade-animation
            addTypingIndicator(chatArea);

            // stop sending new msgs
            sendButton.disabled = true;

            // Retrieve the last 3 user messages from session storage
            const lastMessages = getLastMessages(3);
            const memory = `${lastMessages.join('; ')}`;

            //fetch('https://tester.osc-fr1.scalingo.io/chat', {
            fetch('http://localhost:3001/chat', {   //für lokales testen
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, memory: memory }),
            })
                .then(response => response.json())
                .then(data => {

                    removeTypingIndicator(chatArea);
                    if (data && data.reply) {

                        // Call createMessage
                        const [messageWrapper, messageElement] = createMessage(data.reply, "bot");
                        // Append elements to the chat area
                        chatArea.appendChild(messageWrapper);

                        // Save Bot Message
                        saveConversationToSessionStorage(data.reply, "bot");

                        chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
                    } else {
                        console.error("Invalid response format:", data);
                    }

                    // wieder erlauben nächste nachricht zu schicken
                    sendButton.disabled = false;
                })
        }
    });

    // Handle pressing "Enter" to send a message
    input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendButton.click();
            event.preventDefault();
        }
    });
});
