document.addEventListener("DOMContentLoaded", () => {
    const gameContent = document.getElementById("game-content");

    const routes = {
        "/": "who_am_i.html",
        "/who_am_i": "who_am_i.html",
        "/game2": "game2.html"
    };

    const loadGame = async (path) => {
        const gameHtml = routes[path];
        if (gameHtml) {
            const response = await fetch(`/static/${gameHtml}`);
            const html = await response.text();
            gameContent.innerHTML = html;
            if (path === "/who_am_i" || path === "/") {
                init_who_am_i();
            }
        }
    };

    const navigate = (e) => {
        e.preventDefault();
        const path = e.target.getAttribute("href");
        history.pushState({}, "", path);
        loadGame(path);
    };

    window.addEventListener("popstate", () => {
        loadGame(window.location.pathname);
    });

    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", navigate);
    });

    loadGame(window.location.pathname);
});

function init_who_am_i() {
    class WhoAmIGame {
    constructor() {
        this.userInput = document.getElementById('userInput');
        this.findFigureBtn = document.getElementById('findFigureBtn');
        this.figureDetails = document.getElementById('figureDetails');
        this.figureName = document.getElementById('figureName');
        this.parentsList = document.getElementById('parents');
        this.spouseList = document.getElementById('spouse');
        this.childrenList = document.getElementById('children');
        this.siblingsList = document.getElementById('siblings');
        this.birthPlace = document.getElementById('birthPlace');
        this.deathPlace = document.getElementById('deathPlace');
        this.mapEl = document.getElementById('map');
        this.correctBtn = document.getElementById('correctBtn');
        this.incorrectBtn = document.getElementById('incorrectBtn');
        this.result = document.getElementById('result');

        this.GUESS_API_URL = '/who_am_i/find_person';
        this.PERSON_API_URL = '/who_am_i/person/';
        this.MAPS_API_KEY_URL = '/who_am_i/get_maps_key';
        this.INCORRECT_GUESS_URL = '/who_am_i/incorrect_guess';

        this.sessionId = this.generateSessionId();

        this.findFigureBtn.addEventListener('click', () => this.findFigure());
        this.correctBtn.addEventListener('click', () => this.handleResponse(true));
        this.incorrectBtn.addEventListener('click', () => this.handleResponse(false));
        this.userInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.findFigure();
            }
        });
        this.loadGoogleMapsScript();
        this.resetUI();
    }

    generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    resetUI() {
        this.figureDetails.style.display = 'none';
        this.userInput.value = '';
        this.result.textContent = 'Your historical figure will appear here.';
        this.correctBtn.style.display = 'none';
        this.incorrectBtn.style.display = 'none';
    }

    async findFigure() {
        const userPhrase = this.userInput.value.trim();
        if (!userPhrase) {
            this.result.textContent = "Please enter a phrase.";
            return;
        }

        let subject;
        let context = null;
        const commaIndex = userPhrase.indexOf(',');
        
        if (commaIndex !== -1) {
            subject = userPhrase.substring(0, commaIndex).trim();
            context = userPhrase.substring(commaIndex + 1).trim();
        } else {
            subject = userPhrase;
        }

        try {
            const requestBody = {
                subject: subject,
                context: context,
                session_id: this.sessionId
            };

            const guessData = await this.fetchData(this.GUESS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (guessData) {
                await this.getPersonDetails(guessData.name, context);
            }
        } catch (error) {
            console.error('Error finding figure:', error);
            this.result.textContent = `Error: ${error.message}`;
        }
    }

    async fetchData(url, options) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch data.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            this.result.textContent = `Error: ${error.message}`;
            return null;
        }
    }

    async getPersonDetails(name, context) {
        let url = `${this.PERSON_API_URL}${name}?session_id=${this.sessionId}`;
        if (context) {
            url += `&context=${encodeURIComponent(context)}`;
        }
        const personData = await this.fetchData(url);
        if (personData) {
            this.displayPersonDetails(personData);
        }
    }

    displayPersonDetails(data) {
        this.figureName.textContent = data.name;
        this.figureDetails.style.display = 'block';
        this.correctBtn.style.display = 'inline-block';
        this.incorrectBtn.style.display = 'inline-block';

        // Birth Place
        if (data.birth_place && data.birth_place.toLowerCase() !== 'n/a' && data.birth_place !== '') {
            this.birthPlace.textContent = data.birth_place;
            document.getElementById('birthPlaceTitle').style.display = 'block';
        } else {
            document.getElementById('birthPlaceTitle').style.display = 'none';
            this.birthPlace.textContent = '';
        }

        // Death Place
        if (data.death_place && data.death_place.toLowerCase() !== 'n/a' && data.death_place !== '') {
            this.deathPlace.textContent = data.death_place;
            document.getElementById('deathPlaceTitle').style.display = 'block';
        } else {
            document.getElementById('deathPlaceTitle').style.display = 'none';
            this.deathPlace.textContent = '';
        }

        // Location
        if (data.birth_coords || data.death_coords) {
            document.getElementById('location').style.display = 'block';
            this.initMap(data.birth_coords, data.death_coords);
        } else {
            document.getElementById('location').style.display = 'none';
        }

        const currentPersonName = data.name;
        const previousPhrase = this.userInput.value;

        let hasFamily = false;

        // Parents
        if (data.parents && data.parents.length > 0) {
            this.parentsList.innerHTML = '';
            data.parents.forEach((name, index) => {
                this.createAndAppendLink(this.parentsList, name, 'parent', currentPersonName, previousPhrase);
                if (index < data.parents.length - 1) {
                    this.parentsList.appendChild(document.createTextNode(', '));
                }
            });
            document.getElementById('parentsTitle').style.display = 'block';
            hasFamily = true;
        } else {
            document.getElementById('parentsTitle').style.display = 'none';
            this.parentsList.innerHTML = '';
        }

        // Spouse
        if (data.spouse && data.spouse.toLowerCase() !== 'n/a' && data.spouse !== '') {
            this.spouseList.innerHTML = '';
            const spouses = data.spouse.split(', ');
            spouses.forEach((name, index) => {
                this.createAndAppendLink(this.spouseList, name, 'spouse', currentPersonName, previousPhrase);
                if (index < spouses.length - 1) {
                    this.spouseList.appendChild(document.createTextNode(', '));
                }
            });
            document.getElementById('spouseTitle').style.display = 'block';
            hasFamily = true;
        } else {
            document.getElementById('spouseTitle').style.display = 'none';
            this.spouseList.innerHTML = '';
        }

        // Children
        if (data.children && data.children.length > 0) {
            this.childrenList.innerHTML = '';
            data.children.forEach((name, index) => {
                this.createAndAppendLink(this.childrenList, name, 'child', currentPersonName, previousPhrase);
                if (index < data.children.length - 1) {
                    this.childrenList.appendChild(document.createTextNode(', '));
                }
            });
            document.getElementById('childrenTitle').style.display = 'block';
            hasFamily = true;
        } else {
            document.getElementById('childrenTitle').style.display = 'none';
            this.childrenList.innerHTML = '';
        }

        // Siblings
        if (data.siblings && data.siblings.length > 0) {
            this.siblingsList.innerHTML = '';
            data.siblings.forEach((name, index) => {
                this.createAndAppendLink(this.siblingsList, name, 'sibling', currentPersonName, previousPhrase);
                if (index < data.siblings.length - 1) {
                    this.siblingsList.appendChild(document.createTextNode(', '));
                }
            });
            document.getElementById('siblingsTitle').style.display = 'block';
            hasFamily = true;
        } else {
            document.getElementById('siblingsTitle').style.display = 'none';
            this.siblingsList.innerHTML = '';
        }

        if (hasFamily) {
            document.getElementById('family').style.display = 'block';
        } else {
            document.getElementById('family').style.display = 'none';
        }
    }

    createAndAppendLink(container, name, relationship, currentPersonName, previousPhrase) {
        const link = document.createElement('a');
        link.textContent = name;
        link.href = '#';
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            let newPhrase;
            // Check if the previous search was already a contextual one.
            if (previousPhrase.toLowerCase().includes(' of ')) {
                newPhrase = `${name}, ${relationship} of ${previousPhrase}`;
            } else {
                // This is the first click, so the context is just the current person's name.
                newPhrase = `${name}, ${relationship} of ${currentPersonName}`;
            }
            this.userInput.value = newPhrase;
            this.findFigure();
        });

        container.appendChild(link);
    }

    handleResponse(isCorrect) {
        if (isCorrect) {
            this.result.textContent = "I'm glad I could help!";
            this.resetUI();
        } else {
            const currentGuess = this.figureName.textContent;
            this.reportIncorrectGuess(currentGuess);
            this.findFigure();
        }
    }

    async reportIncorrectGuess(name) {
        try {
            await fetch(this.INCORRECT_GUESS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: this.sessionId, name: name }),
            });
        } catch (error) {
            console.error('Error reporting incorrect guess:', error);
        }
    }

    async loadGoogleMapsScript() {
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            return;
        }
        try {
            const response = await fetch(this.MAPS_API_KEY_URL);
            if (!response.ok) throw new Error('Could not fetch Google Maps API key.');
            const data = await response.json();
            const apiKey = data.maps_key;

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        } catch (error) {
            console.error("Failed to load Google Maps script:", error);
        }
    }

    initMap(birthCoords, deathCoords) {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error("Google Maps script not loaded yet.");
            this.mapEl.innerHTML = '<p class="text-center text-red-500">Map could not be loaded.</p>';
            return;
        }

        const mapOptions = {
            zoom: 2,
            center: { lat: 20, lng: 0 },
            mapTypeId: 'terrain'
        };
        this.map = new google.maps.Map(this.mapEl, mapOptions);

        const bounds = new google.maps.LatLngBounds();
        let markerCount = 0;
        let coordsAreIdentical = false;

        if (birthCoords) {
            const birthMarker = new google.maps.Marker({ position: birthCoords, map: this.map, title: `Birth Place: ${this.birthPlace.textContent}` });
            bounds.extend(birthMarker.getPosition());
            markerCount++;
        }

        if (deathCoords) {
            const deathMarker = new google.maps.Marker({ position: deathCoords, map: this.map, title: `Death Place: ${this.deathPlace.textContent}` });
            bounds.extend(deathMarker.getPosition());
            markerCount++;
        }

        if (birthCoords && deathCoords && birthCoords.lat === deathCoords.lat && birthCoords.lng === deathCoords.lng) {
            coordsAreIdentical = true;
        }

        if (markerCount > 1 && !coordsAreIdentical) {
            this.map.fitBounds(bounds);
        } else if (markerCount > 0) {
            this.map.setCenter(bounds.getCenter());
            this.map.setZoom(5);
        }
    }
}

    new WhoAmIGame();
}