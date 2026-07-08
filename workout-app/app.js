/* ===================== Understory — app.js ===================== */

const STORAGE_KEY = "understory-state-v1";

const TYPES = {
  strength: { label: "Strength", color: "var(--c-strength)", hex: null, icon: "⛰" },
  bike:     { label: "Bike",     color: "var(--c-bike)",     hex: null, icon: "◍" },
  run:      { label: "Run",      color: "var(--c-run)",      hex: null, icon: "◐" },
  climb:    { label: "Climb",    color: "var(--c-climb)",    hex: null, icon: "▲" },
  yoga:     { label: "Yoga",     color: "var(--c-yoga)",     hex: null, icon: "◉" },
  hike:     { label: "Hike",     color: "var(--c-hike)",     hex: null, icon: "◭" },
  surf:     { label: "Surf",     color: "var(--c-surf)",     hex: null, icon: "≈" },
};

const THEMES = [
  { id: "foggy-pine", name: "Foggy Pine", desc: "Deep evergreen, dark", dots: ["#161D19","#7FA3AD","#B8A9D9"] },
  { id: "highland-mist", name: "Highland Mist", desc: "Soft sage, light", dots: ["#E7ECE3","#5F84A0","#8A76BF"] },
  { id: "dusk-ridge", name: "Dusk Ridge", desc: "Twilight, blue-forward", dots: ["#1B1E2B","#7C93D6","#A691D9"] },
];

const EQUIPMENT = ["Barbell", "Free weight", "Plate", "Kettle bell", "Body weight"];
const YOGA_STYLES = ["Vinyasa", "Hatha", "Ashtanga", "Yin", "Restorative"];
const BIKE_STARTS = ["Mountain", "Trail", "Road"];
const CLIMB_STARTS = ["Top rope", "Boulder"];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/* ---------------- State ---------------- */
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn("load failed", e); }
  return {
    theme: "foggy-pine",
    gyms: [], studios: [], spots: [],
    workouts: [], sessions: [], routines: [],
  };
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------------- Navigation ---------------- */
const screens = ["home", "workouts", "routines", "settings"];
function showScreen(name) {
  screens.forEach((s) => {
    document.getElementById("screen-" + s).classList.toggle("hidden", s !== name);
  });
  document.querySelectorAll(".nav-btn[data-screen]").forEach((b) => {
    b.classList.toggle("active", b.dataset.screen === name);
  });
  if (name === "workouts") renderWorkoutList();
  if (name === "routines") renderRoutineList();
  if (name === "settings") renderSettings();
  if (name === "home") renderCalendar();
}

document.querySelectorAll(".nav-btn[data-screen]").forEach((b) => {
  b.addEventListener("click", () => showScreen(b.dataset.screen));
});
document.getElementById("fabLog").addEventListener("click", openTypeMatrix);
document.getElementById("settingsBtn").addEventListener("click", () => showScreen("settings"));
document.getElementById("newWorkoutBtn").addEventListener("click", openTypeMatrix);
document.getElementById("newRoutineBtn").addEventListener("click", openRoutineBuilder);

/* ---------------- Sheet helpers ---------------- */
const sheetBackdrop = document.getElementById("sheetBackdrop");
const sheetEl = document.getElementById("sheet");
function openSheet(html) {
  sheetEl.innerHTML = '<div class="sheet-handle"></div>' + html;
  sheetBackdrop.classList.remove("hidden");
}
function closeSheet() {
  sheetBackdrop.classList.add("hidden");
  sheetEl.innerHTML = "";
}
sheetBackdrop.addEventListener("click", (e) => { if (e.target === sheetBackdrop) closeSheet(); });

/* ===================== CALENDAR ===================== */
let calCursor = new Date();
calCursor.setDate(1);

document.getElementById("calPrev").addEventListener("click", () => {
  calCursor.setMonth(calCursor.getMonth() - 1); renderCalendar();
});
document.getElementById("calNext").addEventListener("click", () => {
  calCursor.setMonth(calCursor.getMonth() + 1); renderCalendar();
});

function sessionsByDate() {
  const map = {};
  state.sessions.forEach((s) => {
    (map[s.date] = map[s.date] || []).push(s);
  });
  return map;
}

