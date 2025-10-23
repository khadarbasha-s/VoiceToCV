#!/bin/bash

# Create frontend directory structure
mkdir -p frontend/src/{components,pages,services}

# Create all files with content
cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:8000/api
EOF

cat > frontend/package.json << 'EOF'
{
  "name": "voice-agent-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "axios": "^1.6.8",
    "framer-motion": "^11.2.6",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.21.0",
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.4.3"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
EOF

cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
EOF

cat > frontend/src/index.js << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > frontend/src/App.jsx << 'EOF'
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">AI Agent Assistant</h1>
          <div className="space-x-4">
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </div>
        </nav>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
EOF

cat > frontend/src/pages/Home.jsx << 'EOF'
import React from "react";
import ChatWindow from "../components/ChatWindow";

const Home = () => {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-100">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl p-4">
        <ChatWindow />
      </div>
    </div>
  );
};

export default Home;
EOF

cat > frontend/src/pages/About.jsx << 'EOF'
import React from "react";

const About = () => {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">About This Project</h2>
      <p className="text-gray-700 max-w-xl mx-auto">
        This project is an AI-powered interactive assistant designed for blue-collar users or
        individuals with general education backgrounds.  
        It uses voice and text interaction, helping users ask career, education, or skill-related
        questions.  
        The agent is powered by Django + LangChain (LLaMA / OpenAI / HuggingFace) and uses React for
        a clean user interface.
      </p>
    </div>
  );
};

export default About;
EOF

cat > frontend/src/components/ChatWindow.jsx << 'EOF'
import React, { useState } from "react";
import axios from "../services/api";
import MessageBubble from "./MessageBubble";
import VoiceRecorder from "./VoiceRecorder";
import Loader from "./Loader";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/chat/", { message: input });
      const agentMsg = { sender: "agent", text: res.data.reply };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (error) {
      const errMsg = { sender: "agent", text: "Error: Unable to fetch response." };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-gray-50 rounded-md">
        {messages.map((msg, i) => (
          <MessageBubble key={i} sender={msg.sender} text={msg.text} />
        ))}
        {loading && <Loader />}
      </div>

      <div className="flex items-center space-x-2">
        <VoiceRecorder onResult={setInput} />
        <input
          type="text"
          className="flex-1 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
EOF

cat > frontend/src/components/MessageBubble.jsx << 'EOF'
import React from "react";
import { motion } from "framer-motion";

const MessageBubble = ({ sender, text }) => {
  const isUser = sender === "user";

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className={`p-3 rounded-2xl max-w-xs ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        {text}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
EOF

cat > frontend/src/components/VoiceRecorder.jsx << 'EOF'
import React, { useState } from "react";

const VoiceRecorder = ({ onResult }) => {
  const [listening, setListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };
  };

  return (
    <button
      onClick={handleVoiceInput}
      className={`px-3 py-2 rounded-full border ${
        listening ? "bg-red-500 text-white" : "bg-gray-200"
      }`}
    >
      🎤
    </button>
  );
};

export default VoiceRecorder;
EOF

cat > frontend/src/components/Loader.jsx << 'EOF'
import React from "react";

const Loader = () => (
  <div className="flex justify-center items-center py-2">
    <div className="animate-pulse text-gray-500">Agent is typing...</div>
  </div>
);

export default Loader;
EOF

cat > frontend/src/services/api.js << 'EOF'
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
EOF

cat > frontend/src/App.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-800;
  font-family: "Inter", sans-serif;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #a0aec0;
  border-radius: 3px;
}
EOF

cat > frontend/README.md << 'EOF'
# Voice Agent Frontend

## Setup Instructions

1. Install dependencies:
```bash
npm install