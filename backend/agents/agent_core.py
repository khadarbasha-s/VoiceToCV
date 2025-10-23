import json
from .openai_tools import openai_chat_completion
from .memory_handler import get_conversation_for_agent

class AgentCore:
    def __init__(self):
        # minimal initialization (could add LangChain here later)
        pass

    def process_user_message(self, session, user_text):
        """
        Given a session model and user_text, decide to update CV JSON, ask next question,
        or answer user doubt (external Q&A).
        Returns: dict { 'agent_text': "...", 'cv_json': {...}, 'next_action': 'ask'|'answer'|'complete' }
        """
        # Build messages (system + conversation)
        messages = get_conversation_for_agent(session)
        # Add a user instruction to convert latest input to JSON update
        instruction = (
            "Analyze the conversation and: "
            "1) If the user is giving CV info, extract/update the structured CV JSON with fields: "
            "personal_info (name,email,phone,address), education (degree,institute,start_year,end_year), experience (company,role,start_date,end_date,description), skills (list), projects (project_name,description), certifications (name,issuer,year). "
            "2) If some fields are missing, ask exactly one clear question to collect the next missing field. "
            "3) If the user asks a general question unrelated to CV, answer it concisely. "
            "4) Respond with JSON wrapper: {\"agent_text\":\"...\",\"cv_json\":{...},\"next_action\":\"ask|answer|complete\"} ONLY."
        )
        messages.append({"role": "user", "content": instruction + f"\n\nLatest user input: {user_text}"})

        # Call OpenAI
        try:
            resp = openai_chat_completion(None, messages, model="gpt-3.5-turbo", temperature=0)
        except Exception as e:
            return {"error": str(e)}

        # Parse response (expect JSON)
        try:
            parsed = json.loads(resp)
        except Exception:
            # fallback: wrap text answer
            return {"agent_text": resp, "cv_json": session.cv_json, "next_action": "answer"}

        # Update session.cv_json and conversation
        new_cv = parsed.get("cv_json", session.cv_json)
        agent_text = parsed.get("agent_text", "")
        next_action = parsed.get("next_action", "ask")
        session.cv_json = new_cv
        session.conversation.append({"from": "agent", "text": agent_text})
        session.is_complete = (next_action == "complete")
        session.save()

        # Optionally speak
        # from .voice_handler import speak_text
        # speak_text(agent_text)

        return {"agent_text": agent_text, "cv_json": new_cv, "next_action": next_action}