function renderCalendar() {
  const label = calCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  document.getElementById("calMonthLabel").textContent = label;

  const grid = document.getElementById("calGrid");
  grid.innerHTML = "";
  ["S","M","T","W","T","F","S"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "cal-dow"; el.textContent = d;
    grid.appendChild(el);
  });

  const year = calCursor.getFullYear(), month = calCursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const byDate = sessionsByDate();
  const todayStr = todayISO();

  for (let i = 0; i < firstDow; i++) {
    const el = document.createElement("div");
    el.className = "cal-day empty";
    grid.appendChild(el);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const el = document.createElement("div");
    el.className = "cal-day" + (iso === todayStr ? " today" : "");
    const num = document.createElement("div");
    num.textContent = day;
    el.appendChild(num);

    const daySessions = byDate[iso] || [];
    if (daySessions.length) {
      const types = [...new Set(daySessions.map((s) => s.type))];
      const dotsWrap = document.createElement("div");
      dotsWrap.className = "cal-day-dots";
      if (types.length === 1) {
        const dot = document.createElement("span");
        dot.className = "cal-dot";
        dot.style.background = TYPES[types[0]].color;
        dotsWrap.appendChild(dot);
      } else {
        const dot = document.createElement("span");
        dot.className = "cal-dot stripe";
        const seg = types.map((t) => TYPES[t].color).join(",");
        dot.style.setProperty("--seg-colors", seg);
        dotsWrap.appendChild(dot);
      }
      el.appendChild(dotsWrap);
    }
    el.addEventListener("click", () => selectDay(iso));
    grid.appendChild(el);
  }

  renderLegend();
}

function renderLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  Object.entries(TYPES).forEach(([key, t]) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-dot" style="background:${t.color}"></span>${t.label}`;
    legend.appendChild(item);
  });
}

function selectDay(iso) {
  const detail = document.getElementById("dayDetail");
  const daySessions = state.sessions.filter((s) => s.date === iso);
  if (!daySessions.length) {
    detail.className = "empty-state";
    detail.textContent = `Nothing logged on ${fmtDate(iso)} yet.`;
    return;
  }
  detail.className = "";
  detail.innerHTML = daySessions.map((s) => sessionCardHTML(s)).join("");
}

function sessionCardHTML(s) {
  const t = TYPES[s.type];
  return `
    <div class="card">
      <div class="card-row">
        <div>
          <div class="card-title">${escapeHTML(s.workoutName)}</div>
          <div class="card-sub">${fmtDate(s.date)} · ${sessionSummaryLine(s)}</div>
        </div>
        <span class="type-badge" style="background:${t.color}">${t.label}</span>
      </div>
    </div>`;
}

function sessionSummaryLine(s) {
  switch (s.type) {
    case "strength": return `${(s.exercises||[]).length} exercise${(s.exercises||[]).length===1?"":"s"}`;
    case "bike": case "run": case "hike":
      return [s.start, s.duration ? `${s.duration}` : null, s.distance ? `${s.distance} mi` : null].filter(Boolean).join(" · ");
    case "climb": return `${(s.routes||[]).length} route${(s.routes||[]).length===1?"":"s"} · ${s.start||""}`;
    case "yoga": return [s.style, s.duration].filter(Boolean).join(" · ");
    case "surf": return [s.spot, s.duration].filter(Boolean).join(" · ");
    default: return "";
  }
}

