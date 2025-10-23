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
