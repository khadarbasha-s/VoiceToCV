import os
from openai import OpenAI
from django.conf import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def openai_chat_completion(system_prompt, messages, model="gpt-3.5-turbo", temperature=0):
    """
    messages: list of {'role':'system'|'user'|'assistant', 'content':...}
    """
    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=800
    )
    return resp.choices[0].message.content