function escapeHTML(str) {
  return (str||"").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

/* ===================== TYPE MATRIX → BUILD/LOG ===================== */
function openTypeMatrix() {
  const html = `
    <h3 style="margin-bottom:14px;">What are you logging?</h3>
    <div class="matrix">
      ${Object.entries(TYPES).map(([key,t]) => `
        <div class="matrix-btn" data-type="${key}">
          <span class="matrix-dot" style="background:${t.color}"></span>
          <span>${t.label}</span>
        </div>`).join("")}
    </div>`;
  openSheet(html);
  sheetEl.querySelectorAll(".matrix-btn").forEach((btn) => {
    btn.addEventListener("click", () => openTemplatePicker(btn.dataset.type));
  });
}

function openTemplatePicker(type) {
  const existing = state.workouts.filter((w) => w.type === type);
  const html = `
    <h3 style="margin-bottom:4px;">${TYPES[type].label} workout</h3>
    <p class="card-sub" style="margin-bottom:14px;">Pick a saved workout to log again, or build a new one.</p>
    ${existing.map((w) => `<div class="card" data-pick="${w.id}" style="cursor:pointer;">
        <div class="card-row"><div class="card-title">${escapeHTML(w.name)}</div><span class="card-sub">›</span></div>
      </div>`).join("")}
    <div class="field" style="margin-top:14px;">
      <label>Name a new ${TYPES[type].label.toLowerCase()} workout</label>
      <input type="text" id="newWorkoutName" placeholder="e.g. Push Day A" />
    </div>
    <button class="btn" id="createWorkoutBtn">Build & start logging</button>
  `;
  openSheet(html);
  sheetEl.querySelectorAll("[data-pick]").forEach((card) => {
    card.addEventListener("click", () => {
      const w = state.workouts.find((x) => x.id === card.dataset.pick);
      openLogForm(w);
    });
  });
  sheetEl.querySelector("#createWorkoutBtn").addEventListener("click", () => {
    const nameInput = sheetEl.querySelector("#newWorkoutName");
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    const w = { id: uid(), type, name, repeatable: true, createdAt: Date.now() };
    state.workouts.push(w);
    saveState();
    openLogForm(w);
  });
}

/* ===================== LOG FORM (per type) ===================== */
function openLogForm(workout) {
  const type = workout.type;
  const dateVal = todayISO();
  let bodyHTML = "";

  if (type === "strength") bodyHTML = strengthFormHTML();
  else if (type === "bike") bodyHTML = cardioFormHTML(true);
  else if (type === "run") bodyHTML = cardioFormHTML(false);
  else if (type === "hike") bodyHTML = cardioFormHTML(false);
  else if (type === "climb") bodyHTML = climbFormHTML();
  else if (type === "yoga") bodyHTML = yogaFormHTML();
  else if (type === "surf") bodyHTML = surfFormHTML();

  const html = `
    <h3 style="margin-bottom:2px;">${escapeHTML(workout.name)}</h3>
    <p class="card-sub" style="margin-bottom:16px;">${TYPES[type].label} · logging a session</p>
    <div class="field"><label>Date</label><input type="date" id="logDate" value="${dateVal}" /></div>
    ${bodyHTML}
    <button class="btn" id="saveSessionBtn" style="margin-top:6px;">Save entry</button>
  `;
  openSheet(html);
  wireLogFormEvents(type);
  sheetEl.querySelector("#saveSessionBtn").addEventListener("click", () => saveSession(workout));
}

/* ---- Strength ---- */
let strengthExercises = [];
function strengthFormHTML() {
  strengthExercises = [];
  return `
    <div class="section-title" style="margin-top:0;">Exercises</div>
    <div id="exerciseList"></div>
    <div class="dropdown-add" style="margin-bottom:14px;">
      <input type="text" id="newExerciseName" placeholder="Exercise name, e.g. Bench Press" />
      <button id="addExerciseBtn" type="button">Add</button>
    </div>
  `;
}
function wireStrength() {
  const listEl = document.getElementById("exerciseList");
  function render() {
    listEl.innerHTML = strengthExercises.map((ex, i) => exerciseCardHTML(ex, i)).join("");
    listEl.querySelectorAll("[data-add-set]").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.addSet;
      strengthExercises[i].sets.push({ reps: "", weight: "", equipment: EQUIPMENT[0], notes: "" });
      render();
    }));
    listEl.querySelectorAll("[data-remove-ex]").forEach((b) => b.addEventListener("click", () => {
      strengthExercises.splice(+b.dataset.removeEx, 1); render();
    }));
    listEl.querySelectorAll("[data-remove-set]").forEach((b) => b.addEventListener("click", () => {
      const [ei, si] = b.dataset.removeSet.split("-").map(Number);
      strengthExercises[ei].sets.splice(si, 1); render();
    }));
    listEl.querySelectorAll(".set-row input, .set-row select").forEach((inp) => {
      inp.addEventListener("input", () => {
        const [ei, si] = inp.dataset.set.split("-").map(Number);
        strengthExercises[ei].sets[si][inp.dataset.field] = inp.value;
      });
    });
    listEl.querySelectorAll("[data-timer]").forEach((b) => b.addEventListener("click", () => toggleExerciseTimer(+b.dataset.timer, render)));
    listEl.querySelectorAll("[data-rest]").forEach((b) => b.addEventListener("click", () => startRestTimer(b)));
  }
  document.getElementById("addExerciseBtn").addEventListener("click", () => {
    const inp = document.getElementById("newExerciseName");
    const name = inp.value.trim();
    if (!name) { inp.focus(); return; }
    strengthExercises.push({ name, sets: [{ reps:"", weight:"", equipment: EQUIPMENT[0], notes:"" }], durationSec: 0, timerRunning: false, timerStart: null });
    inp.value = "";
    render();
  });
  render();
}
function exerciseCardHTML(ex, i) {
  return `
    <div class="exercise-card">
      <div class="exercise-name">
        <span>${escapeHTML(ex.name)}</span>
        <button class="remove-x" data-remove-ex="${i}">✕</button>
      </div>
      <div class="timer-box">
        <div class="timer-display" id="exTimerDisplay-${i}">${formatDuration(ex.durationSec)}</div>
        <button class="btn secondary" data-timer="${i}">${ex.timerRunning ? "Stop" : "Start"} exercise timer</button>
        <div class="rest-row">
          <div class="chip" data-rest="30">Rest 0.5m</div>
          <div class="chip" data-rest="60">Rest 1m</div>
          <div class="chip" data-rest="90">Rest 1.5m</div>
        </div>
      </div>
      ${ex.sets.map((s, si) => `
        <div class="set-row">
          <span class="set-idx">${si+1}</span>
          <select data-set="${i}-${si}" data-field="equipment">
            ${EQUIPMENT.map((eq) => `<option ${s.equipment===eq?"selected":""}>${eq}</option>`).join("")}
          </select>
          <input type="number" placeholder="lbs" data-set="${i}-${si}" data-field="weight" value="${s.weight}" />
          <input type="number" placeholder="reps" data-set="${i}-${si}" data-field="reps" value="${s.reps}" />
        </div>
        <div class="set-row" style="grid-template-columns: 26px 1fr 26px;">
          <span></span>
          <input type="text" placeholder="notes" data-set="${i}-${si}" data-field="notes" value="${escapeHTML(s.notes)}" />
          <button class="remove-x" data-remove-set="${i}-${si}">✕</button>
        </div>
      `).join("")}
      <button class="btn ghost" data-add-set="${i}" style="margin-top:6px;">+ Add set</button>
    </div>
  `;
}
let exerciseTimers = {};
function toggleExerciseTimer(i, render) {
  const ex = strengthExercises[i];
  if (ex.timerRunning) {
    clearInterval(exerciseTimers[i]);
    ex.durationSec += Math.floor((Date.now() - ex.timerStart) / 1000);
    ex.timerRunning = false;
    render();
  } else {
    ex.timerRunning = true;
    ex.timerStart = Date.now();
    render();
    exerciseTimers[i] = setInterval(() => {
      const el = document.getElementById(`exTimerDisplay-${i}`);
      if (el) el.textContent = formatDuration(ex.durationSec + Math.floor((Date.now()-ex.timerStart)/1000));
    }, 1000);
  }
}
function formatDuration(sec) {
  const m = Math.floor(sec/60), s = sec%60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
let restInterval = null;
function startRestTimer(btn) {
  const seconds = +btn.dataset.rest;
  if (restInterval) clearInterval(restInterval);
  let remaining = seconds;
  const original = btn.textContent;
  btn.classList.add("selected");
  btn.textContent = formatDuration(remaining);
  restInterval = setInterval(() => {
    remaining--;
    btn.textContent = formatDuration(Math.max(remaining,0));
    if (remaining <= 0) {
      clearInterval(restInterval);
      btn.textContent = original;
      btn.classList.remove("selected");
      if (navigator.vibrate) navigator.vibrate(200);
    }
  }, 1000);
}

/* ---- Bike / Run / Hike ---- */
let cardioSelStart = null;
function cardioFormHTML(hasStart) {
  cardioSelStart = null;
  return `
    ${hasStart ? `
    <div class="field">
      <label>Start</label>
      <div class="chip-group" id="startChips">
        ${BIKE_STARTS.map((s) => `<div class="chip" data-start="${s}">${s}</div>`).join("")}
      </div>
    </div>` : ""}
    <div class="field"><label>Duration</label><input type="text" id="cDuration" placeholder="hh:mm" /></div>
    <div class="field">
      <label>Elevation gain</label>
      <div class="chip-group" style="margin-bottom:8px;">
        <div class="chip" id="flatChip">Flat</div>
      </div>
      <input type="number" id="cElevation" placeholder="feet of gain" />
    </div>
    <div class="field"><label>Distance (mi)</label><input type="number" id="cDistance" placeholder="0.0" step="0.1" /></div>
  `;
}
function wireCardio() {
  const startChips = document.getElementById("startChips");
  if (startChips) {
    startChips.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
      startChips.querySelectorAll(".chip").forEach((x) => x.classList.remove("selected"));
      c.classList.add("selected"); cardioSelStart = c.dataset.start;
    }));
  }
  const flatChip = document.getElementById("flatChip");
  const elevInput = document.getElementById("cElevation");
  flatChip.addEventListener("click", () => {
    flatChip.classList.toggle("selected");
    elevInput.disabled = flatChip.classList.contains("selected");
    if (elevInput.disabled) elevInput.value = "";
  });
}

