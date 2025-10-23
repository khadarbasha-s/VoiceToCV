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
