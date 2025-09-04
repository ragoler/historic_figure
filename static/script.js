// DOM Elements
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

// Location Elements
const locationInfo = document.getElementById('locationInfo');
const birthPlaceEl = document.getElementById('birthPlace');
const deathPlaceEl = document.getElementById('deathPlace');
const mapEl = document.getElementById('map');

// Family Elements
const familyInfo = document.getElementById('familyInfo');
const parentsSection = document.getElementById('parentsSection');
const parentsList = document.getElementById('parentsList');
const spouseSection = document.getElementById('spouseSection');
const spouseList = document.getElementById('spouseList');
const childrenSection = document.getElementById('childrenSection');
const childrenList = document.getElementById('childrenList');
const siblingsSection = document.getElementById('siblingsSection');
const siblingsList = document.getElementById('siblingsList');


// API URLs
const GUESS_API_URL = 'http://127.0.0.1:8000/find_person';
const PERSON_API_URL = 'http://127.0.0.1:8000/person/'; // e.g. /person/Martin Luther King Jr.
const IMAGE_API_URL = 'http://127.0.0.1:8000/get_image';
const MAPS_API_KEY_URL = 'http://127.0.0.1:8000/get_maps_key';

// App State
let currentSession = {
    phrase: '',
    incorrectGuesses: []
};
let map;
let googleMapsScriptLoaded = false;

// --- Google Maps Integration ---

const loadGoogleMapsScript = async () => {
    if (googleMapsScriptLoaded) return;
    try {
        const response = await fetch(MAPS_API_KEY_URL);
        if (!response.ok) throw new Error('Could not fetch Google Maps API key.');
        const data = await response.json();
        const apiKey = data.maps_key;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        googleMapsScriptLoaded = true;
    } catch (error) {
        console.error("Failed to load Google Maps script:", error);
    }
};

const initMap = (birthCoords, deathCoords) => {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error("Google Maps script not loaded yet.");
        mapEl.innerHTML = '<p class="text-center text-red-500">Map could not be loaded.</p>';
        return;
    }

    const mapOptions = {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        mapTypeId: 'terrain'
    };
    map = new google.maps.Map(mapEl, mapOptions);

    const bounds = new google.maps.LatLngBounds();
    let markerCount = 0;
    let coordsAreIdentical = false;

    if (birthCoords) {
        const birthMarker = new google.maps.Marker({ position: birthCoords, map: map, title: `Birth Place: ${birthPlaceEl.textContent}` });
        bounds.extend(birthMarker.getPosition());
        markerCount++;
    }

    if (deathCoords) {
        const deathMarker = new google.maps.Marker({ position: deathCoords, map: map, title: `Death Place: ${deathPlaceEl.textContent}` });
        bounds.extend(deathMarker.getPosition());
        markerCount++;
    }

    if (birthCoords && deathCoords && birthCoords.lat === deathCoords.lat && birthCoords.lng === deathCoords.lng) {
        coordsAreIdentical = true;
    }

    if (markerCount > 1 && !coordsAreIdentical) {
        map.fitBounds(bounds);
    } else if (markerCount > 0) {
        map.setCenter(bounds.getCenter());
        map.setZoom(5);
    }
};

// --- UI Management ---

const showLoading = () => {
    loader.classList.remove('hidden');
    personInfo.classList.add('hidden');
    locationInfo.classList.add('hidden');
    familyInfo.classList.add('hidden');
    initialMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
};