/* ---- Climb ---- */
let climbSelStart = null;
let climbRoutes = [];
function climbFormHTML() {
  climbSelStart = null; climbRoutes = [{ rating: 3, completed: true, gym: state.gyms[0] || "" }];
  return `
    <div class="field">
      <label>Start</label>
      <div class="chip-group" id="climbStartChips">
        ${CLIMB_STARTS.map((s) => `<div class="chip" data-start="${s}">${s}</div>`).join("")}
      </div>
    </div>
    <div class="section-title" style="margin-top:6px;">Routes</div>
    <div id="routeList"></div>
    <button class="btn ghost" id="addRouteBtn" type="button">+ Add a route</button>
  `;
}
function wireClimb() {
  const startChips = document.getElementById("climbStartChips");
  startChips.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
    startChips.querySelectorAll(".chip").forEach((x) => x.classList.remove("selected"));
    c.classList.add("selected"); climbSelStart = c.dataset.start;
  }));
  const routeList = document.getElementById("routeList");
  function render() {
    routeList.innerHTML = climbRoutes.map((r, i) => `
      <div class="route-card">
        <div class="route-head">
          <span>Route ${i+1}</span>
          <button class="remove-x" data-remove-route="${i}">✕</button>
        </div>
        <div class="field" style="margin-bottom:8px;">
          <label>Rating</label>
          <div class="chip-group">
            ${[1,2,3,4,5].map((n) => `<div class="chip ${r.rating===n?"selected":""}" data-rate="${i}-${n}">${n}★</div>`).join("")}
          </div>
        </div>
        <div class="field" style="margin-bottom:8px;">
          <div class="chip-group">
            <div class="chip ${r.completed?"selected":""}" data-complete="${i}-1">Completed</div>
            <div class="chip ${!r.completed?"selected":""}" data-complete="${i}-0">Not completed</div>
          </div>
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>Gym</label>
          <select data-gym="${i}">
            <option value="">Select gym…</option>
            ${state.gyms.map((g) => `<option ${r.gym===g?"selected":""}>${g}</option>`).join("")}
          </select>
          <div class="dropdown-add">
            <input type="text" placeholder="Add a new gym" data-newgym="${i}" />
            <button type="button" data-addgym="${i}">Add</button>
          </div>
        </div>
      </div>
    `).join("");
    routeList.querySelectorAll("[data-remove-route]").forEach((b) => b.addEventListener("click", () => {
      climbRoutes.splice(+b.dataset.removeRoute,1); render();
    }));
    routeList.querySelectorAll("[data-rate]").forEach((b) => b.addEventListener("click", () => {
      const [i,n] = b.dataset.rate.split("-").map(Number);
      climbRoutes[i].rating = n; render();
    }));
    routeList.querySelectorAll("[data-complete]").forEach((b) => b.addEventListener("click", () => {
      const [i,v] = b.dataset.complete.split("-").map(Number);
      climbRoutes[i].completed = !!v; render();
    }));
    routeList.querySelectorAll("[data-gym]").forEach((sel) => sel.addEventListener("change", () => {
      climbRoutes[+sel.dataset.gym].gym = sel.value;
    }));
    routeList.querySelectorAll("[data-addgym]").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.addgym;
      const input = routeList.querySelector(`[data-newgym="${i}"]`);
      const val = input.value.trim();
      if (!val) return;
      if (!state.gyms.includes(val)) { state.gyms.push(val); saveState(); }
      climbRoutes[i].gym = val;
      render();
    }));
  }
  document.getElementById("addRouteBtn").addEventListener("click", () => {
    climbRoutes.push({ rating: 3, completed: true, gym: state.gyms[0] || "" });
    render();
  });
  render();
}

