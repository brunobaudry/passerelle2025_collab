window.onload = function() {

    var randomWords = "";
    var startTime = 0;
    var timerRecorded = 0;
    var intervalID = 0;
    var allRecords = [];
    var lastWasDead = false;
    var penalty = 2;

    var allowedLangs = ["de","it","es","pt-br","fr","zh"];
    var apiUrl = "https://random-word-api.herokuapp.com";

    var randomWordP = document.getElementById("randomword");
    var timerP = document.getElementById("timer");
    var startBtn = document.getElementById("startgame");
    var stopBtn = document.getElementById("stopgame");
    var allRecordsOL = document.getElementById("allRecords");
    var nbWordInput = document.getElementById("nb");
    var lengthInput = document.getElementById("len");
    var typeWordP = document.getElementById("typedword");

   
    typeWordP.setAttribute("contenteditable", "true");

    var level = 1;
    var username = "";

  
    typeWordP.addEventListener("input", onInput);
    startBtn.addEventListener("click", startGame);
    stopBtn.addEventListener("click", stopGame);

    document.addEventListener("keydown", function(event) {
        var keyTyped = event.key;
        if (keyTyped === "Dead") {
            lastWasDead = true;
        } else {
            lastWasDead = false;
            if (keyTyped === "Enter") startGame();
            else if (timerRecorded > 0 && (event.key === "Backspace" || event.key === "Delete")) onInput(null);
            else if (keyTyped === "Tab") { event.preventDefault(); addPenalty(); nextWord(); }
        }
    });
var isRunning = false; 

function startGame() {
    clearInterval(intervalID);
    isRunning = true; 
    username = document.getElementById("username").value || "Player";
    level = parseInt(document.getElementById("levelSelect").value);

    var nbWordsLevel = (parseInt(nbWordInput.value) || 5) + (level - 1);
    var wordLenLevel = (parseInt(lengthInput.value) || 5) + Math.floor((level-1)/2);

    getRandomWord(wordLenLevel, nbWordsLevel).then(function(result) {
        randomWords = result;
        randomWordP.textContent = randomWords;
        typeWordP.innerHTML = "";
        timerRecorded = 0;
        startTime = 0;
        intervalID = setInterval(updateTimer, 10);
        timerP.classList.remove("blink");
        randomWordP.classList.remove("blink");
        typeWordP.focus();
    }).catch(function(err){
        randomWordP.textContent = "Ошибка загрузки слов";
        console.error(err);
    });
}

function stopGame() {
    clearInterval(intervalID);
    intervalID = 0;
    isRunning = false; 
    timerP.textContent = "time: " + timerRecorded + "s"; 
    typeWordP.innerHTML = "";
    randomWordP.textContent = "";
    timerP.classList.remove("blink");
    randomWordP.classList.remove("blink");
}

function updateTimer() {
    if (!isRunning) return; 
    if (startTime === 0) startTime = Date.now();
    timerRecorded = ((Date.now() - startTime)/1000).toFixed(2);
    timerP.textContent = "time: " + timerRecorded + "s";
}

    function onInput() {
        var typedString = typeWordP.textContent.trim();
        var hasError = false;

        for (var i = 0; i < typedString.length; i++) {
            if (typedString[i] !== randomWords[i]) { hasError = true; break; }
        }

        checkWord(typedString);
        if (!lastWasDead) randomWordP.innerHTML = wordHighlighter(typedString);
    }

    function wordHighlighter(text) {
        var displayText = "";
        var end = randomWords.substring(text.length);
        for (var i = 0; i < text.length; i++) {
            var charA = text[i].replace(/ /g, '\u00A0').charCodeAt(0);
            var charB = randomWords[i].replace(/ /g, '\u00A0').charCodeAt(0);
            displayText += (charA === charB) ? '<span class="correct">' + randomWords[i] + '</span>' : '<span class="wrong">' + randomWords[i] + '</span>';
        }
        return displayText + end;
    }

    function checkWord(typed) {
        if (typed === randomWords) {
            clearInterval(intervalID);
            intervalID = 0;
            typeWordP.blur();
            if (timerRecorded > 0) {
                allRecords.push({ username, time: timerRecorded, word: typed, level });
                allRecords.sort((a,b)=>a.time-b.time);
                allRecordsOL.innerHTML = "";
                allRecords.forEach(el=>{
                    var li = document.createElement("li");
                    li.textContent = `${el.username} - Level ${el.level} - ${el.time}s (${el.word})`;
                    allRecordsOL.appendChild(li);
                });
            }
            timerP.classList.add("blink");
            randomWordP.classList.add("blink");
            timerRecorded = 0;
            startTime = 0;
        }
    }

    function addPenalty() { timerRecorded = parseFloat(timerRecorded) + penalty; }
    function nextWord() { clearInterval(intervalID); startGame(); }
    function updateTimer() {
        if (startTime === 0) startTime = Date.now();
        timerRecorded = ((Date.now() - startTime)/1000).toFixed(2);
        timerP.textContent = "time: " + timerRecorded + "s";
    }

    function getRandomWord(length, number) {
        var url = apiUrl + "/word?length=" + length + "&number=" + number;
        return fetch(url).then(res=>res.json()).then(data=>data.join(" "));
    }
};
