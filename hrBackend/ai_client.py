import requests
import os
import json

methods = {
    "model": "model",
    "prompt": "prompt",
    "azure": "azure"
}

AI_API_URL = os.getenv("AI_API_URL", "http://localhost:5001")

def extract_psychometrics(text: str, method: str, base_url: str = AI_API_URL) -> dict:
    """
    Sends a POST request to the AI service to extract psychometric data.

    Parameters:
        text (str): The input text for extraction.
        method (str): The extraction method ('model', 'prompt', or 'azure').
        base_url (str): The base URL of the AI service. Default is 'http://127.0.0.1:5001'.

    Returns:
        dict: The JSON response from the AI service.

    Raises:
        Exception: If the request fails or the server returns an error.
    """
    endpoint = f"{base_url}/api/psychometrics"
    payload = {
        "text": text,
        "method": method.lower()  # Normalize the method to lowercase
    }
    try:
        response = requests.post(endpoint, json=payload)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)
        return response.json()
    except requests.RequestException as e:
        raise Exception(f"Extraction request failed: {e}")

# Runner / Example usage:
if __name__ == '__main__':
    sample_text = "This is a sample text for psychometric extraction."
    extraction_method = "model"  # Options: "model", "prompt", or "azure"
    
    try:
        result = extract_psychometrics(sample_text, extraction_method)
        print("Extraction result:")
        print(json.dumps(result, indent=4))
    except Exception as err:
        print("Error:", err)
