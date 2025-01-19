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
    chatbotContainer.style.width = "300px";
    chatbotContainer.style.height = "400px";
    chatbotContainer.style.border = "1px solid #ddd";
    chatbotContainer.style.borderRadius = "10px";
    chatbotContainer.style.backgroundColor = "white";
    chatbotContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    chatbotContainer.style.overflow = "hidden";
    chatbotContainer.style.display = "none"; // Hidden initially
    chatbotContainer.style.flexDirection = "column";

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
    sendButton.style.backgroundColor = "#2463EB";
    sendButton.style.color = "white";
    sendButton.style.border = "none";
    sendButton.style.padding = "10px";
    sendButton.style.cursor = "pointer";

    // Add input and button to input area
    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    chatbotContainer.appendChild(inputArea);

    // Add chatbot container to the page
    document.body.appendChild(chatbotContainer);

    // Handle toggle button click to show/hide chatbot
    toggleButton.addEventListener("click", () => {
        chatbotContainer.style.display =
            chatbotContainer.style.display === "none" ? "flex" : "none";
    });

    // Handle send button click
    sendButton.addEventListener("click", () => {
        const userMessage = input.value.trim();

        if (userMessage) {
            // Create a wrapper for alignment
            const userMessageWrapper = document.createElement("div");
            userMessageWrapper.style.textAlign = "right"; // Align wrapper to the right

            // Display user message in chat area
            const userMessageElement = document.createElement("div");
            userMessageElement.innerText = userMessage;
            userMessageElement.style.margin = "5px 0";
            userMessageElement.style.backgroundColor = "#2463EB"; // blue for user messages
            userMessageElement.style.color = "white";
            userMessageElement.style.padding = "10px";
            userMessageElement.style.borderRadius = "15px";
            userMessageElement.style.display = "inline-block"; // Ensure it's a bubble
            // Append the message bubble to the wrapper
            userMessageWrapper.appendChild(userMessageElement);

            // Append the wrapper to the chat area
            chatArea.appendChild(userMessageWrapper);

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
                    // Create a wrapper for the bot message
                    const botMessageWrapper = document.createElement("div");
                    botMessageWrapper.style.margin = "10px 0"; // Add space between messages

                    // Add the bot's name above the response
                    const botName = document.createElement("div");
                    botName.innerText = "Till-Eulenspiegel-Schule Mölln";
                    botName.style.fontWeight = "bold"; // Make the name bold
                    botName.style.marginBottom = "5px"; // Add space between name and response
                    botName.style.textAlign = "left"; // Align name to the left
                    botName.style.color = "black"; // Set name color

                    // Add the bot's response
                    const botMessage = document.createElement("div");
                    botMessage.innerText = data.reply;
                    botMessage.style.textAlign = "left";
                    botMessage.style.backgroundColor = "#F0F0F0"; // Light grey for bot messages
                    botMessage.style.color = "black";
                    botMessage.style.padding = "10px";
                    botMessage.style.borderRadius = "15px";
                    botMessage.style.display = "inline-block"; // Ensure it's a bubble

                    // Append the bot's name and message to the wrapper
                    botMessageWrapper.appendChild(botName);
                    botMessageWrapper.appendChild(botMessage);

                    // Append the wrapper to the chat area
                    chatArea.appendChild(botMessageWrapper);
                    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
                })
                .catch(error => {
                    console.error('Error communicating with the backend:', error);

                    // Handle error gracefully
                    const errorMessage = document.createElement("div");
                    errorMessage.innerText = "Till-Eulenspiegel-Schule Mölln: Es tut mir leid, da hat etwas nicht funktioniert!";
                    errorMessage.style.margin = "5px 0";
                    errorMessage.style.textAlign = "left";
                    errorMessage.style.backgroundColor = "#FFCCCC"; // Light red for errors
                    errorMessage.style.color = "red";
                    errorMessage.style.padding = "10px";
                    errorMessage.style.borderRadius = "15px";
                    errorMessage.style.display = "inline-block"; // Ensure it's a bubble
                    chatArea.appendChild(errorMessage);
                });
        }
    });
    // Handle pressing "Enter" to send a message
        input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            sendButton.click(); // Trigger the send button click event
            event.preventDefault(); // Prevent default form submission behavior
        }
    });
});
