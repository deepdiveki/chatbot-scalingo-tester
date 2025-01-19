// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
    // Create chatbot container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot";
    chatbotContainer.style.position = "fixed";
    chatbotContainer.style.bottom = "20px";
    chatbotContainer.style.right = "20px";
    chatbotContainer.style.width = "300px";
    chatbotContainer.style.height = "400px";
    chatbotContainer.style.border = "1px solid #ddd";
    chatbotContainer.style.borderRadius = "10px";
    chatbotContainer.style.backgroundColor = "white";
    chatbotContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    chatbotContainer.style.overflow = "hidden";
    chatbotContainer.style.display = "flex";
    chatbotContainer.style.flexDirection = "column";

    // Add header
    const header = document.createElement("div");
    header.style.backgroundColor = "#007BFF";
    header.style.color = "white";
    header.style.padding = "10px";
    header.style.textAlign = "center";
    header.style.fontWeight = "bold";
    header.innerText = "Chatbot";
    chatbotContainer.appendChild(header);

    // Add chat area
    const chatArea = document.createElement("div");
    chatArea.id = "chat-area";
    chatArea.style.flex = "1";
    chatArea.style.padding = "10px";
    chatArea.style.overflowY = "auto";
    chatbotContainer.appendChild(chatArea);

    // Add input area
    const inputArea = document.createElement("div");
    inputArea.style.display = "flex";
    inputArea.style.borderTop = "1px solid #ddd";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message...";
    input.style.flex = "1";
    input.style.border = "none";
    input.style.padding = "10px";
    input.style.outline = "none";
    const sendButton = document.createElement("button");
    sendButton.innerText = "Send";
    sendButton.style.backgroundColor = "#007BFF";
    sendButton.style.color = "white";
    sendButton.style.border = "none";
    sendButton.style.padding = "10px";
    sendButton.style.cursor = "pointer";

    // Add input and button to input area
    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    chatbotContainer.appendChild(inputArea);

    // Add chatbot to the page
    document.body.appendChild(chatbotContainer);

    // Handle send button click
    sendButton.addEventListener("click", () => {
        const userMessage = input.value.trim();
        if (userMessage) {
            const messageElement = document.createElement("div");
            messageElement.innerText = userMessage;
            messageElement.style.margin = "5px 0";
            messageElement.style.textAlign = "right";
            messageElement.style.color = "blue";
            chatArea.appendChild(messageElement);

            // Mock chatbot reply
            const botMessage = document.createElement("div");
            botMessage.innerText = "Bot: " + "Thanks for your message!";
            botMessage.style.margin = "5px 0";
            botMessage.style.textAlign = "left";
            botMessage.style.color = "green";
            chatArea.appendChild(botMessage);

            // Clear input
            input.value = "";
            chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
        }
    });
});
