from openai import OpenAI
from core.config import get_settings

_client = None

def get_client() -> OpenAI:
    global _client
    if not _client:
        cfg = get_settings()
        _client = OpenAI(
            api_key=cfg.deepseek_api_key,
            base_url="https://api.deepseek.com"
        )
    return _client

def call_llm(prompt: str, max_tokens: int = 500, model: str = "deepseek-chat") -> str:
    client = get_client()
    resp = client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.choices[0].message.content
