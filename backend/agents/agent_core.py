import json
import copy
from .openai_tools import openai_chat_completion
from .memory_handler import get_conversation_for_agent
from utils.logger import logger


class AgentCore:
    def __init__(self):
        self._base_template = {
            "personal_info": {
                "name": "",
                "email": "",
                "phone": "",
                "address": "",
            },
            "education": [],
            "experience": [],
            "skills": [],
            "projects": [],
            "certifications": [],
            "meta": {
                "skip_experience": False,
                "skip_certifications": False,
                "projects_confirmed": False,
                "project_detail_turns": 0,
            },
        }

    def _ensure_list(self, value):
        if isinstance(value, list):
            return value
        if value in (None, ""):
            return []
        if isinstance(value, dict):
            return [value]
        return [value]

    def _normalize_entry(self, entry, key_map=None):
        """Normalize keys and remove empty values."""
        if isinstance(entry, dict):
            normalized = {k.lower(): v for k, v in entry.items() if v not in (None, "")}
            if key_map:
                for alias, target in key_map.items():
                    if alias in normalized and target not in normalized:
                        normalized[target] = normalized[alias]
            return normalized
        if isinstance(entry, str):
            return {"description": entry.strip()}
        return {}

    def _parse_education_description(self, entry):
        """Extract degree/institute from description if missing."""
        if entry.get("degree") and entry.get("institute"):
            return entry
        description = entry.get("description", "")
        if not description:
            return entry

        parts = description.split(" in ")
        if len(parts) == 2:
            entry.setdefault("degree", parts[0].strip())
            remainder = parts[1]
        else:
            entry.setdefault("degree", description.strip())
            remainder = ""

        if remainder:
            entry.setdefault("institute", remainder.strip())
        entry.pop("description", None)
        return entry

    def _parse_experience_description(self, entry):
        """Extract role/company from description if missing."""
        if entry.get("role") and entry.get("company"):
            return entry
        description = entry.get("description", "")
        if not description:
            return entry
        if " at " in description:
            role, company = description.split(" at ", 1)
            entry.setdefault("role", role.strip())
            entry.setdefault("company", company.strip())
        return entry

    def _merge_dict(self, base, incoming):
        merged = dict(base)
        for key, value in incoming.items():
            if isinstance(value, (list, dict)):
                merged[key] = value
            elif value not in (None, ""):
                merged[key] = value
        return merged

    def _dedupe_strings(self, items):
        seen = {}
        for item in items:
            if not item:
                continue
            key = str(item).strip().lower()
            if key and key not in seen:
                seen[key] = item.strip()
        return list(seen.values())

    def _normalize_cv_json(self, session, parsed_cv):
        base = copy.deepcopy(self._base_template)
        existing = copy.deepcopy(session.cv_json or {})
        existing = self._merge_dict(base, existing)
        incoming = parsed_cv or {}

        # ---- PERSONAL INFO ----
        personal = existing.get("personal_info", {})
        personal_fields = ["name", "email", "phone", "address"]
        for field in personal_fields:
            personal.setdefault(field, "")
        incoming_personal = {k.lower(): str(v).strip() for k, v in incoming.get("personal_info", {}).items() if v}

        alias_map = {
            "full_name": "name",
            "firstname": "name",
            "first_name": "name",
            "last_name": "name",
            "mail": "email",
            "email_address": "email",
            "e-mail": "email",
            "mobile": "phone",
            "phone_number": "phone",
            "contact_number": "phone",
            "location": "address",
            "current_location": "address",
            "city": "address",
        }

        # Apply alias mapping
        for alias, target in alias_map.items():
            if alias in incoming_personal and not incoming_personal.get(target):
                incoming_personal[target] = incoming_personal[alias]

        for field in personal_fields:
            value = incoming_personal.get(field)
            if value:
                personal[field] = value

        existing["personal_info"] = personal

        # ---- META ----
        meta = existing.get("meta", {}) if isinstance(existing.get("meta"), dict) else {}
        incoming_meta = incoming.get("meta", {}) if isinstance(incoming.get("meta"), dict) else {}
        prev_skip_experience = bool(meta.get("skip_experience"))
        prev_skip_certifications = bool(meta.get("skip_certifications"))
        prev_projects_confirmed = bool(meta.get("projects_confirmed"))
        prev_project_detail_turns = int(meta.get("project_detail_turns") or 0)

        meta.update({k: v for k, v in incoming_meta.items() if v not in (None, "")})

        meta["skip_experience"] = bool(meta.get("skip_experience") or prev_skip_experience)
        meta["skip_certifications"] = bool(meta.get("skip_certifications") or prev_skip_certifications)
        meta["projects_confirmed"] = bool(meta.get("projects_confirmed") or prev_projects_confirmed)
        meta["project_detail_turns"] = int(meta.get("project_detail_turns") or prev_project_detail_turns or 0)
        existing["meta"] = meta

        # ---- EDUCATION ----
        education_aliases = {"college": "institute"}
        existing_edu = [
            self._parse_education_description(self._normalize_entry(ed, education_aliases))
            for ed in self._ensure_list(existing.get("education", []))
        ]
        incoming_edu = [
            self._parse_education_description(self._normalize_entry(ed, education_aliases))
            for ed in self._ensure_list(incoming.get("education", []))
        ]

        if incoming_edu:
            for idx, new_ed in enumerate(incoming_edu):
                if idx < len(existing_edu):
                    existing_edu[idx] = self._merge_dict(existing_edu[idx], new_ed)
                else:
                    existing_edu.append(new_ed)
        existing["education"] = [ed for ed in existing_edu if ed]

        # ---- EXPERIENCE ----
        existing_exp = [
            self._parse_experience_description(self._normalize_entry(exp))
            for exp in self._ensure_list(existing.get("experience", []))
        ]
        incoming_exp = [
            self._parse_experience_description(self._normalize_entry(exp))
            for exp in self._ensure_list(incoming.get("experience", []))
        ]
        if incoming_exp:
            for idx, new_exp in enumerate(incoming_exp):
                if idx < len(existing_exp):
                    existing_exp[idx] = self._merge_dict(existing_exp[idx], new_exp)
                else:
                    existing_exp.append(new_exp)
        existing["experience"] = [exp for exp in existing_exp if exp]

        if existing["experience"]:
            if not existing.setdefault("meta", {}).get("skip_experience"):
                existing["meta"]["skip_experience"] = False

        # ---- SKILLS / PROJECTS / CERTIFICATIONS ----
        for section in ["skills", "projects", "certifications"]:
            incoming_list = self._ensure_list(incoming.get(section, []))
            if section == "skills":
                combined = existing.get("skills", []) + incoming_list
                existing["skills"] = self._dedupe_strings(combined)
            else:
                existing_list = self._ensure_list(existing.get(section, []))
                for idx, new_item in enumerate(incoming_list):
                    if idx < len(existing_list):
                        existing_list[idx] = self._merge_dict(existing_list[idx], new_item)
                    else:
                        existing_list.append(new_item)
                existing[section] = [i for i in existing_list if i]

        return existing

    def _next_required_question(self, cv_json):
        """Determine the next missing field question."""
        personal = cv_json.get("personal_info", {})
        if not personal.get("name"):
            return "Can you please provide your full name?"
        if not personal.get("email"):
            return "What's your email address?"
        if not personal.get("phone"):
            return "Could you share your phone number?"
        if not personal.get("address"):
            return "What is your current address?"

        education = cv_json.get("education", [])
        if not education:
            return "Could you tell me about your highest education qualification and the institute?"
        edu = education[0]
        if not edu.get("degree"):
            return "What degree did you complete?"
        if not edu.get("institute"):
            return "Which institute or college did you attend?"
        if not edu.get("start_year"):
            return "What year did you start this course? (YYYY)"
        if not edu.get("end_year"):
            return "What year did you finish? (YYYY)"

        experience = cv_json.get("experience", [])
        skip_experience = cv_json.get("meta", {}).get("skip_experience")
        if not experience and not skip_experience:
            return "Do you have any work experience you'd like to include?"
        if experience:
            exp = experience[0]
            if not exp.get("role"):
                return "What was your job title or role?"
            if not exp.get("company"):
                return "Which company did you work for?"
            if not exp.get("start_date"):
                return "When did you start this role? (YYYY-MM)"
            if not exp.get("end_date"):
                return "When did you finish this role? (YYYY-MM or 'Present')"
            if not exp.get("description"):
                return "Could you briefly describe your responsibilities in that role?"

        if not cv_json.get("skills"):
            return "Could you share some of your key skills?"
        if not cv_json.get("projects"):
            return "Would you like to add a project? Please include the project name and a short description."

        certifications = cv_json.get("certifications", [])
        skip_certifications = cv_json.get("meta", {}).get("skip_certifications")
        if skip_certifications:
            certifications = []
        if not certifications and not skip_certifications:
            return "Do you have any certifications to add?"

        projects_confirmed = cv_json.get("meta", {}).get("projects_confirmed")
        if cv_json.get("projects") and not projects_confirmed:
            return "Could you share a brief summary of your role and key contributions for your main project?"

        return None

    def process_user_message(self, session, user_text):
        """Core interaction between agent and user."""
        messages = get_conversation_for_agent(session)

        last_agent_prompt = ""
        for item in reversed(session.conversation):
            if item.get("from") == "agent":
                last_agent_prompt = item.get("text", "")
                break

        user_lower = user_text.lower()
        last_agent_prompt_lower = last_agent_prompt.lower()

        no_experience_phrases = [
            "no experience",
            "don't have experience",
            "do not have experience",
            "dont have experience",
            "no i dont have experience",
            "no, i don't have experience",
            "no, i dont have experience",
            "no i don't have experience",
            "no experience yet",
            "fresher",
            "i am a fresher",
            "i'm a fresher",
            "no work experience",
            "haven't worked",
            "havent worked",
            "never worked",
            "no prior experience",
            "no experiance",
            "dont have experiance",
        ]
        user_declined_experience = any(phrase in user_lower for phrase in no_experience_phrases)

        if not user_declined_experience and "experienc" in user_lower:
            negative_tokens = ["no", "don't", "dont", "do not", "haven't", "havent", "never", "none"]
            user_declined_experience = any(token in user_lower for token in negative_tokens)

        if not user_declined_experience and "experience" in last_agent_prompt_lower:
            concise_negative_replies = [
                "no",
                "nope",
                "none",
                "not yet",
                "no i dont have",
                "no i don't have",
                "i dont have",
                "i don't have",
                "dont have",
                "don't have",
                "nil",
            ]
            stripped_lower = user_lower.strip()
            user_declined_experience = any(stripped_lower.startswith(reply) for reply in concise_negative_replies)

        # Detect explicit decline of certifications when last question was about certifications
        user_declined_certifications = False
        if "certification" in last_agent_prompt_lower or "certifications" in last_agent_prompt_lower:
            cert_negative_replies = [
                "no",
                "nope",
                "none",
                "no i dont have",
                "no i don't have",
                "i dont have",
                "i don't have",
                "dont have",
                "don't have",
                "no certification",
                "no certifications",
                "no certificate",
                "no certificates",
            ]
            stripped_lower = user_lower.strip()
            if any(stripped_lower.startswith(reply) for reply in cert_negative_replies):
                user_declined_certifications = True

        instruction = (
            "Analyze the conversation and: "
            "1) If the user is providing CV info, update the structured CV JSON using only these keys: "
            "personal_info(name,email,phone,address), education(degree,institute,start_year,end_year), "
            "experience(company,role,start_date,end_date,description), skills(list of strings), "
            "projects(project_name,description,technologies), certifications(name,issuer,year). "
            "2) Ask one follow-up question for the next missing field. "
            "3) If unrelated to CV, answer briefly. "
            "Respond strictly in JSON: {\"agent_text\":\"...\",\"cv_json\":{...},\"next_action\":\"ask|answer|complete\"}."
        )
        messages.append({"role": "user", "content": instruction + f"\n\nUser said: {user_text}"})

        try:
            resp = openai_chat_completion(None, messages, model="gpt-3.5-turbo", temperature=0)
        except Exception as e:
            return {"error": str(e)}

        try:
            parsed = json.loads(resp)
        except Exception:
            return {"agent_text": resp, "cv_json": session.cv_json, "next_action": "answer"}

        normalized_cv = self._normalize_cv_json(session, parsed.get("cv_json", session.cv_json))
        meta = normalized_cv.setdefault("meta", {})

        if user_declined_experience:
            meta["skip_experience"] = True
            normalized_cv["experience"] = []

        if meta.get("skip_experience") and not normalized_cv.get("experience"):
            meta["skip_experience"] = True

        if user_declined_certifications:
            meta["skip_certifications"] = True
            normalized_cv["certifications"] = []
        elif meta.get("skip_certifications"):
            normalized_cv["certifications"] = []

        project_followup_keywords = [
            "more detail",
            "responsibil",
            "contribution",
            "your role",
            "your responsibilities",
            "key contributions",
        ]
        is_project_followup = (
            "project" in last_agent_prompt_lower
            and any(keyword in last_agent_prompt_lower for keyword in project_followup_keywords)
        )

        if is_project_followup:
            meta["project_detail_turns"] = meta.get("project_detail_turns", 0) + 1
            if len(user_text.strip().split()) >= 6 or len(user_text.strip()) >= 40:
                meta["projects_confirmed"] = True
        else:
            meta.setdefault("project_detail_turns", meta.get("project_detail_turns", 0))

        if meta.get("project_detail_turns", 0) >= 2:
            meta["projects_confirmed"] = True

        next_question = self._next_required_question(normalized_cv)
        agent_text = parsed.get("agent_text", "").strip()
        next_action = parsed.get("next_action", "ask")

        is_complete = next_question is None

        completion_prompt = "Thank you for providing the details. All key details are captured! Would you like me to generate your CV now?"

        stripped_lower = user_lower.strip()
        affirm_exact = {
            "yes",
            "y",
            "yep",
            "yup",
            "yeah",
            "sure",
            "ok",
            "okay",
            "please",
            "s",
        }
        affirm_contains = [
            "generate",
            "create",
            "go ahead",
            "do it",
            "make it",
            "ready",
            "proceed",
            "let's do",
            "lets do",
            "download",
        ]
        decline_exact = {
            "no",
            "not now",
            "not yet",
            "nope",
            "later",
        }
        decline_contains = [
            "don't",
            "dont",
            "maybe later",
            "hold on",
        ]

        intent_generate = (
            stripped_lower in affirm_exact
            or any(phrase in user_lower for phrase in affirm_contains)
        )
        intent_decline = (
            stripped_lower in decline_exact
            or any(phrase in user_lower for phrase in decline_contains)
        )

        if is_complete:
            if intent_generate:
                agent_text = "Great! I'll prepare your CV now. Please click the 'Generate Resume' button to view the preview and download your files."
                next_action = "complete"
            elif intent_decline:
                agent_text = "No problem. Let me know whenever you're ready to generate your CV."
                next_action = "complete"
            else:
                agent_text = completion_prompt
                next_action = "complete"
        elif not agent_text:
            if next_question:
                agent_text = next_question
                next_action = "ask"
            else:
                agent_text = completion_prompt
                next_action = "complete"

        if meta.get("projects_confirmed") and "project" in agent_text.lower():
            if next_question and "project" not in (next_question or "").lower():
                agent_text = next_question
                next_action = "ask"
            elif not next_question:
                agent_text = completion_prompt
                next_action = "complete"

        if meta.get("skip_certifications") and "certification" in agent_text.lower():
            if next_question and "certification" not in (next_question or "").lower():
                agent_text = next_question
                next_action = "ask"
            elif not next_question:
                agent_text = completion_prompt
                next_action = "complete"

        if next_action == "complete" and not is_complete:
            next_action = "ask"
            agent_text = next_question or agent_text

        session.cv_json = normalized_cv
        session.is_complete = is_complete
        session.conversation.append({"from": "agent", "text": agent_text})
        session.save()

        try:
            logger.info(
                json.dumps(
                    {
                        "session_id": str(session.session_id),
                        "user_text": user_text,
                        "agent_text": agent_text,
                        "next_action": next_action,
                        "is_complete": is_complete,
                        "meta": normalized_cv.get("meta", {}),
                    }
                )
            )
        except Exception:
            pass

        return {"agent_text": agent_text, "cv_json": normalized_cv, "next_action": next_action}