const showResult = (data) => {
    // Set basic info
    personName.textContent = data.name;
    personReason.textContent = data.reason;
    personInfo.classList.remove('hidden');

    // Set location text content and map
    birthPlaceEl.textContent = data.birth_place || 'N/A';
    deathPlaceEl.textContent = data.death_place || 'N/A';
    if (data.birth_coords || data.death_coords) {
        locationInfo.classList.remove('hidden');
        initMap(data.birth_coords, data.death_coords);
    }

    // Handle Family Info
    familyInfo.classList.remove('hidden');
    parentsSection.classList.add('hidden'); // Hide by default, show if data exists
    spouseSection.classList.add('hidden');
    childrenSection.classList.add('hidden');
    siblingsSection.classList.add('hidden');

    if (data.parents && data.parents.length > 0) {
        parentsList.textContent = data.parents.join(', ');
        parentsSection.classList.remove('hidden');
    }
    if (data.spouse && data.spouse.toLowerCase() !== 'n/a' && data.spouse !== '') {
        spouseList.textContent = data.spouse;
        spouseSection.classList.remove('hidden');
    }
    if (data.children && data.children.length > 0) {
        childrenList.textContent = data.children.join(', ');
        childrenSection.classList.remove('hidden');
    }
    if (data.siblings && data.siblings.length > 0) {
        siblingsList.textContent = data.siblings.join(', ');
        siblingsSection.classList.remove('hidden');
    }

    loader.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
};

const showError = (message) => {
    errorMessage.textContent = `Error: ${message}`;
    loader.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
};

const resetUI = () => {
    loader.classList.add('hidden');
    personInfo.classList.add('hidden');
    locationInfo.classList.add('hidden');
    familyInfo.classList.add('hidden');
    parentsSection.classList.add('hidden');
    spouseSection.classList.add('hidden');
    childrenSection.classList.add('hidden');
    siblingsSection.classList.add('hidden');
    errorMessage.classList.add('hidden');
    initialMessage.classList.remove('hidden');
    phraseInput.value = '';
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
};

// --- API Calls & Logic ---

const getAndShowPersonDetails = async (name, reason) => {
    try {
        // 2. Fetch all details for the guessed person
        const detailsResponse = await fetch(`${PERSON_API_URL}${encodeURIComponent(name)}`);
        if (!detailsResponse.ok) {
            const errorData = await detailsResponse.json();
            throw new Error(errorData.detail || `Could not fetch details for ${name}.`);
        }
        const personData = await detailsResponse.json();
        personData.reason = reason; // Add the reason from the guessing step

        // 3. Fetch the image
        const imageResponse = await fetch(`${IMAGE_API_URL}?query=${encodeURIComponent(personData.image_query)}`);
        if (!imageResponse.ok) {
            console.error('Could not fetch image.');
            personImage.src = '';
        } else {
            const imageData = await imageResponse.json();
            personImage.src = imageData.image_url;
        }

        // 4. Display all results
        showResult(personData);

    } catch (error) {
        console.error('Display error:', error);
        showError(error.message);
    }
};


const startGuessingProcess = async () => {
    const userPhrase = phraseInput.value.trim();
    if (!userPhrase) {
        showError("Please enter a phrase.");
        return;
    }

    if (userPhrase !== currentSession.phrase) {
        currentSession.phrase = userPhrase;
        currentSession.incorrectGuesses = [];
    }

    showLoading();

    try {
        // 1. Guess the person from the phrase
        const guessResponse = await fetch(GUESS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phrase: currentSession.phrase,
                previous_guesses: currentSession.incorrectGuesses
            }),
        });

        if (!guessResponse.ok) {
            const errorData = await guessResponse.json();
            throw new Error(errorData.detail || 'Failed to get a guess.');
        }
        const guessData = await guessResponse.json();

        // 2. Get and display the full details for the guessed person
        await getAndShowPersonDetails(guessData.name, guessData.reason);

    } catch (error) {
        console.error('Guessing process error:', error);
        showError(error.message);
    }
};

// --- Event Listeners & Initialization ---

submitBtn.addEventListener('click', startGuessingProcess);
phraseInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') startGuessingProcess();
});

correctBtn.addEventListener('click', () => {
    resetUI();
    currentSession = { phrase: '', incorrectGuesses: [] };
});

incorrectBtn.addEventListener('click', () => {
    const currentGuess = personName.textContent;
    if (currentGuess && !currentSession.incorrectGuesses.includes(currentGuess)) {
        currentSession.incorrectGuesses.push(currentGuess);
    }
    startGuessingProcess(); // Start the process again with the new incorrect guess
});

// Initial setup
resetUI();
loadGoogleMapsScript();
