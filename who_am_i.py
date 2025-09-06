import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import google.generativeai as genai
import json
from googlesearch import search
import requests
from bs4 import BeautifulSoup
from maps import get_coordinates
from person import get_person_details
from gemini import generate_json

# Try to import API keys from the config file
try:
    from config import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY
except ImportError:
    GEMINI_API_KEY = None
    GOOGLE_MAPS_API_KEY = None

# Configure the Gemini API
if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY":
    genai.configure(api_key=GEMINI_API_KEY)

# --- Pydantic Models for Request Bodies ---
class PersonRequest(BaseModel):
    subject: str
    context: str | None = None
    session_id: str

class IncorrectGuessRequest(BaseModel):
    session_id: str
    name: str

router = APIRouter()
incorrect_guesses = {}

# --- API Endpoints ---
@router.get("/get_maps_key")
async def get_maps_key():
    if not GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY == "YOUR_GOOGLE_MAPS_API_KEY":
        raise HTTPException(status_code=500, detail="Google Maps API key not configured on the server.")
    return {"maps_key": GOOGLE_MAPS_API_KEY}

@router.post("/find_person")
async def find_person(request: PersonRequest):
    """
    This endpoint takes a subject and optional context and guesses a matching historical figure.
    It returns only the name and the reason for the guess.
    """
    if request.session_id not in incorrect_guesses:
        incorrect_guesses[request.session_id] = []

    print("incorrect_guesses:", incorrect_guesses)

    # Construct the prompt with explicit subject and context
    if request.context:
        base_prompt = (
            f"Identify the historical figure with the name '{request.subject}'. "
            f"Use the following context for disambiguation: '{request.context}'. "
            "The person to identify is always the one in the 'subject' field."
        )
    else:
        # This handles generic queries like "I have a dream" where the subject is the whole phrase
        base_prompt = f"Based on the following phrase, identify the best-matching historical figure: '{request.subject}'."

    # Add instructions for the output format
    base_prompt += (
        " Provide your answer as a JSON object with two keys: 'name' and 'reason'. "
        "The 'name' should be the figure's full, correct name. "
        "The 'reason' should be a concise, one-sentence explanation of why they are famous or relevant to the query."
    )

    if incorrect_guesses[request.session_id]:
        base_prompt += f"\n\nAvoid suggesting the following people: {', '.join(incorrect_guesses[request.session_id])}."

    prompt = base_prompt # The prompt is now fully constructed

    person_guess = generate_json(prompt)

    if not person_guess:
        raise HTTPException(status_code=500, detail="Failed to guess a person from the phrase.")

    if "name" not in person_guess or "reason" not in person_guess:
        raise HTTPException(status_code=500, detail="Invalid JSON format from guessing API.")

    return person_guess

@router.post("/incorrect_guess")
async def incorrect_guess(request: IncorrectGuessRequest):
    if request.session_id not in incorrect_guesses:
        incorrect_guesses[request.session_id] = []
    
    if request.name not in incorrect_guesses[request.session_id]:
        incorrect_guesses[request.session_id].append(request.name)
        
    return {"message": "OK"}


@router.get("/person/{person_name}")
async def get_person_data(person_name: str, request: Request):
    """
    This endpoint retrieves all details for a specific person by name.
    """
    context = request.query_params.get('context')
    session_id = request.query_params.get('session_id')
    
    incorrect_guesses_list = []
    if session_id and session_id in incorrect_guesses:
        incorrect_guesses_list = incorrect_guesses[session_id]

    person_details = get_person_details(person_name, context, incorrect_guesses_list)

    if not person_details:
        raise HTTPException(status_code=404, detail=f"Could not find details for {person_name}.")

    # Geocode the birth and death places
    if GOOGLE_MAPS_API_KEY:
        person_details['birth_coords'] = get_coordinates(person_details.get('birth_place'), GOOGLE_MAPS_API_KEY)
        person_details['death_coords'] = get_coordinates(person_details.get('death_place'), GOOGLE_MAPS_API_KEY)
    else:
        person_details['birth_coords'] = None
        person_details['death_coords'] = None
        print("Warning: GOOGLE_MAPS_API_KEY not found. Skipping geocoding.")
    
    return person_details

@router.get("/get_image")
async def get_image(query: str):
    """
    This endpoint takes a search query, finds a relevant webpage,
    and tries to scrape a high-quality image URL from it.
    If it fails, it returns an empty string for the image URL.
    """
    image_url = ""
    try:
        # Use the googlesearch library to find relevant webpage URLs
        search_query = f"{query} wikipedia"
        
        # Iterate through a few search results to find a valid one
        for page_url in search(search_query, num_results=3, lang="en"):
            # Ensure the URL is absolute
            if page_url and page_url.startswith('http'):
                try:
                    # Fetch the content of the page
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36)"
                    }
                    response = requests.get(page_url, headers=headers, timeout=5)
                    response.raise_for_status()

                    # Parse the HTML and look for the Open Graph image tag
                    soup = BeautifulSoup(response.content, 'html.parser')
                    og_image = soup.find('meta', property='og:image')

                    if og_image and og_image.get('content') and og_image['content'].startswith('http'):
                        image_url = og_image['content']
                        # Found a valid image, break the loop
                        break 
                except requests.exceptions.RequestException as e:
                    # This specific page failed, continue to the next search result
                    print(f"Could not fetch or parse page {page_url}: {e}")
                    continue
        
        # If after trying a few pages, we still have no URL, we log it.
        if not image_url:
            print(f"Could not find a valid og:image for query: {query}")

    except Exception as e:
        print(f"An error occurred during image search for query '{query}': {e}")
    
    # Return the found URL or an empty string
    return {"image_url": image_url}