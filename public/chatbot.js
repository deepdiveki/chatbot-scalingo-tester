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
    // Handle send button click
    // Handle send button click
sendButton.addEventListener("click", () => {
    const userMessage = input.value.trim();

    if (userMessage) {
        // Display user message in chat area
        const userMessageElement = document.createElement("div");
        userMessageElement.innerText = userMessage;
        userMessageElement.style.margin = "5px 0";
        userMessageElement.style.textAlign = "right";
        userMessageElement.style.color = "blue";
        chatArea.appendChild(userMessageElement);

        // Clear the input field
        input.value = "";
        chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom

        // Send user message to backend and handle response
        fetch('https://tester.osc-fr1.scalingo.io/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage }),
        })
            .then(response => response.json())
            .then(data => {
                // Display bot response in chat area
                const botMessage = document.createElement("div");
                botMessage.innerText = "Bot: " + data.reply;
                botMessage.style.margin = "5px 0";
                botMessage.style.textAlign = "left";
                botMessage.style.color = "green";
                chatArea.appendChild(botMessage);
                chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
            })
            .catch(error => {
                console.error('Error communicating with the backend:', error);

                // Handle error gracefully
                const errorMessage = document.createElement("div");
                errorMessage.innerText = "Bot: Sorry, something went wrong!";
                errorMessage.style.margin = "5px 0";
                errorMessage.style.textAlign = "left";
                errorMessage.style.color = "red";
                chatArea.appendChild(errorMessage);
            });
    }
});

});
