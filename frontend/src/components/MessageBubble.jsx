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