/* ---- Yoga ---- */
let yogaSelStyle = null;
function yogaFormHTML() {
  yogaSelStyle = null;
  return `
    <div class="field">
      <label>Style</label>
      <div class="chip-group" id="yogaStyleChips">
        ${YOGA_STYLES.map((s) => `<div class="chip" data-style="${s}">${s}</div>`).join("")}
      </div>
    </div>
    <div class="field"><label>Class name</label><input type="text" id="yogaClassName" placeholder="e.g. Sunrise Flow" /></div>
    <div class="field"><label>Duration</label><input type="text" id="yogaDuration" placeholder="hh:mm" /></div>
    <div class="field">
      <label>Studio</label>
      <select id="yogaStudio">
        <option value="">Select studio…</option>
        ${state.studios.map((s) => `<option>${s}</option>`).join("")}
      </select>
      <div class="dropdown-add">
        <input type="text" id="newStudio" placeholder="Add a new studio" />
        <button type="button" id="addStudioBtn">Add</button>
      </div>
    </div>
  `;
}
function wireYoga() {
  const chips = document.getElementById("yogaStyleChips");
  chips.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
    chips.querySelectorAll(".chip").forEach((x) => x.classList.remove("selected"));
    c.classList.add("selected"); yogaSelStyle = c.dataset.style;
  }));
  document.getElementById("addStudioBtn").addEventListener("click", () => {
    const input = document.getElementById("newStudio");
    const val = input.value.trim();
    if (!val) return;
    if (!state.studios.includes(val)) { state.studios.push(val); saveState(); }
    const sel = document.getElementById("yogaStudio");
    sel.innerHTML = `<option value="">Select studio…</option>` + state.studios.map((s) => `<option ${s===val?"selected":""}>${s}</option>`).join("");
    input.value = "";
  });
}

/* ---- Surf ---- */
function surfFormHTML() {
  return `
    <div class="field"><label>Board</label><input type="text" id="surfBoard" placeholder="e.g. 6'2 Fish" /></div>
    <div class="field"><label>Wave size (ft)</label><input type="number" id="surfWaveSize" placeholder="0" /></div>
    <div class="field"><label>Duration</label><input type="text" id="surfDuration" placeholder="hh:mm" /></div>
    <div class="field">
      <label>Surf spot</label>
      <select id="surfSpot">
        <option value="">Select spot…</option>
        ${state.spots.map((s) => `<option>${s}</option>`).join("")}
      </select>
      <div class="dropdown-add">
        <input type="text" id="newSpot" placeholder="Add a new spot" />
        <button type="button" id="addSpotBtn">Add</button>
      </div>
    </div>
  `;
}
function wireSurf() {
  document.getElementById("addSpotBtn").addEventListener("click", () => {
    const input = document.getElementById("newSpot");
    const val = input.value.trim();
    if (!val) return;
    if (!state.spots.includes(val)) { state.spots.push(val); saveState(); }
    const sel = document.getElementById("surfSpot");
    sel.innerHTML = `<option value="">Select spot…</option>` + state.spots.map((s) => `<option ${s===val?"selected":""}>${s}</option>`).join("");
    input.value = "";
  });
}

