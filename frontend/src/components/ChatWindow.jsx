import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import MessageBubble from "./MessageBubble";
import VoiceRecorder from "./VoiceRecorder";
import Loader from "./Loader";

const ChatWindow = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [resumePreviewType, setResumePreviewType] = useState(null);
  const [resumeFiles, setResumeFiles] = useState({ docx_base64: null });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice agent control
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if voice is currently speaking

  // Create session on mount
  React.useEffect(() => {
    const createSession = async () => {
      setSessionLoading(true);
      try {
        const res = await axios.post("/session/create/");
        console.log("Session created:", res.data.session_id);
        setSessionId(res.data.session_id);
      } catch (error) {
        console.error("Error creating session:", error);
        alert("Failed to create session. Please check if the backend server is running on http://127.0.0.1:8000");
      } finally {
        setSessionLoading(false);
      }
    };
    createSession();
  }, []);

  const sendMessage = async () => {
    console.log("Send button clicked. SessionId:", sessionId, "Input:", input);
    
    if (!sessionId) {
      alert("Session not initialized. Please refresh the page.");
      return;
    }
    
    if (!input.trim()) {
      console.log("Empty input, not sending");
      return;
    }

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const messageText = input; // Store before clearing
    setInput("");
    setLoading(true);

    try {
      console.log("Sending message:", messageText, "with session:", sessionId);
      const res = await axios.post("/process-text/", { session_id: sessionId, text: messageText });
      console.log("Backend response:", res.data);  // Log to inspect structure
      const agentText = res.data.agent_text || res.data.message || res.data.response || res.data.text || "Response received.";
      const agentMsg = { sender: "agent", text: agentText };
      setMessages((prev) => [...prev, agentMsg]);

      // Speak the response if voice is enabled
      if (voiceEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(agentText);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errMsg = { sender: "agent", text: "Error: Unable to process message. " + (error.response?.data?.error || error.message) };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const generateResume = async () => {
    if (!sessionId || generatingResume) return;

    setGeneratingResume(true);
    
    // Add generating message
    const generatingMsg = { sender: "agent", text: "Generating your resume... Please wait." };
    setMessages((prev) => [...prev, generatingMsg]);

    try {
      const res = await axios.get(`/generate-cv/${sessionId}/`);
      console.log("Resume response:", res.data);  // Log to inspect
      const { docx_base64, html_content, note, cv_json } = res.data;

      // Fetch the CV data from the session
      const sessionRes = await axios.get(`/session/${sessionId}/`);
      console.log("Session response:", sessionRes.data);
      const sessionCvData = sessionRes.data.cv_json || cv_json || {};
      
      console.log("Navigating to CV Success page with data:", {
        hasCvData: !!sessionCvData,
        hasDocx: !!docx_base64,
        hasHtml: !!html_content,
        sessionId
      });

      // Navigate to CV Success page with all necessary data
      navigate('/cv-success', {
        state: {
          cvData: sessionCvData,
          docxBase64: docx_base64,
          htmlContent: html_content,
          sessionId: sessionId
        }
      });
    } catch (error) {
      console.error("Resume error:", error);
      const errMsg = { sender: "agent", text: "Error generating resume. Please try again." };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setGeneratingResume(false);
    }
  };

  // Toggle voice agent
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    // Stop any currently speaking text
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Stop current speech
  const stopSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Voice Control Section */}
      <div className="flex justify-between items-center mb-2 gap-2">
        {/* Speaking Indicator */}
        {isSpeaking && voiceEnabled && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm animate-pulse">
            <svg className="w-4 h-4 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a.75.75 0 01.75.75v14.5a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2z" />
              <path d="M6 6a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 016 6z" />
              <path d="M14 6a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 0114 6z" />
            </svg>
            <span className="font-medium">Agent Speaking...</span>
          </div>
        )}
        
        <div className="flex gap-2 ml-auto">
          {/* Stop Speech Button - Only shown when speaking */}
          {isSpeaking && (
            <button
              onClick={stopSpeech}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-all shadow-md"
              title="Stop speaking"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
              <span className="font-semibold">Stop</span>
            </button>
          )}
          
          {/* Voice Toggle Button */}
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-md ${
              voiceEnabled 
                ? 'bg-teal-500 text-white hover:bg-teal-600' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
            title={voiceEnabled ? 'Voice Agent: ON (Click to disable)' : 'Voice Agent: OFF (Click to enable)'}
          >
            {voiceEnabled ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                <span className="font-semibold">Voice ON</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                <span className="font-semibold">Voice OFF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-gray-50 rounded-md">
        {sessionLoading && (
          <div className="text-center text-gray-500 py-4">
            <Loader />
            <p className="mt-2">Initializing session...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} sender={msg.sender} text={msg.text} />
        ))}
        {loading && <Loader />}
      </div>

      <div className="flex items-center space-x-2 mb-2">
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
          disabled={loading || !sessionId || sessionLoading}
          className={`px-4 py-2 rounded-lg transition ${
            loading || !sessionId || sessionLoading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title={!sessionId ? 'Waiting for session...' : ''}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <button
        onClick={generateResume}
        disabled={generatingResume || !sessionId}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {generatingResume ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          'Generate Resume'
        )}
      </button>

      {/* Preview Modal/Popup */}
      {showPreviewModal && (resumePreviewType || resumeFiles.docx_base64) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-xl">Resume Preview & Download</h2>
              <div className="flex items-center space-x-2">
                {resumeFiles.docx_base64 && (
                  <button
                    onClick={() => {
                      const docxBlob = new Blob([
                        Uint8Array.from(atob(resumeFiles.docx_base64), (c) => c.charCodeAt(0)),
                      ], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                      const docxUrl = URL.createObjectURL(docxBlob);
                      const link = document.createElement('a');
                      link.href = docxUrl;
                      link.download = 'resume.docx';
                      link.click();
                    }}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Download DOCX
                  </button>
                )}
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {resumePreviewType === "html" && (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: resumePreview }}
                />
              )}

              {resumePreviewType === "message" && (
                <p className="text-sm text-gray-600">{resumePreview}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
