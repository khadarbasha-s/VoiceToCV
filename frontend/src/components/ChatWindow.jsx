import React, { useState } from "react";
import axios from "../services/api";
import MessageBubble from "./MessageBubble";
import VoiceRecorder from "./VoiceRecorder";
import Loader from "./Loader";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [resumePreviewType, setResumePreviewType] = useState(null);
  const [resumeFiles, setResumeFiles] = useState({ docx_base64: null });
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Create session on mount
  React.useEffect(() => {
    const createSession = async () => {
      try {
        const res = await axios.post("/session/create/");
        setSessionId(res.data.session_id);
      } catch (error) {
        console.error("Error creating session:", error);
      }
    };
    createSession();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/process-text/", { session_id: sessionId, text: input });
      console.log("Backend response:", res.data);  // Log to inspect structure
      const agentText = res.data.agent_text || res.data.message || res.data.response || res.data.text || "Response received.";
      const agentMsg = { sender: "agent", text: agentText };
      setMessages((prev) => [...prev, agentMsg]);

      // Speak the response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(agentText);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      const errMsg = { sender: "agent", text: "Error: Unable to process message." };
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
      const { docx_base64, html_content, note } = res.data;

      // Store preview and file data
      if (html_content) {
        setResumePreview(html_content);
        setResumePreviewType("html");
      } else {
        setResumePreview(null);
        setResumePreviewType(null);
      }

      setResumeFiles({ docx_base64: docx_base64 || null });

      // Show preview in popup
      setShowPreviewModal(true);

      const successMsg = {
        sender: "agent",
        text: note || "Resume generated successfully! DOCX is ready to download and an HTML preview is available."
      };
      setMessages((prev) => [...prev, successMsg]);
    } catch (error) {
      console.error("Resume error:", error);
      const errMsg = { sender: "agent", text: "Error generating resume." };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setGeneratingResume(false);
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Send
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
