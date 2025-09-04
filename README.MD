# 🏛️ Historical Figure Guesser

An interactive web application that uses the Google Gemini API to guess a historical figure and allows you to explore their family tree.

## ✨ Features

- **AI-Powered Guesses:** Enter a famous quote, phrase, or a person's name, and the AI will identify the historical figure.
- **Interactive Family Tree:** Navigate through generations by clicking on the names of parents, spouses, children, and siblings.
- **Contextual Search:** The app cleverly builds a context chain as you navigate (e.g., "John Washington, parent of Augustine Washington, parent of George Washington") to ensure the AI can distinguish between similarly named people.
- **Dynamic Map Display:** Shows the birth and death locations of the historical figure on an interactive Google Map.
- **Image Display:** Shows a picture of the guessed figure.
- **Sleek, Modern UI:** A clean and responsive user interface for a smooth experience.

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI
- **Frontend:** HTML, Tailwind CSS, JavaScript
- **AI:** Google Gemini API
- **Maps & Geocoding:** Google Maps Platform (Maps JavaScript API, Geocoding API)
- **Image Search:** Google Search scraping with `requests` and `BeautifulSoup`

## 🚀 Getting Started

Follow these instructions to get the project set up and running on your local machine.

### Prerequisites

- Python 3.8+
- An active Google Gemini API key.
- An active Google Maps API key with the **Geocoding API** and **Maps JavaScript API** enabled.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd historic_figure
    ```

2.  **Create and activate a virtual environment:**
    This keeps your project dependencies isolated.
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure your API Keys:**
    Create a new file named `config.py` in the root of the project and add your API keys as follows. Remember to secure your Google Maps key with HTTP referrer restrictions.
    ```python
    # config.py
    GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"
    GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"
    ```
    *Note: The `config.py` file is listed in `.gitignore`, so your API keys will not be tracked by version control.*

## 🏃‍♀️ Running the Application

1.  **Start the backend server:**
    ```bash
    uvicorn main:app --reload
    ```
    The server will be running at `http://127.0.0.1:8000`.

2.  **Open the application:**
    Navigate to `http://127.0.0.1:8000` in your web browser.

## 🕹️ How to Use

1.  Enter a phrase in the input box (e.g., "I have a dream").
2.  Click the **Find Figure** button.
3.  The application will display the guessed figure's details.
4.  Click on any hyperlinked family member (parent, spouse, etc.) to navigate to their page. The input box will automatically update with the new contextual query.
5.  If a guess is wrong, click **Incorrect**, and the AI will try again, avoiding the previous guess.

## 🔗 API Endpoints

The backend provides the following endpoints:

- `POST /find_person`:
  - **Description:** Takes a subject and optional context, and returns a guessed person's name and the reason for the guess.
  - **Request Body:** `{"subject": "string", "context": "string" | null, "previous_guesses": ["string"]}`
  - **Response:** `{"name": "string", "reason": "string"}`

- `GET /person/{person_name}`:
  - **Description:** Retrieves all details for a specific person by name.
  - **Response:** A rich JSON object containing the person's name, reason for fame, image query, locations, coordinates, and family members.

- `GET /get_image`:
  - **Description:** Takes a search query and returns a direct URL to a relevant image.
  - **Query Parameter:** `?query=string`
  - **Response:** `{"image_url": "string"}`

- `GET /get_maps_key`:
  - **Description:** Securely provides the Google Maps API key to the frontend.
  - **Response:** `{"maps_key": "string"}`