function wireLogFormEvents(type) {
  if (type === "strength") wireStrength();
  else if (type === "bike" || type === "run" || type === "hike") wireCardio();
  else if (type === "climb") wireClimb();
  else if (type === "yoga") wireYoga();
  else if (type === "surf") wireSurf();
}

/* ---- Save session ---- */
function saveSession(workout) {
  const type = workout.type;
  const date = sheetEl.querySelector("#logDate").value || todayISO();
  const base = { id: uid(), workoutId: workout.id, workoutName: workout.name, type, date, createdAt: Date.now() };
  let session = null;

  if (type === "strength") {
    strengthExercises.forEach((ex) => { if (ex.timerRunning) { ex.durationSec += Math.floor((Date.now()-ex.timerStart)/1000); ex.timerRunning=false; } });
    session = { ...base, exercises: strengthExercises.map((ex) => ({ name: ex.name, durationSec: ex.durationSec, sets: ex.sets })) };
  } else if (type === "bike" || type === "run" || type === "hike") {
    const duration = sheetEl.querySelector("#cDuration").value;
    const flat = sheetEl.querySelector("#flatChip").classList.contains("selected");
    const elevation = flat ? "Flat" : sheetEl.querySelector("#cElevation").value;
    const distance = sheetEl.querySelector("#cDistance").value;
    session = { ...base, start: cardioSelStart, duration, elevation, distance };
  } else if (type === "climb") {
    session = { ...base, start: climbSelStart, routes: climbRoutes };
  } else if (type === "yoga") {
    session = { ...base,
      style: yogaSelStyle,
      className: sheetEl.querySelector("#yogaClassName").value,
      duration: sheetEl.querySelector("#yogaDuration").value,
      studio: sheetEl.querySelector("#yogaStudio").value,
    };
  } else if (type === "surf") {
    session = { ...base,
      board: sheetEl.querySelector("#surfBoard").value,
      waveSize: sheetEl.querySelector("#surfWaveSize").value,
      duration: sheetEl.querySelector("#surfDuration").value,
      spot: sheetEl.querySelector("#surfSpot").value,
    };
  }

  state.sessions.push(session);
  saveState();
  closeSheet();
  showScreen("home");
  calCursor = new Date(date + "T00:00:00"); calCursor.setDate(1);
  renderCalendar();
  selectDay(date);
}

/* ===================== WORKOUTS LIST ===================== */
function renderWorkoutList() {
  const el = document.getElementById("workoutList");
  if (!state.workouts.length) {
    el.innerHTML = `<div class="empty-state">No workouts built yet. Tap below to create your first one.</div>`;
    return;
  }
  el.innerHTML = state.workouts.map((w) => {
    const count = state.sessions.filter((s) => s.workoutId === w.id).length;
    const t = TYPES[w.type];
    return `
      <div class="card">
        <div class="card-row">
          <div>
            <div class="card-title">${escapeHTML(w.name)}</div>
            <div class="card-sub">${count} session${count===1?"":"s"} logged</div>
          </div>
          <span class="type-badge" style="background:${t.color}">${t.label}</span>
        </div>
        <div class="btn-row" style="margin-top:12px;">
          <button class="btn secondary" data-log="${w.id}">Log session</button>
          <button class="btn danger" data-del="${w.id}">Delete</button>
        </div>
      </div>`;
  }).join("");
  el.querySelectorAll("[data-log]").forEach((b) => b.addEventListener("click", () => {
    openLogForm(state.workouts.find((w) => w.id === b.dataset.log));
  }));
  el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Delete this workout? Logged sessions stay in your history.")) return;
    state.workouts = state.workouts.filter((w) => w.id !== b.dataset.del);
    saveState(); renderWorkoutList();
  }));
}

