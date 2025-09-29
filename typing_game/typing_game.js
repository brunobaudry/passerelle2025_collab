window.onload = async () => {
  let randomWords = "";
  let startTime = 0;
  let timerRecorded = 0;
  let intervalID = 0;
  let allRecords = [];
  let lastWasDead = false;

  const apiUrl = "https://random-word-api.herokuapp.com";

  const randomWordP = document.querySelector("#randomword");
  const timerP = document.querySelector("#timer");
  const startBtn = document.querySelector("#startgame");
  const stopBtn = document.querySelector("#stopgame");
  const allRecordsOL = document.querySelector("#allRecords");
  const nbWordInput = document.querySelector("#nb");
  const lengthInput = document.querySelector("#len");
  const typeWordP = document.querySelector("#typedword");
  const usernameInput = document.querySelector("#username");
  const levelSelect = document.getElementById("level");
  const autoIncCheckbox = document.getElementById("autoinc");

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

  async function startGame() {
    clearInterval(intervalID);
    const langInput = document.querySelector("[name='lang']:checked");

    // Уровни сложности
    let wordLen = Number(lengthInput.value);
    let wordNum = Number(nbWordInput.value);
    switch (levelSelect.value) {
      case "easy":
        wordLen = 3;
        wordNum = 3;
        break;
      case "normal":
        wordLen = 5;
        wordNum = 5;
        break;
      case "hard":
        wordLen = 8;
        wordNum = 8;
        break;
    }

    // Авто-увеличение
    let currentWord = 0;
    let maxWords = wordNum;
    let curLen = wordLen;

    async function nextWord() {
      if (currentWord >= maxWords) {
        stopGame();
        return;
      }
      // Авто-увеличение
      if (autoIncCheckbox.checked && currentWord > 0) {
        if (currentWord % 2 === 0) {
          maxWords++;
          curLen++;
        }
      }
      randomWords = await getRandomWord(curLen, 1, langInput.value);
      randomWordP.textContent = randomWords;
      typeWordP.innerHTML = "";
      timerRecorded = startTime = 0;
      intervalID = setInterval(updateTimer, 10);
      timerP.classList.remove("blink");
      randomWordP.classList.remove("blink");
      typeWordP.focus();
      startBtn.style.display = "none";
      stopBtn.style.display = "inline-block";
      currentWord++;
    }

    // Переопределите checkWord чтобы вызывать nextWord()
    function checkWord(typed) {
      if (typed.replace(/\s/g, "") === randomWords.replace(/\s/g, "")) {
        clearInterval(intervalID);
        typeWordP.blur();
        timerP.classList.add("blink");
        randomWordP.classList.add("blink");

        const username = usernameInput ? usernameInput.value.trim() : "Anonymous";
        allRecords.push({ time: parseFloat(timerRecorded), word: randomWords, username });
        allRecords.sort((a, b) => a.time - b.time);

        allRecordsOL.innerHTML = "";
        allRecords.forEach((el) => {
          const li = document.createElement("li");
          li.textContent = `${el.time}s (${el.word}) — ${el.username || "Anonymous"}`;
          allRecordsOL.appendChild(li);
        });

        timerRecorded = startTime = 0;
        setTimeout(nextWord, 700); // Следующее слово через 0.7 сек
      }
    }

    // Сохраняем новую checkWord
    window.checkWord = checkWord;

    // Запускаем первую итерацию
    currentWord = 0;
    maxWords = wordNum;
    curLen = wordLen;
    nextWord();
  }

  function stopGame() {
    clearInterval(intervalID);
    intervalID = 0;
    timerRecorded = 0;
    startTime = 0;
    timerP.textContent = "time: 0.00s";
    typeWordP.innerHTML = "";
    randomWordP.textContent = "";
    timerP.classList.remove("blink");
    randomWordP.classList.remove("blink");
    startBtn.style.display = "inline-block";
    stopBtn.style.display = "none";
    typeWordP.blur();
  }

  function updateTimer() {
    timerRecorded = (startTime++ / 100).toFixed(2);
    timerP.textContent = "time: " + timerRecorded + " s";
  }

  function onInput(event) {
    let typedString = typeWordP.textContent;

    let highlightedHTML = "";
    for (let i = 0; i < typedString.length; i++) {
      const typedChar = typedString[i];
      const correctChar = randomWords[i] || "";
      if (typedChar === correctChar) {
        highlightedHTML += `<span class="correct">${typedChar}</span>`;
      } else {
        highlightedHTML += `<span class="wrong">${typedChar}</span>`;
      }
    }

    typeWordP.innerHTML = highlightedHTML;

    placeCaretAtEnd(typeWordP);

    checkWord(typedString);
  }

  function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  async function getRandomWord(lngth, nmber, lng) {
    if (lng === "ru") {
      // Только локальный массив для русского
      const pool = localWords.ru.filter(w => Math.abs(w.length - lngth) <= 1);
      let result = [];
      for (let i = 0; i < nmber; i++) {
        if (pool.length > 0) {
          result.push(pool[Math.floor(Math.random() * pool.length)]);
        } else {
          result.push(localWords.ru[Math.floor(Math.random() * localWords.ru.length)]);
        }
      }
      return result.join(" ");
    } else {
      // Для остальных языков — через API
      const url = `https://random-word-api.herokuapp.com/word?length=${lngth}&number=${nmber}&lang=${lng}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        return data.join(" ");
      } catch {
        // Если API не работает — fallback на локальный массив
        const pool = (localWords[lng] || localWords.en).filter(w => Math.abs(w.length - lngth) <= 1);
        let result = [];
        for (let i = 0; i < nmber; i++) {
          if (pool.length > 0) {
            result.push(pool[Math.floor(Math.random() * pool.length)]);
          } else {
            result.push((localWords[lng] || localWords.en)[Math.floor(Math.random() * (localWords[lng] || localWords.en).length)]);
          }
        }
        return result.join(" ");
      }
    }
  }

  const localWords = {
    en: [
      "apple",
      "water",
      "house",
      "garden",
      "winter",
      "rocket",
      "lesson",
      "mouse",
      "random",
      "flower",
      "computer",
      "coffee",
      "bottle",
      "purple",
      "summer",
      "orange",
      "pencil",
      "mirror",
      "window",
      "planet",
    ],
    fr: [
      "maison",
      "soleil",
      "lune",
      "eau",
      "pomme",
      "porte",
      "jouet",
      "fleur",
      "route",
      "musee",
      "chocolat",
      "fromage",
      "camion",
      "montagne",
      "bouteille",
      "livre",
      "fenetre",
      "table",
      "stylo",
      "chaise",
    ],
    de: [
      "haus",
      "wasser",
      "sonne",
      "mond",
      "apfel",
      "fenster",
      "blume",
      "schule",
      "garten",
      "berg",
      "baum",
      "tisch",
      "stuhl",
      "buch",
      "straße",
      "farbe",
      "uhr",
      "fisch",
      "zimmer",
      "stadt",
    ],
    zh: [
      "你好",
      "苹果",
      "电脑",
      "学校",
      "花园",
      "太阳",
      "月亮",
      "家",
      "手机",
      "图书",
      "车站",
      "窗户",
      "茶杯",
      "房子",
      "桌子",
      "椅子",
      "河流",
      "山脉",
    ],
    ru: [
      "дом", "мир", "кот", "лес", "луг", "сад", "чай", "мёд", "снег", "шаг",
  "день", "ночь", "год", "час", "нос", "рот", "ухо", "глаз", "луна", "солнце",
  "река", "гора", "луг", "ветвь", "лист", "мост", "ключ", "друг", "мама", "папа",
  "сын", "дочь", "мир", "игра", "домик", "парк", "садик", "снег", "дождь", "ветер",
  "путь", "стул", "стол", "окно", "дверь", "звук", "шум", "дым", "лесок", "вода",
  "тень", "лук", "сок", "мир", "рай", "ад", "камень", "мел", "пыль", "мост", "ручей",
  "рыба", "птица", "волк", "лось", "лиса", "заяц", "медведь", "сова", "ёж", "мышь",
  "луг", "лугок", "сено", "трава", "дождь", "снег", "мир", "пруд", "озеро", "море",
  "берег", "поле", "лес", "лесок", "дом", "храм", "цель", "шаг", "след", "план",
  "рука", "нога", "голос", "глаз", "ум", "меч", "щит", "лук", "стрела", "борт", "машина", "комната", "подарок", "магазин", "работа", "человек", "интернет", "компьютер",
  "телефон", "яблоко", "дерево", "птица", "праздник", "учебник", "календарь", "библиотека",
  "воспоминание", "путешествие", "приключение", "встреча", "отношение", "состояние", "движение",
  "настроение", "знание", "возможность", "природа", "животное", "растение", "окружение", "внимание",
  "описание", "предложение", "обсуждение", "развитие", "существование", "удовольствие", "обращение",
  "приглашение", "обещание", "поведение", "сотрудничество", "представление", "впечатление",
  "образование", "исследование", "приложение", "пояснение", "достижение", "обеспечение",
  "поколение", "искусство", "вдохновение", "выражение", "произведение", "увлечение", "поколение",
  "направление", "население", "воспитание", "обучение", "воображение", "воображение", "размышление",
  "приспособление", "уведомление", "наследие", "обращение", "переживание", "сочинение", "движение",
  "сопереживание", "взаимодействие", "окружение", "предположение", "обеспечение", "передвижение",
  "планирование", "воображение", "исполнение", "выполнение", "обсуждение", "восприятие", "представление",
  "продолжение", "направление", "повествование", "воображение", "познание", "сознание", "размышление",
  "соприкосновение", "исследование", "воодушевление", "постижение", "определение", "состояние",
  "назначение", "описание", "значение", "положение", "движение", "поведение", "объяснение"
    ]
  };
};