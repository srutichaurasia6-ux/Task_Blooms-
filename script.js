document.addEventListener("DOMContentLoaded", () => {

  /* ================= STORAGE ================= */
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  let streakData = JSON.parse(localStorage.getItem("streakData")) || {
    current: 0,
    lastDate: null
  };

  let currentFilter = "all";
  let currentDate = new Date();
  let lastPercent = 0; //  for smart confetti triggering

  /* ================= DOM ELEMENTS ================= */
  const taskList = document.getElementById("taskList");
  const addBtn = document.getElementById("addBtn");
  const taskInput = document.getElementById("taskInput");
  const prioritySelect = document.getElementById("priority");
  const searchInput = document.getElementById("searchInput");
  const emptyMessage = document.getElementById("emptyMessage");
  const streakCount = document.getElementById("streakCount");
  const progressPercent = document.getElementById("progressPercent");
  const progressFill = document.getElementById("progressFill");
  const themeToggle = document.getElementById("themeToggle");
  const filterButtons = document.querySelectorAll(".filters button");
  const calendarToggle = document.getElementById("calendarToggle");
  const calendarContainer = document.getElementById("calendarContainer");
  const calendar = document.getElementById("calendar");

  /* ================= HELPERS ================= */
  const getToday = () => new Date().toISOString().split("T")[0];

  const saveTasks = () =>
    localStorage.setItem("tasks", JSON.stringify(tasks));

  const saveStreak = () =>
    localStorage.setItem("streakData", JSON.stringify(streakData));

  const saveDayStatus = (dateKey, percent) => {
    if (percent === 100) localStorage.setItem(dateKey, "full");
    else if (percent > 0) localStorage.setItem(dateKey, "partial");
    else localStorage.setItem(dateKey, "none");
  };

  /* ================= ADD TASK ================= */
  function addTask(title, priority) {
    const task = {
      id: Date.now(),
      title,
      priority,
      completed: false,
      createdAt: getToday()
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
  }

  /* ================= TOGGLE TASK ================= */
  function toggleTask(id) {
    tasks = tasks.map(task =>
      task.id === id
        ? { ...task, completed: !task.completed }
        : task
    );

    saveTasks();
    renderTasks();
  }

  /* ================= DELETE TASK ================= */
  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
  }

  /* ================= RENDER TASKS ================= */
  function renderTasks() {
    const searchText = searchInput.value.toLowerCase().trim();
    taskList.innerHTML = "";

    let filteredTasks = [...tasks];

    if (currentFilter === "completed")
      filteredTasks = filteredTasks.filter(task => task.completed);

    if (currentFilter === "active")
      filteredTasks = filteredTasks.filter(task => !task.completed);

    if (searchText !== "")
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchText)
      );

    const priorityOrder = { high: 1, medium: 2, low: 3 };

    filteredTasks.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    emptyMessage.style.display =
      filteredTasks.length === 0 ? "block" : "none";

    filteredTasks.forEach(task => {
      const li = document.createElement("li");
      if (task.completed) li.classList.add("completed");

      const span = document.createElement("span");
      span.textContent = `${task.title} (${task.priority})`;

      const btnContainer = document.createElement("div");

      const completeBtn = document.createElement("button");
      completeBtn.textContent = "✔️";
      completeBtn.onclick = () => toggleTask(task.id);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "✖️";
      deleteBtn.onclick = () => deleteTask(task.id);

      btnContainer.appendChild(completeBtn);
      btnContainer.appendChild(deleteBtn);

      li.appendChild(span);
      li.appendChild(btnContainer);
      taskList.appendChild(li);
    });

    updateProgress();
    updateStreak();
    renderCalendar();
  }

  /* ================= DAILY PROGRESS ================= */
  function updateProgress() {
    const today = getToday();

    const todayTasks = tasks.filter(
      task => task.createdAt === today
    );

    const completed = todayTasks.filter(
      task => task.completed
    ).length;

    const percent =
      todayTasks.length === 0
        ? 0
        : Math.round((completed / todayTasks.length) * 100);

    progressPercent.textContent = percent + "%";
    progressFill.style.width = percent + "%";

    saveDayStatus(today, percent);

    // 🎉 Smart Confetti (multiple times per day allowed)
    if (percent === 100 && lastPercent !== 100 && todayTasks.length > 0) {
      launchConfetti();
    }

    lastPercent = percent;
  }

  /* ================= STREAK SYSTEM ================= */
  function updateStreak() {
    const today = getToday();

    const completedToday = tasks.some(
      task => task.completed && task.createdAt === today
    );

    if (!completedToday) return;
    if (streakData.lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    if (streakData.lastDate === yesterdayKey) {
      streakData.current += 1;
    } else {
      streakData.current = 1;
    }

    streakData.lastDate = today;
    saveStreak();

    streakCount.textContent =
      streakData.current >= 5
        ? streakData.current + " 🔥"
        : streakData.current;
  }

  /* ================= CALENDAR ================= */
  function renderCalendar() {
    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const header = document.createElement("div");
    header.classList.add("calendar-header");

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀";
    prevBtn.onclick = () => {
      currentDate.setMonth(month - 1);
      renderCalendar();
    };

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "▶";
    nextBtn.onclick = () => {
      currentDate.setMonth(month + 1);
      renderCalendar();
    };

    const title = document.createElement("span");
    title.textContent =
      `${currentDate.toLocaleString("default", { month: "long" })} ${year}`;

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);
    calendar.appendChild(header);

    const grid = document.createElement("div");
    grid.classList.add("calendar-grid");

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      grid.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayBox = document.createElement("div");
      dayBox.classList.add("calendar-day");
      dayBox.innerText = day;

      const dateKey =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const dayProgress = localStorage.getItem(dateKey);

      if (dayProgress === "full") dayBox.classList.add("day-full");
      if (dayProgress === "partial") dayBox.classList.add("day-partial");
      if (dayProgress === "none") dayBox.classList.add("day-none");

      grid.appendChild(dayBox);
    }

    calendar.appendChild(grid);
  }

  /* ================= CONFETTI ================= */
  function launchConfetti() {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  /* ================= EVENTS ================= */
  addBtn.onclick = () => {
    if (taskInput.value.trim() === "") return;
    addTask(taskInput.value.trim(), prioritySelect.value);
    taskInput.value = "";
  };

  taskInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addBtn.click();
  });

  searchInput.addEventListener("input", renderTasks);

  filterButtons.forEach(button => {
    button.onclick = () => {
      filterButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderTasks();
    };
  });

  themeToggle.onclick = () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.removeItem("theme");
    }
  };

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }

  calendarToggle.onclick = () => {
    calendarContainer.classList.toggle("calendar-hidden");
  };

  /* ================= RANDOM QUOTES ================= */
  const quotes = [
    "Small steps today, big blooms tomorrow",
    "Consistency is your secret weapon",
    "Progress, not perfection",
    "Water your goals daily",
    "Grow through what you go through",
    "Start small, stay consistent",
    "One task, one bloom"
  ];

  document.getElementById("quote").textContent =
    quotes[Math.floor(Math.random() * quotes.length)];

  /* ================= INIT ================= */
  renderTasks();
  streakCount.textContent = streakData.current;

});