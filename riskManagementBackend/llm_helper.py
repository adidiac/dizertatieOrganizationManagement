# backend/llm_helper.py

import os
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv() 

# Load key
_api_key = os.getenv("OPENAI_API_KEY")
if not _api_key:
    raise RuntimeError("OPENAI_API_KEY must be set in the environment")

# Instantiate the v1 client
client = OpenAI(api_key=_api_key)

def call_llm_for_recommendation(prompt: str, model="gpt-4", max_tokens: int = 150) -> str:
    """
    Uses the v1 ChatCompletion API to get a cybersecurity recommendation.
    """
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a cybersecurity advisor."},
            {"role": "user",   "content": prompt}
        ],
        max_tokens=max_tokens,
        temperature=0.7,
    )

    # Access the text from the ChatCompletion object
    return resp.choices[0].message.content.strip()


if __name__ == "__main__":
    test_prompt = (
        "Given compromised nodes Person_1 and Person_3 with scores 0.8 and 0.6, "
        "what mitigation strategies do you recommend?"
    )
    print(call_llm_for_recommendation(test_prompt))
