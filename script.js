// --- CONFIGURATION ---
const API_KEY = "AIzaSyCc4FqmTTE2MjLz7tID16Km2eQPY3Omhpk";


// DOM Elements
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const moodBtn = document.getElementById('moodBtn');
const emptyState = document.getElementById('emptyState');

// Modals & Sidebar Elements
const nameModal = document.getElementById('nameModal');
const userNameInput = document.getElementById('userNameInput');
const saveNameBtn = document.getElementById('saveNameBtn');
const displayUserName = document.getElementById('displayUserName');
const menuBtn = document.getElementById('menuBtn');
const historySidebar = document.getElementById('historySidebar');
const closeSidebar = document.getElementById('closeSidebar');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Variables
let userName = localStorage.getItem('bestie_username') || "";
let chatHistory = JSON.parse(localStorage.getItem('bestie_history')) || [];

// 4 Moods Setup
const moods = [
    { name: "Savage 🔥", instruction: "You are a savage, sarcastic best friend. You roast the user playfully but still help them. Keep answers short and gen-z style." },
    { name: "Sweet 💖", instruction: "You are a very sweet, caring, and loving best friend. You use a lot of wholesome emojis." },
    { name: "Funny 😂", instruction: "You are a hilarious best friend who loves telling jokes and finding humor in everything." },
    { name: "Genius 🧠", instruction: "You are a highly intelligent, professional yet friendly assistant. You provide logical and detailed answers." }
];
let currentMoodIndex = 0;

// Initialize App
function initApp() {
    if (!userName) {
        nameModal.classList.remove('hidden');
    } else {
        nameModal.classList.add('hidden');
        displayUserName.innerText = userName;
        loadHistory();
    }
}

// Save Name
saveNameBtn.addEventListener('click', () => {
    const name = userNameInput.value.trim();
    if (name) {
        userName = name;
        localStorage.setItem('bestie_username', userName);
        displayUserName.innerText = userName;
        nameModal.classList.add('hidden');
    }
});

// Toggle Moods
moodBtn.addEventListener('click', () => {
    currentMoodIndex = (currentMoodIndex + 1) % moods.length;
    moodBtn.innerText = moods[currentMoodIndex].name;
});

// Sidebar logic
menuBtn.addEventListener('click', () => historySidebar.classList.add('active'));
closeSidebar.addEventListener('click', () => historySidebar.classList.remove('active'));

// Clear History
clearHistoryBtn.addEventListener('click', () => {
    chatHistory = [];
    localStorage.removeItem('bestie_history');
    chatBox.innerHTML = '';
    chatBox.appendChild(emptyState);
    emptyState.style.display = 'flex';
    historySidebar.classList.remove('active');
});

// Load Chat History on Start
function loadHistory() {
    if (chatHistory.length > 0) {
        emptyState.style.display = 'none';
        // Display history (skipping the system instructions if stored differently, but here we just store user/model text)
        chatHistory.forEach(msg => {
            appendMessage(msg.parts[0].text, msg.role === 'user' ? 'user' : 'ai');
        });
    }
}

// Append Message to UI
function appendMessage(text, sender) {
    emptyState.style.display = 'none';
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('msg', sender);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Call Gemini API
async function fetchGeminiResponse(userText) {
    appendMessage(userText, 'user');
    
    // Format history for Gemini
    const formattedHistory = chatHistory.map(h => ({
        role: h.role,
        parts: h.parts
    }));

    // Add current message to history array
    chatHistory.push({ role: "user", parts: [{ text: userText }] });
    formattedHistory.push({ role: "user", parts: [{ text: userText }] });

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('msg', 'ai');
    loadingDiv.innerText = "Typing...";
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: moods[currentMoodIndex].instruction }]
                },
                contents: formattedHistory
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;

        // Remove loading and append real response
        chatBox.removeChild(loadingDiv);
        appendMessage(aiText, 'ai');

        // Save AI response to history
        chatHistory.push({ role: "model", parts: [{ text: aiText }] });
        localStorage.setItem('bestie_history', JSON.stringify(chatHistory));

    } catch (error) {
        chatBox.removeChild(loadingDiv);
        appendMessage("Network error bro, check console or API key.", 'ai');
        console.error(error);
    }
}

// Send Button Event
sendBtn.addEventListener('click', () => {
    const text = messageInput.value.trim();
    if (text === "") return;
    messageInput.value = "";
    fetchGeminiResponse(text);
});

// Enter key to send
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// Start
initApp();
