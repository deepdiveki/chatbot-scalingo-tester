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
        overlay.style.fontFamily = "Arial, sans-serif";

        // Create the message content
        const message = document.createElement("div");
        message.innerHTML = 'Willkommen zum Chatbot des Gymnasium Alster! <br> Bitte akzeptieren Sie unsere <a href="https://www.deepdive-ki.de/datenschutz" target="_blank" style="color: #7f56d9; text-decoration: underline;">Datenschutzrichtlinien</a>, um fortzufahren.';
        message.style.color = "#000";
        message.style.fontSize = "16px";
        message.style.textAlign = "center";
        message.style.marginBottom = "20px";

        // Create the dismiss button
        const button = document.createElement("button");
        button.innerText = "Akzeptieren";
        button.style.padding = "12px 24px";
        button.style.background = "linear-gradient(145deg, #8b5cf6, #7f56d9)";
        button.style.boxShadow = "0 4px 10px rgba(127, 86, 217, 0.4)";
        button.style.transition = "all 0.2s ease-in-out";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "30px";
        button.style.fontSize = "16px";
        button.style.fontWeight = "bold";
        button.style.cursor = "pointer";
        button.addEventListener("mouseenter", () => {
            button.style.transform = "scale(1.05)";
            button.style.boxShadow = "0 6px 14px rgba(127, 86, 217, 0.6)";
        });
        button.addEventListener("mouseleave", () => {
            button.style.transform = "scale(1)";
            button.style.boxShadow = "0 4px 10px rgba(127, 86, 217, 0.4)";
        });

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

            // Willkommenskarte anzeigen
            const welcomeScreen = document.createElement("div");
            welcomeScreen.style.display = "flex";
            welcomeScreen.style.flexDirection = "column";
            welcomeScreen.style.alignItems = "center";
            welcomeScreen.style.justifyContent = "center";
            welcomeScreen.style.padding = "30px 20px";
            welcomeScreen.style.textAlign = "center";
            welcomeScreen.style.color = "#333";
            welcomeScreen.style.fontSize = "20px";
            welcomeScreen.style.fontWeight = "bold";
            welcomeScreen.innerHTML = `
                <img src="deepdiveki-logo.svg" alt="Avatar" style="width:60px;height:60px;margin-bottom:16px;" />
                <div style="font-size: 20px; font-weight: bold; color: #1a1a1a;">Hallo, willkommen am Gymnasium Alster!</div>
                <div style="font-size: 16px; color: #333; margin-top: 8px;">Wie können wir helfen?</div>
            `;

            const chatArea = document.getElementById("chat-area");
            chatArea.innerHTML = ""; // clear previous messages if any
            chatArea.appendChild(welcomeScreen);
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
    // Inject typing-bounce animation style if not already injected
    if (!document.getElementById("typing-bounce-style")) {
        const style = document.createElement("style");
        style.id = "typing-bounce-style";
        style.innerHTML = `
@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
`;
        document.head.appendChild(style);
    }

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

    // Add animated dots (modern bounce style)
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.style.width = "8px";
        dot.style.height = "8px";
        dot.style.margin = "0 4px";
        dot.style.borderRadius = "50%";
        dot.style.backgroundColor = "#888";
        dot.style.animation = "typing-bounce 1.2s infinite ease-in-out both";
        dot.style.animationDelay = `${i * 0.2}s`;
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

    const willkommensNachricht = "Hier ist der Chatbot des Gymnasium Alster! Wie können wir dir helfen?";

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
        '<br><a href="$2" target="_blank" style="color: #FF0000; text-decoration: underline;">$1</a>'
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
    // Modern "Fin"-Stil: beide Nachrichtenarten
    messageWrapper.style.margin = "10px 0";
    messageWrapper.style.display = "flex";

    const messageElement = document.createElement("div");
    messageElement.innerHTML = formatMessage(message);
    messageElement.style.lineHeight = "1.5";
    messageElement.style.maxWidth = "80%";
    messageElement.style.wordBreak = "break-word";

    if (sender === "user") {
        // User-Nachricht Stil (Fin-ähnlich)
        messageWrapper.style.justifyContent = "flex-end";
        messageElement.style.background = "linear-gradient(145deg, #d946ef, #9333ea)";
        messageElement.style.borderRadius = "20px";
        messageElement.style.padding = "14px 18px";
        messageElement.style.fontSize = "15px";
        messageElement.style.color = "#fff";
        messageElement.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.15)";
        // Stil für bessere Integration
        messageElement.style.display = "flex";
        messageElement.style.flexDirection = "column";
        // Entferne harte Ränder durch weicheren Border
        messageElement.style.border = "1px solid #9333ea";
        messageWrapper.appendChild(messageElement);
    } else {
        // Bot-Nachricht Stil mit modernen Fin-ähnlichen Upgrades
        messageWrapper.style.justifyContent = "flex-start";
        // Optische Upgrades für modernes Design
        messageElement.style.background = "rgba(243, 232, 255, 0.6)";
        messageElement.style.border = "1px solid #a78bfa";
        messageElement.style.boxShadow = "0 3px 10px rgba(127, 86, 217, 0.15)";
        messageElement.style.borderRadius = "16px";
        messageElement.style.padding = "16px 20px";
        messageElement.style.fontSize = "15px";
        messageElement.style.color = "#1a1a1a";
        messageElement.style.fontFamily = "'Helvetica Neue', sans-serif";
        messageElement.style.position = "relative";
        messageElement.style.display = "flex";

        // Neue Zeile für Avatar + Name über der Blase, zentriert auf die Blasenbreite
        const botMetaRow = document.createElement("div");
        botMetaRow.style.display = "flex";
        botMetaRow.style.alignItems = "center";
        botMetaRow.style.marginBottom = "4px";
        botMetaRow.style.marginLeft = "14px";

        const botAvatar = document.createElement("img");
        botAvatar.src = "deepdiveki-logo.svg";
        botAvatar.alt = "Bot Avatar";
        botAvatar.style.width = "20px";
        botAvatar.style.height = "20px";
        botAvatar.style.borderRadius = "50%";
        botAvatar.style.marginRight = "8px";

        const botName = document.createElement("div");
        botName.innerText = "KI-Schulbüro";
        botName.style.fontSize = "12px";
        botName.style.color = "#000";
        botName.style.fontWeight = "bold";
        botName.style.marginTop = "2px";

        botMetaRow.appendChild(botAvatar);
        botMetaRow.appendChild(botName);

        // Container für Metadaten und Blase, linksbündig, aber Metadaten über Blase
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.alignItems = "flex-start";
        container.appendChild(botMetaRow);
        container.appendChild(messageElement);
        messageWrapper.appendChild(container);

        // Erweiterung: Quellenabschnitt speziell formatieren
        if (message.includes("Sources:")) {
            const sourcesSection = document.createElement("div");
            sourcesSection.style.marginTop = "12px";
            sourcesSection.style.borderTop = "1px solid #6d28d9";
            sourcesSection.style.paddingTop = "8px";

            const title = document.createElement("div");
            title.innerText = "Sources";
            title.style.fontWeight = "bold";
            title.style.fontSize = "13px";
            title.style.marginBottom = "4px";
            title.style.color = "#bdb7e4";

            sourcesSection.appendChild(title);

            const links = message.match(/\[(https?:\/\/[^\]]+)\]/g);
            if (links) {
                links.forEach(linkMatch => {
                    const url = linkMatch.slice(1, -1);
                    const item = document.createElement("div");
                    item.innerHTML = `&#10148; <a href="${url}" target="_blank" style="color: #9333ea; text-decoration: underline;">${url}</a>`;
                    item.style.fontSize = "13px";
                    item.style.marginBottom = "2px";
                    sourcesSection.appendChild(item);
                });
            }

            messageElement.appendChild(sourcesSection);
        }
    }
    return [messageWrapper, messageElement];
}

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    // Create chatbot toggle button
    const toggleButton = document.createElement("button");
    toggleButton.id = "chat-toggle-button";
    // Replace text with icon for minimalist design
    const chatIcon = document.createElement("img");
    chatIcon.src = "ddki logo weiß.svg";
    chatIcon.alt = "Chatbot";
    chatIcon.style.width = "24px";
    chatIcon.style.height = "24px";
    chatIcon.style.verticalAlign = "middle";
    chatIcon.style.display = "block";
    chatIcon.style.margin = "0 auto";
    toggleButton.appendChild(chatIcon);
    // Alternative Pfeil nach unten
    const downArrowIcon = document.createElement("span");
    downArrowIcon.innerHTML = "&#x25BC;";
    downArrowIcon.style.display = "none";
    downArrowIcon.style.fontSize = "18px";
    downArrowIcon.style.color = "#fff";
    toggleButton.appendChild(downArrowIcon);
    toggleButton.title = "Chat starten";
    toggleButton.style.position = "fixed";
    toggleButton.style.bottom = "20px";
    toggleButton.style.right = "20px";
    toggleButton.style.backgroundColor = "#8b5cf6";
    toggleButton.style.color = "#fff";
    toggleButton.style.border = "none";
    toggleButton.style.padding = "10px 20px";
    toggleButton.style.borderRadius = "30px";
    toggleButton.style.cursor = "pointer";
    toggleButton.style.fontSize = "14px";
    toggleButton.style.zIndex = "1000";
    toggleButton.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
    toggleButton.style.transition = "transform 0.2s ease";
    // Hover-Effekt für den Toggle-Button
    toggleButton.addEventListener("mouseenter", () => {
        toggleButton.style.transform = "scale(1.1)";
        toggleButton.style.boxShadow = "0 0 12px #8b5cf6";
    });
    toggleButton.addEventListener("mouseleave", () => {
        toggleButton.style.transform = "scale(1)";
        toggleButton.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
    });
    document.body.appendChild(toggleButton);

    // Create chatbot container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot";
    chatbotContainer.style.position = "fixed"; // Ensure fixed positioning to prevent layout shift
    chatbotContainer.style.bottom = "80px";
    chatbotContainer.style.right = "20px";
    // fluid width: 25vw but never under 300px or over 42vh
    chatbotContainer.style.width    = "25vw";
    chatbotContainer.style.minWidth = "300px";
    chatbotContainer.style.maxWidth = "42vh";
    // fluid height: 60vh but never under 400px or over 80vh
    chatbotContainer.style.height   = "60vh";
    chatbotContainer.style.minHeight= "300px";
    chatbotContainer.style.maxHeight= "80vh";
    chatbotContainer.style.background = "linear-gradient(to top, #e8d0ff, #caa5ff)";
    chatbotContainer.style.border = "6px solid rgba(255, 255, 255, 0.6)";
    chatbotContainer.style.borderRadius = "20px";
    chatbotContainer.style.backdropFilter = "blur(10px)";
    // Moderner, weicher weißer Rahmen und extra Schatten (verstärkt, noch breiter)
    // chatbotContainer.style.outline = "6px solid rgba(255, 255, 255, 0.6)";
    // chatbotContainer.style.outlineOffset = "-6px";
    chatbotContainer.style.boxShadow = "none";
    chatbotContainer.style.overflow = "hidden";
    chatbotContainer.style.display = "none"; // Default hidden
    chatbotContainer.style.flexDirection = "column";
    chatbotContainer.style.fontFamily = "Arial, sans-serif";
    // Optional: outline und outlineOffset bewusst deaktiviert/dezent gelassen
    document.body.appendChild(chatbotContainer);

    // Add header
    const header = document.createElement("div");
    header.id = "chatbot-header";
    header.style.display = "none";
    header.style.alignItems = "center";
    header.style.padding = "12px 16px";
    header.style.backgroundColor = "#ffffff";
    header.style.borderBottom = "1px solid #eee";
    // Removed logo image element
    // const logo = document.createElement("img");
    // logo.src = "ddki logo weiß.svg";
    // logo.alt = "Bot Avatar";
    // logo.style.width = "28px";
    // logo.style.height = "28px";
    // logo.style.borderRadius = "50%";
    // logo.style.marginRight = "10px";

    const title = document.createElement("div");
    title.innerHTML = `<strong>Gymnasium Alster</strong> · Das KI-Schulbüro`;
    title.style.fontSize = "15px";
    title.style.color = "#333";

    // header.appendChild(logo);
    header.appendChild(title);
    chatbotContainer.appendChild(header);

    // Add chat area
    const chatArea = document.createElement("div");
    chatArea.id = "chat-area";
    chatArea.style.flex = "1";
    chatArea.style.padding = "15px";
    chatArea.style.overflowY = "auto";
    chatbotContainer.style.background = "linear-gradient(to bottom right, #f8f0ff, #d4b5ff)";
    chatbotContainer.style.color = "#ffffff";
    // Ensure chatArea is positioned relative for overlay fade
    chatArea.style.position = "relative";
    chatbotContainer.appendChild(chatArea);

    // Add a fade overlay at the top of the chat area (sichtbarer, weicher)
    const topFade = document.createElement("div");
    topFade.style.position = "absolute";
    topFade.style.top = "0";
    topFade.style.left = "0";
    topFade.style.right = "0";
    topFade.style.height = "40px";
    topFade.style.pointerEvents = "none";
    topFade.style.background = "linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0))";
    topFade.style.zIndex = "2";
    chatArea.appendChild(topFade);

    // Ensure chatArea is under the fade overlay
    chatArea.style.zIndex = "0";


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
    inputArea.style.background = "transparent";
    inputArea.style.padding = "12px 20px 20px 20px";
    inputArea.style.display = "flex";
    inputArea.style.justifyContent = "center";
    inputArea.style.alignItems = "center";
    inputArea.style.boxShadow = "none";
    inputArea.style.borderTop = "none";

    const inputBar = document.createElement("div");
    inputBar.style.display = "flex";
    inputBar.style.alignItems = "center";
    inputBar.style.backgroundColor = "#ffffff";
    inputBar.style.borderRadius = "20px";
    inputBar.style.border = "1px solid rgba(255, 255, 255, 0.6)";
    inputBar.style.boxShadow = "0 1px 4px rgba(0,0,0,0.1), 0 0 0 4px rgba(255, 255, 255, 0.6)";
    inputBar.style.padding = "6px 12px";
    inputBar.style.flex = "1";
    inputBar.style.maxWidth = "100%";
    inputBar.style.position = "relative";

    const input = document.createElement("input");
    input.type = "text";
    input.style.flex = "1";
    input.style.padding = "8px 12px";
    input.style.border = "none";
    input.style.borderRadius = "16px";
    input.style.fontSize = "14px";
    input.style.outline = "none";
    input.style.backgroundColor = "transparent";
    input.style.boxShadow = "none";
    input.style.margin = "0";
    input.placeholder = "Schulbüro antworten...";

    const sendButton = document.createElement("button");
    sendButton.innerHTML = "&#10148;";
    sendButton.style.position = "absolute";
    sendButton.style.right = "10px";
    sendButton.style.top = "50%";
    sendButton.style.transform = "translateY(-50%)";
    sendButton.style.width = "32px";
    sendButton.style.height = "32px";
    sendButton.style.border = "none";
    sendButton.style.borderRadius = "50%";
    sendButton.style.backgroundColor = "#7f56d9";
    sendButton.style.color = "#fff";
    sendButton.style.display = "flex";
    sendButton.style.alignItems = "center";
    sendButton.style.justifyContent = "center";
    sendButton.style.fontSize = "14px";
    sendButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    sendButton.style.opacity = "0.5";
    sendButton.style.cursor = "default";

    inputBar.appendChild(input);
    inputBar.appendChild(sendButton);
    inputArea.appendChild(inputBar);
    chatbotContainer.appendChild(inputArea);

    // Restore visibility state
    const isChatbotOpen = loadChatbotVisibilityState();
    chatbotContainer.style.display = isChatbotOpen ? "flex" : "none";

    // Handle toggle button click
    toggleButton.addEventListener("click", () => {
        const isCurrentlyClosed = chatbotContainer.style.display === "none";
        chatbotContainer.style.display = isCurrentlyClosed ? "flex" : "none";
        saveChatbotVisibilityState(isCurrentlyClosed);
        // Icon-Switch für Chatbot-Button
        const isOpen = chatbotContainer.style.display === "flex";
        chatIcon.style.display = isOpen ? "none" : "block";
        downArrowIcon.style.display = isOpen ? "block" : "none";
    });

    // Handle send button click
    sendButton.addEventListener("click", () => {
        // Show header when user sends a message
        document.getElementById("chatbot-header").style.display = "flex";
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
            sendButton.style.backgroundColor = "#ccc";
            sendButton.style.opacity = "0.5";
            sendButton.style.cursor = "default";

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
                    // Do NOT reset button styling here; styling will only be set via input event
                })
        }
    });

    // Interaktive Steuerung des Sendebuttons basierend auf Texteingabe
    input.addEventListener("input", () => {
        const isNotEmpty = input.value.trim().length > 0;
        sendButton.style.backgroundColor = isNotEmpty ? "#7f56d9" : "#ccc";
        sendButton.style.opacity = isNotEmpty ? "1" : "0.5";
        sendButton.style.cursor = isNotEmpty ? "pointer" : "default";
    });

    // Handle pressing "Enter" to send a message
    input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendButton.click();
            event.preventDefault();
        }
    });
});
