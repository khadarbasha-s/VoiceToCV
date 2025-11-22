import React, { useState } from "react";
import axios from "../services/api";
import MessageBubble from "./MessageBubble";
import VoiceRecorder from "./VoiceRecorder";
import Loader from "./Loader";

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [resumePreviewType, setResumePreviewType] = useState(null);
  const [resumeFiles, setResumeFiles] = useState({ docx_base64: null });

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
    if (!sessionId) return;

    try {
      const res = await axios.get(`/generate-cv/${sessionId}/`);
      console.log("Resume response:", res.data);  // Log to inspect
      const { docx_base64, html_content, note } = res.data;

      // Store preview and file data for inline display and manual download
      if (html_content) {
        setResumePreview(html_content);
        setResumePreviewType("html");
      } else {
        setResumePreview(null);
        setResumePreviewType(null);
      }

      setResumeFiles({ docx_base64: docx_base64 || null });

      const successMsg = {
        sender: "agent",
        text: note || "Resume generated successfully! DOCX is ready to download and an HTML preview is available."
      };
      setMessages((prev) => [...prev, successMsg]);
    } catch (error) {
      console.error("Resume error:", error);
      const errMsg = { sender: "agent", text: "Error generating resume." };
      setMessages((prev) => [...prev, errMsg]);
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
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
      >
        Generate Resume
      </button>

      {(resumePreviewType || resumeFiles.docx_base64) && (
        <div className="mt-4 border rounded-md p-3 bg-white max-h-[60vh] overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Resume Preview & Download</h2>
            <div className="space-x-2">
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
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Download DOCX
                </button>
              )}
            </div>
          </div>

          {resumePreviewType === "html" && (
            <div
              className="prose max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: resumePreview }}
            />
          )}

          {resumePreviewType === "message" && (
            <p className="text-sm text-gray-600">{resumePreview}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
