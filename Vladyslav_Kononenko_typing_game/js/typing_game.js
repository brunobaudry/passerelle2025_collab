/**
 * We will build this game step by step together.
 * You will make some changes to make it your own.
 * 
 * @todo :
 * - Add levels and auto increase word count and length.
 * - Add penalty when user skips word.
 * - Add username associated with the records.
 * - Improve display.
 * 
 * - Make the word(s) goal sentence uncopyable
 */
this.onload = async () => {
    /*********************************************
     * VARIABLES
     ********************************************/
    let randomWords = ''; // The words sentence the user needs to type.
    let startTime = 0; // Time the user takes to type the word (updated every millisecond).
    let timerRecorded = 0; // timer record (updated every cents of second).
    let intervalID = 0; // an ID for the Timer so that we can stop it.
    let allRecords = []; // Array of timer recorded.
    let lastWasDead = false; // Trick for ô style double strokes

    /*********************************************
     * CONSTANTS
     ********************************************/
    const apiUrl = "https://random-word-api.herokuapp.com";
    
    /**
     * Get the HTML elements
     */
    const randomWordP = document.querySelector('#randomword'); // get the html element for randWord
    const timerP = document.querySelector("#timer"); // get the timer P element
    const startBtn = document.querySelector('#startgame'); // start button
    const allRecordsOL = document.querySelector('#allRecords'); // list of records
    const nbWordInput = document.querySelector("#nb"); // get the element for the word amount setting
    const lengthInput = document.querySelector("#len"); // get the element for the word length setting
    const typeWordP = document.querySelector('#typedword'); // get the html element for user typed

    // Get & set up the list of languages first
    getLanguages().then(() => {
        // Display the start button
        startBtn.style.display = 'inline-block';

        // Add an event listener to listen to keyboard type.
        typeWordP.addEventListener('input', onInput);
        startBtn.addEventListener('click', startGame); // listen to click on start button
        document.addEventListener('keydown', (event) => {
            const keyTyped = event.key;

            if (keyTyped === "Dead") {
                // Trick for ô style double strokes.
                lastWasDead = true;
            } else {
                lastWasDead = false;

                if (keyTyped === "Enter") {
                    startGame();
                } else if (timerRecorded > 0 && (event.key === 'Backspace' || event.key === 'Delete')) {
                    // Delete or backspace.
                    console.log('keydown');
                    onInput(null);
                }
            }
        });
    }).catch((whyRejected) => {
        console.warn(whyRejected);
        alert(whyRejected);
    });

    async function startGame() {
        clearInterval(intervalID); // Reset the interval loop
        
        // Get language
        const langInput = document.querySelector("[name='lang']:checked");
        
        // Fetch random word(s) from the API.
        randomWords = await getRandomWord(lengthInput.value, nbWordInput.value, langInput.value);
        randomWordP.textContent = randomWords; // put the random word(s) in the P element
        
        // Resetting 
        typeWordP.innerHTML = typeWordP.value = "";
        timerRecorded = startTime = 0; // Init times.
        
        // Start the timer.
        intervalID = setInterval(updateTimer,10);
        
        // Stop blinking
        timerP.classList.remove('blink');
        randomWordP.classList.remove('blink');
        
        // Putting the ouse caret in the text box.
        // Oppposite is call blur.
        typeWordP.focus();
        typeWordP.classList.remove("unclickable_input"); // Makes the typing field selectable

        // Makes all inputs aside from typing field be unclickable
        setUnclickableClassForAllInputs();
    }

    /**
     * ==> EXPLAIN what the function startGame() does
     * @return void
     */
    function updateTimer() {
        timerRecorded = (startTime++/100).toFixed(2); // start time with 2 digit format 1.000001 = 1.00
        timerP.textContent = "time: " +  timerRecorded +" s";
    }

    /**
     * ==> EXPLAIN what the function startGame() does
     * @param event
     */
    function onInput(event) {
        let typedString = typeWordP.textContent;

        if (event == null) {
            typedString = typedString.slice(-1);
        }

        checkWord(typedString);
        
        if (!lastWasDead) {
            randomWordP.innerHTML = wordHighlighter(typedString);
        }
    }

    /**
     * ==> EXPLAIN
     * @param text
     * @returns {string}
     */
    function wordHighlighter(text) {
        let displayText = '';
        let end = randomWords.substring(text.length);
        // console.log(text, end);

        for (let i = 0; i < text.length; i++) {
            // Loop through all char of typed and compare to the current word
            // and replace spaces by non breaking spaces...
            const charA = text[i].replace(/ /g, '\u00A0').charCodeAt(0);
            const charB = randomWords[i].replace(/ /g, '\u00A0').charCodeAt(0);
            console.log(text[i], text[i] == ' ', charA, randomWords[i] == ' ', charB);
            
            if (charA == charB) {
                displayText += `<span class="correct">${randomWords[i]}</span>`;
            } else {
                displayText += `<span class="wrong">${randomWords[i]}</span>`;
            }
        }

        return displayText + end;
    }

    /**
     * Checks the player's typed word(s) to compare them against the word(s) the player has to type, and if they match, ends the game
     * @param {String} typed The word(s) that the player is typing in
     */
    function checkWord(typed) {
        // if the word(s) player has typed are equal in type and value to the word(s) the player has to write
        if (typed === randomWords) {
            clearInterval(intervalID); // resets the timer's interval loop
            typeWordP.blur(); // removes keyboard focus from the typing field
            timerP.setAttribute("class", "blink"); // causes the timer to blink
            randomWordP.classList.add("blink"); // causes the random word(s) to blink

            allRecords.push({time: timerRecorded, word:typed }); // pushes a new record with the time and the typed word(s)
            allRecords.sort((a, b) => a.time - b.time); // sorts the record
            allRecordsOL.innerHTML = ""; // resets the ordered list

            // for each record, creates a list item containing a record, then appends it
            allRecords.forEach(element => {
                const li = document.createElement("li");
                li.textContent = `${element.time}s (${element.word})`;
                allRecordsOL.appendChild(li);
            });

            // resets the timer's time variable
            timerRecorded = startTime = 0;

            // makes all inputs once again clickable
            setUnclickableClassForAllInputs(undefined, true);
            typeWordP.classList.add("unclickable_input"); // makes the typing field unselectable
        }
    }

    /**
     * Fetches random word(s) using HerokuApp's Random Word API
     * @param lngth Defines the desired length of each individual word
     * @param nmber Defines the desired amount of words
     * @param lng Defines the language from which to fetch word(s) from, in a language code format
     * @returns {Promise<*>} Returns a `string`, formed from an `array` of words (words are joined together with an empty space (`" "`))
     */
    async function getRandomWord(lngth, nmber, lng) {
        console.log(lng);

        // String interpolated url with parameters as variables, call http, get the response data
        const url = `${apiUrl}/word?length=${lngth}&number=${nmber}&lang=${lng}`;
        const response = await fetch(url);
        const data = await response.json(); // Becomes an array of strings
        
        // Return the data to the function call.
        return data.join(" ");
    }

    /**
     * Fetches language data from HerokuApp's Random Word API in order to automatically create a language list
     */
    async function getLanguages() {
        // String interpolated url, call http, get the response data
        const url = `${apiUrl}/languages`;
        const response = await fetch(url);
        const data = await response.json(); // Becomes an array of strings

        // console.log(data);

        // Selects the div element that hosts the language choice
        const languagesElement = document.querySelector("div#languages");

        // For each index within `data` array...
        for (let i = 0; i < data.length; i++) {
            // Create a new `input` element, `label` element, and `br` element
            let radioInput = document.createElement("input");
            let radioLabel = document.createElement("label");
            let lineBreak = document.createElement("br");
            
            // Sets up `label` element's text content and its `for` attribute
            radioLabel.for = data[i];
            radioLabel.textContent = data[i];
            languagesElement.appendChild(radioLabel);

            // Sets up `input` element to be of `"radio"` type, then sets up its name, value and id
            // If its the very first `input` element in the loop, additionally automatically checks it
            if (i == 0) radioInput.checked = true;
            radioInput.type = "radio";
            radioInput.name = "lang";
            radioInput.value = data[i];
            radioInput.id = data[i];
            languagesElement.appendChild(radioInput);

            // Appends a line break (`br` element) after the previous elements
            languagesElement.appendChild(lineBreak);
        }
    }

    /**
     * Adds the `unclickable_input` CSS class for all input elements, which toggles the `pointer-events: none` CSS attribute
     * @param {String[]} idsToExclude Optional, defines the HTML `id`s that this function should ignore when going over all `input` elements
     * @param {Boolean} shouldRemove Optional, specifies that this function should remove the `unclickable_input` CSS class instead of adding
     */
    function setUnclickableClassForAllInputs(idsToExclude, shouldRemove) {
        // Get all input elements
        const allInputs = document.querySelectorAll("input");

        // Iterates through all input elements
        allInputs.forEach(input => {
            // If there are any ids to check...
            if (idsToExclude != undefined && idsToExclude.length > 0) {
                // For each id...
                for (let i = 0; i < idsToExclude.length; i++) {
                    // Do id comparison between input and specified index of id arrays
                    if (input.id == idsToExclude[i]) return;
                }
            }
            
            // Either removes or adds the class
            if (shouldRemove) {
                input.classList.remove("unclickable_input");
                console.log(input, "removed unclickable_input", idsToExclude, shouldRemove);
            } else {
                input.classList.add("unclickable_input");
                console.log(input, "added unclickable_input", idsToExclude, shouldRemove);
            }
        });
    }
}
