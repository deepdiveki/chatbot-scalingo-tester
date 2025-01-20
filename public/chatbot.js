function saveChatbotVisibilityState(isOpen) {
    sessionStorage.setItem("chatbotVisibility", isOpen ? "open" : "closed");
}

function loadChatbotVisibilityState() {
    return sessionStorage.getItem("chatbotVisibility") === "open";
}

// Save messages to sessionStorage
function saveConversationToSessionStorage(message, sender) {
    try {
        let conversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];
        conversation.push({ sender, message });
        sessionStorage.setItem("chatbotConversation", JSON.stringify(conversation));
        displaySuccessMessage(`Message saved: ${sender === "user" ? "You" : "Bot"}`);
    } catch (error) {
        console.error("Error saving conversation to sessionStorage:", error);
        displayErrorMessage("Error saving conversation. Please try again.");
    }
}

// Load messages from sessionStorage
function loadConversationFromSessionStorage() {
    try {
        const conversation = JSON.parse(sessionStorage.getItem("chatbotConversation")) || [];
        if (conversation.length === 0) {
            displaySuccessMessage("No previous conversation found.");
        } else {
            displaySuccessMessage("Previous conversation loaded successfully.");
        }

        conversation.forEach(({ sender, message }) => {
            const messageWrapper = document.createElement("div");
            messageWrapper.style.margin = "5px 0";

            const messageElement = document.createElement("div");
            messageElement.innerText = message;
            messageElement.style.padding = "10px";
            messageElement.style.borderRadius = "15px";
            messageElement.style.display = "inline-block";

            // Style messages based on sender
            if (sender === "user") {
                messageWrapper.style.textAlign = "right";
                messageElement.style.backgroundColor = "#2463EB";
                messageElement.style.color = "white";
            } else {
                messageWrapper.style.textAlign = "left";
                messageElement.style.backgroundColor = "#F0F0F0";
                messageElement.style.color = "black";
            }

            messageWrapper.appendChild(messageElement);
            chatArea.appendChild(messageWrapper);
        });
    } catch (error) {
        console.error("Error loading conversation from sessionStorage:", error);
        displayErrorMessage("Error loading conversation. The chat history may be corrupted.");
        sessionStorage.removeItem("chatbotConversation"); // Clear corrupted data
    }
}

function displayErrorMessage(message) {
    const errorWrapper = document.createElement("div");
    errorWrapper.style.margin = "10px 0";

    const errorElement = document.createElement("div");
    errorElement.innerText = `Error: ${message}`;
    errorElement.style.backgroundColor = "#FFCCCC"; // Light red for errors
    errorElement.style.color = "red";
    errorElement.style.padding = "10px";
    errorElement.style.borderRadius = "15px";
    errorElement.style.display = "inline-block";
    errorElement.style.textAlign = "left";

    errorWrapper.appendChild(errorElement);
    chatArea.appendChild(errorWrapper);

    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
}

function displaySuccessMessage(message) {
    const successWrapper = document.createElement("div");
    successWrapper.style.margin = "10px 0";

    const successElement = document.createElement("div");
    successElement.innerText = `Success: ${message}`;
    successElement.style.backgroundColor = "#DFF2BF"; // Light green for success
    successElement.style.color = "green";
    successElement.style.padding = "10px";
    successElement.style.borderRadius = "15px";
    successElement.style.display = "inline-block";
    successElement.style.textAlign = "left";

    successWrapper.appendChild(successElement);
    chatArea.appendChild(successWrapper);

    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
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
    console.log("Initializing chatbot. Is open:", isChatbotOpen);
    chatbotContainer.style.display = isChatbotOpen ? "flex" : "none";

    // Handle toggle button click
    toggleButton.addEventListener("click", () => {
        const isCurrentlyClosed = chatbotContainer.style.display === "none";
        chatbotContainer.style.display = isCurrentlyClosed ? "flex" : "none";
        saveChatbotVisibilityState(isCurrentlyClosed);
        console.log("Chatbot toggled. Now:", isCurrentlyClosed ? "open" : "closed");
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
                    const botMessageWrapper = document.createElement("div");
                    botMessageWrapper.style.margin = "10px 0";

                    const botName = document.createElement("div");
                    botName.innerText = "Till-Eulenspiegel-Schule Mölln";
                    botName.style.fontWeight = "bold";
                    botName.style.marginBottom = "5px";
                    botName.style.textAlign = "left";
                    botName.style.color = "black";

                    const botMessage = document.createElement("div");
                    botMessage.innerText = data.reply;
                    botMessage.style.textAlign = "left";
                    botMessage.style.backgroundColor = "#F0F0F0";
                    botMessage.style.color = "black";
                    botMessage.style.padding = "10px";
                    botMessage.style.borderRadius = "15px";
                    botMessage.style.display = "inline-block";

                    botMessageWrapper.appendChild(botName);
                    botMessageWrapper.appendChild(botMessage);
                    chatArea.appendChild(botMessageWrapper);

                    saveConversationToSessionStorage(data.reply, "bot");
                    chatArea.scrollTop = chatArea.scrollHeight;
                })
                .catch(error => {
                    console.error('Error communicating with the backend:', error);
                    displayErrorMessage("Bot: Es tut mir leid, da hat etwas nicht funktioniert.");
                });
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
