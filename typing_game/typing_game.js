window.onload = async () => {
  let randomWords = "";
  let startTime = 0;
  let timerRecorded = 0;
  let intervalID = 0;
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  let lastWasDead = false;
  const apiUrl = "https://random-word-api.herokuapp.com";

  const randomWordP = document.querySelector("#randomword");
  const timerP = document.querySelector("#timer");
  const startBtn = document.querySelector("#startgame");
  const stopBtn = document.querySelector("#stopgame");
  const leaderboardOL = document.querySelector("#leaderboard");
  const nbWordInput = document.querySelector("#nb");
  const lengthInput = document.querySelector("#len");
  const typeWordP = document.querySelector("#typedword");

  // Слушатели событий
  typeWordP.addEventListener("input", onInput);
  startBtn.addEventListener("click", startGame);
  stopBtn.addEventListener("click", stopGame);

  document.addEventListener("keydown", (event) => {
    const keyTyped = event.key;
    if (keyTyped === "Dead") lastWasDead = true;
    else {
      lastWasDead = false;
      if (keyTyped === "Enter") startGame();
      else if (
        timerRecorded > 0 &&
        (keyTyped === "Backspace" || keyTyped === "Delete")
      )
        onInput(null);
    }
  });

  // Показать лидерборд при загрузке
  renderLeaderboard();

  // Старт игры
  async function startGame() {
    clearInterval(intervalID);
    const langInput = document.querySelector("[name='lang']:checked");
    const difficulty = document.querySelector("#difficulty").value;

    // Настройки сложности
    if (difficulty === "easy") {
      nbWordInput.value = 1;
      lengthInput.value = 3;
    } else if (difficulty === "medium") {
      nbWordInput.value = 2;
      lengthInput.value = 5;
    } else if (difficulty === "hard") {
      nbWordInput.value = 3;
      lengthInput.value = 7;
    }

    randomWords = await getRandomWord(
      lengthInput.value,
      nbWordInput.value,
      langInput.value
    );

    randomWordP.textContent = randomWords;
    typeWordP.innerHTML = typeWordP.value = "";
    timerRecorded = startTime = 0;
    intervalID = setInterval(updateTimer, 10);
    timerP.classList.remove("blink");
    randomWordP.classList.remove("blink");
    typeWordP.focus();

    // Таймер для "hard"
    if (difficulty === "hard") {
      setTimeout(() => {
        if (intervalID) stopGame();
      }, 15000); // 15 секунд
    }
  }

  // Стоп игры
  function stopGame() {
    clearInterval(intervalID);
    typeWordP.blur();
    timerP.classList.add("blink");
    randomWordP.classList.add("blink");
  }

  // Таймер
  function updateTimer() {
    timerRecorded = (startTime++ / 100).toFixed(2);
    timerP.textContent = "time: " + timerRecorded + " s";
  }

  // Обработка ввода пользователя
  function onInput(event) {
    let typedString = typeWordP.textContent;

    // Подсветка букв прямо в поле ввода
    let highlightedHTML = "";
    for (let i = 0; i < typedString.length; i++) {
      const typedChar = typedString[i];
      const correctChar = randomWords[i] || "";
      if (typedChar === correctChar) {
        highlightedHTML += `<span style="color:green;">${typedChar}</span>`;
      } else {
        highlightedHTML += `<span style="color:red;">${typedChar}</span>`;
      }
    }
    typeWordP.innerHTML = highlightedHTML;
    placeCaretAtEnd(typeWordP);
    checkWord(typedString);
  }

  // Курсор в конец contenteditable
  function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Проверка правильности ввода
  function checkWord(typed) {
    if (typed === randomWords) {
      clearInterval(intervalID);
      typeWordP.blur();
      timerP.classList.add("blink");
      randomWordP.classList.add("blink");

      // Сохраняем результат
      let playerName = prompt("Введите ваше имя:", "Player");
      if (!playerName) playerName = "Anonymous";

      leaderboard.push({
        name: playerName,
        time: parseFloat(timerRecorded),
        word: typed,
      });

      // сортировка + ограничение на топ-10
      leaderboard.sort((a, b) => a.time - b.time);
      leaderboard = leaderboard.slice(0, 10);

      localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
      renderLeaderboard();

      timerRecorded = startTime = 0;
    }
  }

  // Рисуем лидерборд
  function renderLeaderboard() {
    leaderboardOL.innerHTML = "";
    leaderboard.forEach((el, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${el.name} - ${el.time}s (${el.word})`;
      leaderboardOL.appendChild(li);
    });
  }

  // Получение случайных слов с API
  async function getRandomWord(lngth, nmber, lng) {
    const url = `${apiUrl}/word?length=${lngth}&number=${nmber}&lang=${lng}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.join(" ");
  }
};
