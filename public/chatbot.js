function saveChatbotVisibilityState(isOpen) {
    sessionStorage.setItem("chatbotVisibility", isOpen ? "open" : "closed");
}

function loadChatbotVisibilityState() {
    return sessionStorage.getItem("chatbotVisibility") === "open";
}

// Save messages to sessionStorage
function saveConversationToSessionStorage(message, sender) {
    //sessionStorage.setItem("chatbotMsg", message ? "yes" : "no");

    let conversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];
    conversation.push({ sender, message });
    sessionStorage.setItem("chatbotConversation", JSON.stringify(conversation));

    return JSON.stringify(conversation)
}

// Load messages from sessionStorage
function loadConversationFromSessionStorage(chatArea) {
    //return sessionStorage.getItem("chatbotMsg");
        const conversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];
        console.log("Loaded conversation:", conversation);

        conversation.forEach(({ sender, message }) => {
            const messageWrapper = document.createElement("div");
            messageWrapper.style.margin = "5px 0";

            const messageElement = document.createElement("div");
            messageElement.innerText = message;
            messageElement.style.padding = "10px";
            messageElement.style.borderRadius = "15px";
            messageElement.style.display = "inline-block";

            if (sender === "user") {
                messageWrapper.style.textAlign = "right";
                messageElement.style.margin = "5px 0";
                messageElement.style.backgroundColor = "#2463EB";
                messageElement.style.color = "white";
                messageElement.style.padding = "10px";
                messageElement.style.borderRadius = "15px";
                messageElement.style.display = "inline-block";
            } else {
                // Create bot message structure
                const botName = document.createElement("div");
                botName.innerText = "Till-Eulenspiegel-Schule Mölln";
                botName.style.fontWeight = "bold";
                botName.style.marginBottom = "5px";
                botName.style.textAlign = "left";
                botName.style.color = "black";

                const botMessage = document.createElement("div");
                messageElement.innerText = message;
                messageElement.style.textAlign = "left";
                messageElement.style.backgroundColor = "#F0F0F0";
                messageElement.style.color = "black";
                messageElement.style.padding = "10px";
                messageElement.style.borderRadius = "15px";
                messageElement.style.display = "inline-block";

                messageWrapper.appendChild(botName);
            }

            messageWrapper.appendChild(messageElement);
            chatArea.appendChild(messageWrapper);
        });

        chatArea.scrollTop = chatArea.scrollHeight;


        //return JSON.stringify(conversation)
}

//function displayInitialMessage() {
//    const botMessageWrapper = document.createElement("div");
//    botMessageWrapper.style.margin = "10px 0";
//
//    const botName = document.createElement("div");
//    botName.innerText = "Till-Eulenspiegel-Schule Mölln";
//    botName.style.fontWeight = "bold";
//    botName.style.marginBottom = "5px";
//    botName.style.textAlign = "left";
//    botName.style.color = "black";
//
//    const botMessage = document.createElement("div");
//    botMessage.innerText = "Hallo! Wie kann ich dir helfen?"; // Your initial message
//    botMessage.style.textAlign = "left";
//    botMessage.style.backgroundColor = "#F0F0F0";
//    botMessage.style.color = "black";
//    botMessage.style.padding = "10px";
//    botMessage.style.borderRadius = "15px";
//    botMessage.style.display = "inline-block";
//
//    botMessageWrapper.appendChild(botName);
//    botMessageWrapper.appendChild(botMessage);
//    chatArea.appendChild(botMessageWrapper);
//
//    // Save the initial message in sessionStorage
//    //saveConversationToSessionStorage("Hallo! Wie kann ich dir helfen?", "bot");
//}

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
            const userMessageWrapper = document.createElement("div");
            userMessageWrapper.style.textAlign = "right";

            const userMessageElement = document.createElement("div");
            userMessageElement.innerText = userMessage;
            userMessageElement.style.margin = "5px 0";
            userMessageElement.style.backgroundColor = "#2463EB";
            userMessageElement.style.color = "white";
            userMessageElement.style.padding = "10px";
            userMessageElement.style.borderRadius = "15px";
            userMessageElement.style.display = "inline-block";

            userMessageWrapper.appendChild(userMessageElement);
            chatArea.appendChild(userMessageWrapper);

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
                        const botMessageWrapper = document.createElement("div");
                        botMessageWrapper.style.margin = "10px 0";

                        const botName = document.createElement("div");
                        botName.innerText = "Till-Eulenspiegel-Schule Mölln";
                        botName.style.fontWeight = "bold";
                        botName.style.marginBottom = "5px";
                        botName.style.textAlign = "left";
                        botName.style.color = "black";

                        const botMessage = document.createElement("div");
                        botMessage.innerText = data.reply; // Ensure this is the correct property
                        botMessage.style.textAlign = "left";
                        botMessage.style.backgroundColor = "#F0F0F0";
                        botMessage.style.color = "black";
                        botMessage.style.padding = "10px";
                        botMessage.style.borderRadius = "15px";
                        botMessage.style.display = "inline-block";

                        botMessageWrapper.appendChild(botName);
                        botMessageWrapper.appendChild(botMessage);
                        chatArea.appendChild(botMessageWrapper);

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