/* ===================== ROUTINES ===================== */
function openRoutineBuilder() {
  const html = `
    <h3 style="margin-bottom:14px;">Build a weekly routine</h3>
    <div class="field"><label>Routine name</label><input type="text" id="routineName" placeholder="e.g. Summer Strength Block" /></div>
    <div class="field"><label>Duration (weeks)</label><input type="number" id="routineWeeks" value="6" min="1" /></div>
    <div class="field"><label>Start date</label><input type="date" id="routineStart" value="${todayISO()}" /></div>
    <div class="field">
      <label>Workouts in this routine</label>
      <div class="chip-group" id="routineWorkoutChips">
        ${state.workouts.length ? state.workouts.map((w) => `<div class="chip" data-w="${w.id}">${escapeHTML(w.name)}</div>`).join("")
          : `<span class="card-sub">Build a workout first, then come back here.</span>`}
      </div>
      <p class="card-sub" style="margin-top:8px;">This is a flexible pool — you can log any of these workouts any day during the routine, and update the pool anytime.</p>
    </div>
    <button class="btn" id="saveRoutineBtn">Create routine</button>
  `;
  openSheet(html);
  const picked = new Set();
  sheetEl.querySelectorAll("#routineWorkoutChips .chip").forEach((c) => c.addEventListener("click", () => {
    c.classList.toggle("selected");
    if (c.classList.contains("selected")) picked.add(c.dataset.w); else picked.delete(c.dataset.w);
  }));
  sheetEl.querySelector("#saveRoutineBtn").addEventListener("click", () => {
    const name = sheetEl.querySelector("#routineName").value.trim();
    const weeks = +sheetEl.querySelector("#routineWeeks").value || 1;
    const start = sheetEl.querySelector("#routineStart").value || todayISO();
    if (!name) return;
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + weeks*7);
    const routine = {
      id: uid(), name, durationWeeks: weeks,
      startDate: start, endDate: endDate.toISOString().slice(0,10),
      workoutIds: [...picked], summary: null, createdAt: Date.now(),
    };
    state.routines.push(routine); saveState(); closeSheet(); showScreen("routines");
  });
}

function renderRoutineList() {
  const el = document.getElementById("routineList");
  if (!state.routines.length) {
    el.innerHTML = `<div class="empty-state">No routines yet. Group workouts into a routine and set a duration to track progress toward a goal.</div>`;
    return;
  }
  const today = todayISO();
  el.innerHTML = state.routines.slice().reverse().map((r) => {
    const isDone = today >= r.endDate;
    const sessionsInRoutine = state.sessions.filter((s) => r.workoutIds.includes(s.workoutId) && s.date >= r.startDate && s.date <= r.endDate);
    return `
      <div class="card">
        <div class="card-row">
          <div>
            <div class="card-title">${escapeHTML(r.name)}</div>
            <div class="card-sub">${r.durationWeeks} weeks · ${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}</div>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat-box"><div class="stat-num">${sessionsInRoutine.length}</div><div class="stat-label">Sessions logged</div></div>
          <div class="stat-box"><div class="stat-num">${r.workoutIds.length}</div><div class="stat-label">Workouts in pool</div></div>
        </div>
        <div class="btn-row">
          <button class="btn secondary" data-edit-pool="${r.id}">Edit pool</button>
          ${isDone
            ? (r.summary ? `<button class="btn ghost" data-view-summary="${r.id}">View summary</button>` : `<button class="btn" data-gen-summary="${r.id}">Generate summary</button>`)
            : `<button class="btn ghost" disabled style="opacity:0.5;">In progress</button>`}
        </div>
      </div>`;
  }).join("");

  el.querySelectorAll("[data-gen-summary]").forEach((b) => b.addEventListener("click", () => generateSummary(b.dataset.genSummary)));
  el.querySelectorAll("[data-view-summary]").forEach((b) => b.addEventListener("click", () => viewSummary(b.dataset.viewSummary)));
  el.querySelectorAll("[data-edit-pool]").forEach((b) => b.addEventListener("click", () => editPool(b.dataset.editPool)));
}

function editPool(routineId) {
  const r = state.routines.find((x) => x.id === routineId);
  const html = `
    <h3 style="margin-bottom:14px;">Edit workout pool</h3>
    <div class="chip-group" id="editPoolChips">
      ${state.workouts.map((w) => `<div class="chip ${r.workoutIds.includes(w.id)?"selected":""}" data-w="${w.id}">${escapeHTML(w.name)}</div>`).join("")}
    </div>
    <button class="btn" id="savePoolBtn" style="margin-top:16px;">Save</button>
  `;
  openSheet(html);
  const picked = new Set(r.workoutIds);
  sheetEl.querySelectorAll("#editPoolChips .chip").forEach((c) => c.addEventListener("click", () => {
    c.classList.toggle("selected");
    if (c.classList.contains("selected")) picked.add(c.dataset.w); else picked.delete(c.dataset.w);
  }));
  sheetEl.querySelector("#savePoolBtn").addEventListener("click", () => {
    r.workoutIds = [...picked]; saveState(); closeSheet(); renderRoutineList();
  });
}

