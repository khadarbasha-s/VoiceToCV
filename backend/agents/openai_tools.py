from django.conf import settings

try:
    # Newer split packages (recommended)
    from langchain_openai import ChatOpenAI
except ImportError:
    try:
        # Older LangChain versions
        from langchain.chat_models import ChatOpenAI  # type: ignore
    except ImportError as e:  # pragma: no cover - hard failure path
        raise ImportError(
            "ChatOpenAI is not available. Install 'langchain-openai' or use a LangChain version "
            "that provides langchain.chat_models.ChatOpenAI."
        ) from e

try:
    from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
except ImportError:
    # Fallback for older monolithic langchain versions
    from langchain.schema import HumanMessage, SystemMessage, AIMessage  # type: ignore


def openai_chat_completion(system_prompt, messages, model="gpt-3.5-turbo", temperature=0):
    """Call an LLM via LangChain's ChatOpenAI.

    Args:
        system_prompt: Optional high-level system instruction.
        messages: list of {'role': 'system'|'user'|'assistant', 'content': str}
        model: OpenAI chat model name.
        temperature: sampling temperature.

    Returns:
        str: The assistant's message content.
    """

    llm = ChatOpenAI(
        model=model,
        temperature=temperature,
        openai_api_key=settings.OPENAI_API_KEY,
        max_tokens=800,
    )

    lc_messages = []

    if system_prompt:
        lc_messages.append(SystemMessage(content=system_prompt))

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            lc_messages.append(SystemMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))

    # Newer langchain-openai uses .invoke instead of direct __call__
    response = llm.invoke(lc_messages)
    return response.content
