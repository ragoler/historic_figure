import google.generativeai as genai
import json

def get_person_details(name: str) -> dict | None:
    """
    Fetches detailed information for a given historical figure using the Gemini API.
    """
    model = genai.GenerativeModel('gemini-2.5-flash-lite')

    prompt = (
        f"Provide a detailed profile for the historical figure: {name}. "
        "Return the information as a JSON object with the following keys: "
        "'name', 'reason', 'image_query', 'birth_place', 'death_place', 'parents', 'spouse', 'children', 'siblings'.\n"
        "- 'name': The person's full name.\n"
        "- 'reason': A concise, one-sentence explanation of why they are famous.\n"
        "- 'image_query': A good search query for a portrait of the person.\n"
        "- 'birth_place', 'death_place': City and country, or 'N/A' if unknown.\n"
        "- 'parents', 'children', 'siblings': An array of strings with names. Return an empty array [] if unknown.\n"
        "- 'spouse': A string with the spouse's name. Return an empty string \"\" if unknown or not applicable."
    )

    try:
        response = model.generate_content(prompt)
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        print(cleaned_text)
        person_data = json.loads(cleaned_text)

        # Validate the JSON structure
        required_keys = ["name", "reason", "image_query", "birth_place", "death_place", "parents", "spouse", "children", "siblings"]
        if not all(key in person_data for key in required_keys):
            print(f"Invalid JSON format from get_person_details for {name}. Missing keys.")
            return None

        return person_data
    except Exception as e:
        print(f"An error occurred in get_person_details for {name}: {e}")
        return None
