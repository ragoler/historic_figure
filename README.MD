# 🏛️ Historical Figure Guesser

A simple web application that uses the Google Gemini API to guess a historical figure based on a phrase you have in mind.

## ✨ Features

- **AI-Powered Guesses:** Enter a famous quote or phrase, and the AI will identify the historical figure associated with it.
- **Image Display:** Shows a picture of the guessed figure.
- **Interactive Feedback:** Lets you mark the AI's guess as correct or incorrect, allowing the AI to try again with new information.
- **Sleek, Modern UI:** A clean and responsive user interface for a smooth experience.

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI
- **Frontend:** HTML, Tailwind CSS, JavaScript
- **AI:** Google Gemini API
- **Image Search:** Google Search scraping with `requests` and `BeautifulSoup`

## 🚀 Getting Started

Follow these instructions to get the project set up and running on your local machine.

### Prerequisites

- Python 3.8+
- An active Google Gemini API key.

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

4.  **Configure your API Key:**
    Create a new file named `config.py` in the root of the project and add your Gemini API key as follows:

    ```python
    # config.py
    GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"
    ```
    *Note: The `config.py` file is listed in `.gitignore`, so your API key will not be tracked by version control.*

## 🏃‍♀️ Running the Application

1.  **Start the backend server:**
    ```bash
    uvicorn main:app --reload
    ```
    The server will be running at `http://127.0.0.1:8000`.

2.  **Open the application:**
    Navigate to `http://127.0.0.1:8000` in your web browser. The `index.html` file is served automatically as the main page.

## 🕹️ How to Use

1.  Enter a phrase in the input box (e.g., "I have a dream").
2.  Click the **Find Figure** button.
3.  The application will display its guess.
4.  If the guess is right, click **Correct!** to reset for a new game.
5.  If the guess is wrong, click **Incorrect**, and the AI will try to find a different person.

## 🔗 API Endpoints

The backend provides the following endpoints:

- `POST /find_person`:
  - **Description:** Takes a phrase and a list of previous incorrect guesses, and returns a potential historical figure.
  - **Request Body:** `{"phrase": "string", "previous_guesses": ["string"]}`
  - **Response:** `{"name": "string", "reason": "string", "image_query": "string"}`

- `GET /get_image`:
  - **Description:** Takes a search query and returns a direct URL to a relevant image.
  - **Query Parameter:** `?query=string`
  - **Response:** `{"image_url": "string"}`
