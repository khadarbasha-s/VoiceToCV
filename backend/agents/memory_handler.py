def get_conversation_for_agent(session):
    """
    Convert stored conversation into messages consumable by LLM.
    """
    messages = []
    # Add system prompt to instruct agent
    system = {
        "role": "system",
        "content": (
            "You are a CV Assistant for blue-collar / basic education users (PUC, Diploma, Degree). "
            "Collect personal_info, education, experience, skills, projects, certifications. "
            "Output should be JSON only when asked for structured data. "
            "Ask next question to fill missing fields. Be polite and concise."
        )
    }
    messages.append(system)
    for item in session.conversation:
        role = "assistant" if item.get("from") == "agent" else "user"
        messages.append({"role": role, "content": item.get("text", "")})
    return messages