function generateSummary(routineId) {
  const r = state.routines.find((x) => x.id === routineId);
  const sessions = state.sessions.filter((s) => r.workoutIds.includes(s.workoutId) && s.date >= r.startDate && s.date <= r.endDate)
    .sort((a,b) => a.date.localeCompare(b.date));

  const perWorkout = {};
  r.workoutIds.forEach((id) => { const w = state.workouts.find((x)=>x.id===id); if (w) perWorkout[id] = { name: w.name, count: 0 }; });
  sessions.forEach((s) => { if (perWorkout[s.workoutId]) perWorkout[s.workoutId].count++; });

  // strength progression: compare first vs last logged top weight per exercise name
  const progression = {};
  sessions.filter((s) => s.type === "strength").forEach((s) => {
    (s.exercises||[]).forEach((ex) => {
      const weights = (ex.sets||[]).map((st) => parseFloat(st.weight)).filter((n) => !isNaN(n));
      if (!weights.length) return;
      const top = Math.max(...weights);
      if (!progression[ex.name]) progression[ex.name] = { first: top, last: top, firstDate: s.date, lastDate: s.date };
      else { progression[ex.name].last = top; progression[ex.name].lastDate = s.date; }
    });
  });

  const totalWeeks = r.durationWeeks;
  const summary = {
    generatedAt: Date.now(),
    totalSessions: sessions.length,
    expectedRate: (sessions.length / totalWeeks).toFixed(1),
    perWorkout: Object.values(perWorkout),
    progression,
  };
  r.summary = summary;
  saveState();
  viewSummary(routineId);
}

function viewSummary(routineId) {
  const r = state.routines.find((x) => x.id === routineId);
  const s = r.summary;
  const progRows = Object.entries(s.progression).map(([name, p]) => {
    const delta = p.last - p.first;
    const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
    return `<div class="card-row" style="padding:8px 0;border-top:1px solid var(--border);">
      <span>${escapeHTML(name)}</span><span>${p.first} → ${p.last} lbs ${arrow}</span>
    </div>`;
  }).join("") || `<p class="card-sub">No strength data logged in this window.</p>`;

  const perWorkoutRows = s.perWorkout.map((w) => `
    <div class="card-row" style="padding:8px 0;border-top:1px solid var(--border);">
      <span>${escapeHTML(w.name)}</span><span>${w.count}×</span>
    </div>`).join("");

  const html = `
    <h3 style="margin-bottom:2px;">${escapeHTML(r.name)} — Summary</h3>
    <p class="card-sub" style="margin-bottom:14px;">${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}</p>
    <div class="stat-grid">
      <div class="stat-box"><div class="stat-num">${s.totalSessions}</div><div class="stat-label">Total sessions</div></div>
      <div class="stat-box"><div class="stat-num">${s.expectedRate}</div><div class="stat-label">Avg / week</div></div>
    </div>
    <div class="section-title">By workout</div>
    <div class="card">${perWorkoutRows || '<p class="card-sub">Nothing logged.</p>'}</div>
    <div class="section-title">Strength progression (top set weight)</div>
    <div class="card">${progRows}</div>
  `;
  openSheet(html);
}

/* ===================== SETTINGS ===================== */
function renderSettings() {
  const grid = document.getElementById("themeGrid");
  grid.innerHTML = THEMES.map((t) => `
    <div class="theme-swatch ${state.theme===t.id?"active":""}" data-theme-pick="${t.id}" style="background:${t.dots[0]}22;">
      <div class="swatch-dots">${t.dots.map((d)=>`<span style="background:${d}"></span>`).join("")}</div>
      <div style="color:var(--text)">${t.name}</div>
      <div class="card-sub">${t.desc}</div>
    </div>`).join("");
  grid.querySelectorAll("[data-theme-pick]").forEach((el) => el.addEventListener("click", () => {
    state.theme = el.dataset.themePick; saveState(); applyTheme(); renderSettings();
  }));

  renderChipList("gymChips", state.gyms, (v) => { state.gyms = state.gyms.filter(g=>g!==v); saveState(); renderSettings(); });
  renderChipList("studioChips", state.studios, (v) => { state.studios = state.studios.filter(g=>g!==v); saveState(); renderSettings(); });
  renderChipList("spotChips", state.spots, (v) => { state.spots = state.spots.filter(g=>g!==v); saveState(); renderSettings(); });
}
function renderChipList(elId, list, onRemove) {
  const el = document.getElementById(elId);
  if (!list.length) { el.innerHTML = `<span class="card-sub">None added yet — add one from its log form.</span>`; return; }
  el.innerHTML = list.map((v) => `<div class="chip" data-v="${escapeHTML(v)}">${escapeHTML(v)} ✕</div>`).join("");
  el.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => onRemove(c.dataset.v)));
}
function applyTheme() {
  document.body.setAttribute("data-theme", state.theme);
}

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `understory-backup-${todayISO()}.json`;
  a.click(); URL.revokeObjectURL(url);
});
document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!confirm("This will replace your current data with the imported backup. Continue?")) return;
      state = Object.assign({ theme:"foggy-pine", gyms:[], studios:[], spots:[], workouts:[], sessions:[], routines:[] }, data);
      saveState(); applyTheme(); showScreen("home");
    } catch (err) { alert("Couldn't read that file — is it a valid backup?"); }
  };
  reader.readAsText(file);
});

/* ===================== INIT ===================== */
applyTheme();
renderCalendar();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
