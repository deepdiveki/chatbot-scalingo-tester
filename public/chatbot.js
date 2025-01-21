function saveChatbotVisibilityState(isOpen) {
    sessionStorage.setItem("chatbotVisibility", isOpen ? "open" : "closed");
}

function loadChatbotVisibilityState() {
    return sessionStorage.getItem("chatbotVisibility") === "open";
}

// Save messages to sessionStorage
function saveConversationToSessionStorage(message, sender) {

    let conversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];
    conversation.push({ sender, message });
    sessionStorage.setItem("chatbotConversation", JSON.stringify(conversation));

}

// Load messages from sessionStorage
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

function displayInitialMessage(chatArea) {

    const willkommensNachricht = "Hallo :)"

    // Call createMessage with proper arguments
    const [messageWrapper, messageElement] = createMessage(willkommensNachricht, "bot");
    // Append elements to the chat area
    chatArea.appendChild(messageWrapper);

    // Save Bot Message
    saveConversationToSessionStorage(willkommensNachricht, "bot");

    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom

}

// create Messages
function createMessage(message, sender) {

    const messageWrapper = document.createElement("div");
    messageWrapper.style.margin = "5px 0";

    const messageElement = document.createElement("div");
    messageElement.innerText = message; // Set the message content
    messageElement.style.padding = "10px";
    messageElement.style.borderRadius = "15px";
    messageElement.style.display = "inline-block";

    if (sender === "user") {
        messageWrapper.style.textAlign = "right";
        messageElement.style.margin = "5px 0";
        messageElement.style.backgroundColor = "#2463EB";
        messageElement.style.color = "white";
    } else {
        // Create bot message structure
        const botName = document.createElement("div");
        botName.innerText = "Till-Eulenspiegel-Schule Mölln";
        botName.style.fontWeight = "bold";
        botName.style.marginBottom = "5px";
        botName.style.textAlign = "left";
        botName.style.color = "black";

        messageWrapper.appendChild(botName);

        messageElement.style.textAlign = "left";
        messageElement.style.backgroundColor = "#F0F0F0";
        messageElement.style.color = "black";

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
    toggleButton.innerText = "ChatBot";
    toggleButton.style.position = "fixed";
    toggleButton.style.bottom = "20px";
    toggleButton.style.right = "20px";
    toggleButton.style.backgroundColor = "#2463EB";
    toggleButton.style.color = "white";
    toggleButton.style.border = "none";
    toggleButton.style.padding = "10px 20px";
    toggleButton.style.borderRadius = "50px";
    toggleButton.style.cursor = "pointer";
    toggleButton.style.fontSize = "16px";
    toggleButton.style.zIndex = "1000";
    document.body.appendChild(toggleButton);

    // Create chatbot container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot";
    chatbotContainer.style.position = "fixed";
    chatbotContainer.style.bottom = "80px";
    chatbotContainer.style.right = "20px";
    chatbotContainer.style.width = "400px";
    chatbotContainer.style.height = "600px";
    chatbotContainer.style.border = "1px solid #ddd";
    chatbotContainer.style.borderRadius = "10px";
    chatbotContainer.style.backgroundColor = "white";
    chatbotContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    chatbotContainer.style.overflow = "hidden";
    chatbotContainer.style.display = "none"; // Default hidden
    chatbotContainer.style.flexDirection = "column";
    document.body.appendChild(chatbotContainer);

    // Add header
    const header = document.createElement("div");
    header.style.backgroundColor = "#2463EB";
    header.style.color = "white";
    header.style.padding = "10px";
    header.style.textAlign = "center";
    header.style.fontWeight = "bold";
    header.innerText = "ChatBot TES Mölln";
    chatbotContainer.appendChild(header);

    // Add chat area
    const chatArea = document.createElement("div");
    chatArea.id = "chat-area";
    chatArea.style.flex = "1";
    chatArea.style.padding = "10px";
    chatArea.style.overflowY = "auto";
    chatArea.style.fontFamily = "'Roboto', sans-serif"; // Apply Google Font globally
    chatbotContainer.appendChild(chatArea);


    // Restore Messages
    loadConversationFromSessionStorage(chatArea);

    // Check if there are existing messages in sessionStorage
    const existingConversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];
    if (existingConversation.length === 0) {
        displayInitialMessage(chatArea);
    }

    // Add input area
    const inputArea = document.createElement("div");
    inputArea.style.display = "flex";
    inputArea.style.borderTop = "1px solid #ddd";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Stelle hier deine Frage auf Deutsch / Українська ...";
    input.style.flex = "1";
    input.style.border = "none";
    input.style.padding = "10px";
    input.style.outline = "none";
    const sendButton = document.createElement("button");
    sendButton.innerHTML = "&#10148;"; // Unicode for a right-pointing arrow (➤)
    sendButton.style.backgroundColor = "#2463EB";
    sendButton.style.color = "white";
    sendButton.style.border = "none";
    sendButton.style.padding = "10px";
    sendButton.style.cursor = "pointer";
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

            fetch('https://tester.osc-fr1.scalingo.io/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.reply) {

                        // Call createMessage with proper arguments
                        const [messageWrapper, messageElement] = createMessage(data.reply, "bot");
                        // Append elements to the chat area
                        chatArea.appendChild(messageWrapper);

                        // Save Bot Message
                        saveConversationToSessionStorage(data.reply, "bot");

                        chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
                    } else {
                        console.error("Invalid response format:", data);
                    }
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
