Historical Figure Matcher
This web application uses the Gemini API to guess a historical figure based on a phrase provided by the user.

Project Structure
main.py: The FastAPI backend server.

index.html: The main frontend file.

script.js: Contains the JavaScript logic for the frontend.

config.py: Configuration file to store the Gemini API key. (You must create this file)

requirements.txt: A list of Python dependencies for the project.

.gitignore: Specifies files to be ignored by Git.

Setup & Installation
1. Clone the Repository
Clone this project to your local machine.

2. Create the Configuration File
Create a file named config.py in the root directory of the project and add your Gemini API key to it like so:

# config.py
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"

Note: The config.py file is included in the .gitignore file, so your API key will not be committed to Git.

3. Install Dependencies
Install the required Python packages using pip:

pip install -r requirements.txt

4. Run the Backend Server
Start the FastAPI server with uvicorn:

uvicorn main:app --reload

The backend will be running at http://127.0.0.1:8000.

5. Open the Frontend
Open the index.html file in your web browser to use the application.

How to Play
Enter a phrase that describes or is famously associated with a historical figure (e.g., "I have a dream").

Click the "Find Figure" button.

The application will suggest a historical figure.

If the suggestion is correct, click "Correct!". A new game will start.

If the suggestion is incorrect, click "Incorrect". The application will try to find a different figure, avoiding the ones it already guessed.