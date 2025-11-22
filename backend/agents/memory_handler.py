def get_conversation_for_agent(session):
    """
    Convert stored conversation into messages consumable by LLM.
    """
    messages = []
    # Add system prompt to instruct agent
    preferred_language = "auto"
    try:
        meta = session.cv_json.get("meta", {}) if isinstance(session.cv_json, dict) else {}
        preferred_language = meta.get("preferred_language", "auto") or "auto"
    except AttributeError:
        preferred_language = "auto"

    language_clause = (
        f"Respond in the user's language. If a preferred language is set, use {preferred_language}. "
        if preferred_language != "auto"
        else "Mirror the user's language in every reply. "
    )

    system = {
        "role": "system",
        "content": (
            "You are a CV Assistant for blue-collar / basic education users (PUC, Diploma, Degree). "
            "Collect personal_info, education, experience, skills, projects, certifications. "
            "Output should be JSON only when asked for structured data. "
            "Ask next question to fill missing fields. Be polite and concise. "
            + language_clause
        )
    }
    messages.append(system)
    for item in session.conversation:
        role = "assistant" if item.get("from") == "agent" else "user"
        messages.append({"role": role, "content": item.get("text", "")})
    return messages
