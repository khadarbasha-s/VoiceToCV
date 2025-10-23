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
