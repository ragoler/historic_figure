import google.generativeai as genai
import json

def generate_json(prompt: str) -> dict | None:
    """
    Calls the Gemini API with a prompt and returns the response as a JSON object.
    """
    print("Gemini prompt:", prompt)
    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    try:
        response = model.generate_content(prompt)
        print("Gemini response:", response.text)
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_text)
    except Exception as e:
        print(f"An error occurred in generate_json: {e}")
        return None
