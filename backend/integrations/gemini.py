import json
import re
import time
from google import genai
from google.genai import types
from core.config import get_settings

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if not _client:
        cfg = get_settings()
        _client = genai.Client(api_key=cfg.gemini_api_key)
    return _client


EXTRACTION_PROMPT = """You are an AI Chief of Staff. Analyze this meeting recording and extract structured information.

Return ONLY valid JSON in this exact format:
{
  "title": "short meeting title (max 60 chars)",
  "participants": ["name1", "name2"],
  "summary": "2-3 sentence summary of what was discussed and decided",
  "action_items": [
    {
      "title": "clear action item",
      "owner": "person responsible (or 'Me' if it is the user's task)",
      "due_date": "YYYY-MM-DD or null",
      "priority": "High|Normal|Low"
    }
  ],
  "follow_up_emails": [
    {
      "to_name": "recipient name",
      "to_email": "recipient@example.com or empty string",
      "subject": "email subject",
      "body": "full email body ready to send"
    }
  ],
  "commitments_made": [
    "I committed to X by Y date",
    "They committed to Z"
  ],
  "next_meeting": {
    "suggested": true,
    "title": "Follow-up: Meeting Title",
    "duration_mins": 30,
    "suggested_timeframe": "next week"
  }
}

Be specific. Extract real names, dates, and commitments from the recording.
If something is not mentioned, use empty arrays or null.
Return only the JSON object, no other text."""


def analyze_meeting(file_path: str, mime_type: str = "audio/mp4") -> dict:
    client = _get_client()

    # Upload file using Files API
    with open(file_path, "rb") as f:
        uploaded = client.files.upload(
            file=f,
            config=types.UploadFileConfig(mime_type=mime_type),
        )

    # Wait for file to be ACTIVE
    for _ in range(30):
        uploaded = client.files.get(name=uploaded.name)
        if uploaded.state.name == "ACTIVE":
            break
        if uploaded.state.name == "FAILED":
            raise ValueError("Gemini file processing failed")
        time.sleep(2)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_uri(file_uri=uploaded.uri, mime_type=mime_type),
            EXTRACTION_PROMPT,
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=2048,
        ),
    )

    # Clean up uploaded file
    try:
        client.files.delete(name=uploaded.name)
    except Exception:
        pass

    raw = response.text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    return json.loads(raw)
