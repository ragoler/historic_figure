import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import json
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from googlesearch import search
import requests
from bs4 import BeautifulSoup


# Try to import the API key from the config file
try:
    from config import GEMINI_API_KEY
except ImportError:
    GEMINI_API_KEY = None

# Configure the Gemini API
if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY":
    genai.configure(api_key=GEMINI_API_KEY)

# --- Pydantic Models for Request Bodies ---
class PhraseRequest(BaseModel):
    phrase: str
    previous_guesses: list[str] = []

# --- FastAPI App Initialization ---
app = FastAPI()

# --- CORS Middleware ---
# This allows the frontend (running on a different origin) to communicate with the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# --- API Endpoints ---
@app.post("/find_person")
async def find_person(request: PhraseRequest):
    """
    This endpoint takes a user's phrase and finds a matching historical figure using the Gemini API.
    """
    

    model = genai.GenerativeModel('gemini-2.5-flash-lite')
    #model = genai.GenerativeModel('gemini-2.5-pro')

    # Constructing the prompt for the Gemini API
    base_prompt = (
        "Based on the following phrase, identify the best-matching historical figure. "
        "Provide your answer as a JSON object with three keys: 'name', 'reason' and 'image_query'. "
        "The 'name' should be the historical figure's name, the 'reason' should be a concise, one-sentence explanation "
        "of why they are a good match for the phrase, and the 'image_query' should be a search query to find an image of the person."
    )

    if request.previous_guesses:
        base_prompt += f"\n\nAvoid suggesting the following people: {', '.join(request.previous_guesses)}."

    prompt = f"{base_prompt}\n\nPhrase: \"{request.phrase}\""

    try:
        # Calling the Gemini API
        response = model.generate_content(prompt)
        
        # Clean the response to extract the JSON part
        cleaned_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        print(cleaned_text)
        
        # Parse the JSON string into a Python dictionary
        person_data = json.loads(cleaned_text)

        if "name" not in person_data or "reason" not in person_data or "image_query" not in person_data:
            raise ValueError("Invalid JSON format from API")

        return person_data

    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail="Failed to get a response from the Gemini API or parse its response.")

@app.get("/get_image")
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
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
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

@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

# --- Mount static files ---
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- To run the server ---
# Use the command: uvicorn main:app --reload
# You'll need to have uvicorn and fastapi installed:
# pip install uvicorn fastapi python-dotenv google-generativeai