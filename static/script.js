const phraseInput = document.getElementById('phraseInput');
const submitBtn = document.getElementById('submitBtn');
const resultDiv = document.getElementById('result');
const loader = document.getElementById('loader');
const personInfo = document.getElementById('personInfo');
const personName = document.getElementById('personName');
const personReason = document.getElementById('personReason');
const personImage = document.getElementById('personImage');
const correctBtn = document.getElementById('correctBtn');
const incorrectBtn = document.getElementById('incorrectBtn');
const initialMessage = document.getElementById('initialMessage');
const errorMessage = document.getElementById('errorMessage');

// This will store the current phrase and incorrect guesses for that phrase
let currentSession = {
    phrase: '',
    incorrectGuesses: []
};

const API_URL = 'http://127.0.0.1:8000/find_person';
const IMAGE_API_URL = 'http://127.0.0.1:8000/get_image';

// Function to show/hide UI elements
const showLoading = () => {
    loader.classList.remove('hidden');
    personInfo.classList.add('hidden');
    initialMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
};

const showResult = (name, reason, imageUrl) => {
    personName.textContent = name;
    personReason.textContent = reason;
    personImage.src = imageUrl;
    loader.classList.add('hidden');
    personInfo.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
};

const showError = (message) => {
    errorMessage.textContent = `Error: ${message}`;
    loader.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

const resetUI = () => {
    loader.classList.add('hidden');
    personInfo.classList.add('hidden');
    errorMessage.classList.add('hidden');
    initialMessage.classList.remove('hidden');
    phraseInput.value = '';
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
}

const findPerson = async () => {
    const userPhrase = phraseInput.value.trim();
    if (!userPhrase) {
        showError("Please enter a phrase.");
        return;
    }

    // If it's a new phrase, reset the session
    if (userPhrase !== currentSession.phrase) {
        currentSession.phrase = userPhrase;
        currentSession.incorrectGuesses = [];
    }

    showLoading();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phrase: currentSession.phrase,
                previous_guesses: currentSession.incorrectGuesses
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const imageResponse = await fetch(`${IMAGE_API_URL}?query=${encodeURIComponent(data.image_query)}`);
        if (!imageResponse.ok) {
            throw new Error('Could not fetch image.');
        }
        const imageData = await imageResponse.json();

        showResult(data.name, data.reason, imageData.image_url);

    } catch (error) {
        console.error('Fetch error:', error);
        showError(error.message || "Could not connect to the backend.");
    }
};

submitBtn.addEventListener('click', findPerson);
phraseInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        findPerson();
    }
});

correctBtn.addEventListener('click', () => {
    // Using a custom modal/alert in the future would be better than window.alert
    resetUI();
    currentSession = { phrase: '', incorrectGuesses: [] };
});

incorrectBtn.addEventListener('click', () => {
    const currentGuess = personName.textContent;
    if (currentGuess && !currentSession.incorrectGuesses.includes(currentGuess)) {
        currentSession.incorrectGuesses.push(currentGuess);
    }
    // Try to find a new person with the updated list of incorrect guesses
    findPerson();
});
