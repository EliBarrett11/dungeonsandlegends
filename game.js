const SLOT_COUNT = 8;

const startMenu = document.getElementById("start-menu");
const lobby = document.getElementById("lobby");
const slotList = document.getElementById("slot-list");

// First slot is the local Human player; the rest default to AI.
const slots = Array.from({ length: SLOT_COUNT }, (_, i) => ({
  type: i === 0 ? "human" : "ai",
  name: i === 0 ? "Player 1" : "",
}));

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function renderSlots() {
  slotList.innerHTML = "";

  slots.forEach((slot, i) => {
    const li = document.createElement("li");
    li.className = "slot";

    const number = document.createElement("span");
    number.className = "slot-number";
    number.textContent = i + 1;

    const toggle = document.createElement("button");
    toggle.className = `slot-toggle ${slot.type}`;
    toggle.textContent = slot.type === "human" ? "Human" : "AI";
    toggle.addEventListener("click", () => {
      slot.type = slot.type === "human" ? "ai" : "human";
      renderSlots();
    });

    let detail;
    if (slot.type === "human") {
      detail = document.createElement("input");
      detail.type = "text";
      detail.className = "slot-name";
      detail.placeholder = "Enter name";
      detail.maxLength = 20;
      detail.value = slot.name;
      detail.addEventListener("input", () => {
        slot.name = detail.value;
      });
    } else {
      detail = document.createElement("span");
      detail.className = "slot-ai-label";
      detail.textContent = "Computer";
    }

    li.append(number, toggle, detail);
    slotList.appendChild(li);
  });
}

document.getElementById("new-game-btn").addEventListener("click", () => {
  renderSlots();
  showScreen(lobby);
});

// ---- Player Screen ----

const GRID_ROWS = 7;
const GRID_COLS = 3;
const BENCH_SIZE = 5;

const TRAITS = {
  aasimar: { name: "Aasimar", icon: "assets/traits/aasimar.svg" },
  barbarian: { name: "Barbarian", icon: "assets/traits/barbarian.svg" },
  acolyte: { name: "Acolyte", icon: "assets/traits/acolyte.svg" },
};

const RARITY_BORDERS = {
  common: "#9e9e9e",
};

const UNIT_TYPES = {
  "DL-001": {
    id: "DL-001",
    name: "DL-001",
    image: "assets/units/DL-001.png",
    portrait: "assets/portraits/DL-001.jpg",
    traits: ["aasimar", "barbarian", "acolyte"],
    cost: 1,
    rarity: "common",
  },
};

const STARTING_GOLD = 3;
const STARTING_HEALTH = 100;

// Fame needed to go from each Renown level to the next.
const FAME_TO_NEXT_LEVEL = {
  1: 2,
};

const BARD_SONG = { fame: 4, cost: 4 };
const SHOP_SIZE = 5;

const playerScreen = document.getElementById("player-screen");
const teamGrid = document.getElementById("team-grid");
const benchEl = document.getElementById("bench");

// Each cell holds a unit or null. Locations are { area: "grid" | "bench", index }.
const grid = new Array(GRID_ROWS * GRID_COLS).fill(null);
const bench = new Array(BENCH_SIZE).fill(null);
const areas = { grid, bench };

function createUnit(typeId) {
  return { type: UNIT_TYPES[typeId] };
}

function buildCells(container, area, count) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const cell = document.createElement("div");
    cell.className = `cell ${area}-cell`;
    cell.dataset.area = area;
    cell.dataset.index = i;
    container.appendChild(cell);
  }
}

function renderUnits() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.innerHTML = "";
    const unit = areas[cell.dataset.area][cell.dataset.index];
    if (!unit) return;

    const unitEl = document.createElement("div");
    unitEl.className = "unit";
    const img = document.createElement("img");
    img.src = unit.type.image;
    img.alt = unit.type.id;
    img.draggable = false;
    unitEl.appendChild(img);
    unitEl.addEventListener("pointerdown", (e) => startDrag(e, cell));
    cell.appendChild(unitEl);
  });
}

// Pointer-based drag and drop so it works with both mouse and touch.
let drag = null;

function startDrag(e, fromCell) {
  e.preventDefault();
  const unit = areas[fromCell.dataset.area][fromCell.dataset.index];

  const ghost = document.createElement("img");
  ghost.className = "drag-ghost";
  ghost.src = unit.type.image;
  document.body.appendChild(ghost);

  drag = { from: fromCell, ghost };
  fromCell.classList.add("dragging-from");
  moveGhost(e);

  document.addEventListener("pointermove", onDragMove);
  document.addEventListener("pointerup", onDragEnd);
  document.addEventListener("pointercancel", onDragEnd);
}

function moveGhost(e) {
  drag.ghost.style.left = `${e.clientX}px`;
  drag.ghost.style.top = `${e.clientY}px`;
}

// Browser hit-testing on the 3D-tilted grid is unreliable, so find the cell
// whose on-screen box contains the point (closest centre wins on overlap).
function cellAtPoint(x, y) {
  let best = null;
  let bestDist = Infinity;
  document.querySelectorAll(".cell").forEach((cell) => {
    const r = cell.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    const dist = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (dist < bestDist) {
      best = cell;
      bestDist = dist;
    }
  });
  return best;
}

function onDragMove(e) {
  moveGhost(e);
  document.querySelectorAll(".cell.drop-target").forEach((c) => c.classList.remove("drop-target"));
  const target = cellAtPoint(e.clientX, e.clientY);
  if (target) target.classList.add("drop-target");
}

function onDragEnd(e) {
  document.removeEventListener("pointermove", onDragMove);
  document.removeEventListener("pointerup", onDragEnd);
  document.removeEventListener("pointercancel", onDragEnd);

  const target = e.type === "pointerup" ? cellAtPoint(e.clientX, e.clientY) : null;
  if (target && target !== drag.from) {
    // Move into an empty cell, or swap with the unit already there.
    const fromArea = areas[drag.from.dataset.area];
    const toArea = areas[target.dataset.area];
    const fromIndex = drag.from.dataset.index;
    const toIndex = target.dataset.index;
    [fromArea[fromIndex], toArea[toIndex]] = [toArea[toIndex], fromArea[fromIndex]];
  }

  drag.ghost.remove();
  document.querySelectorAll(".dragging-from, .drop-target").forEach((c) => {
    c.classList.remove("dragging-from", "drop-target");
  });
  drag = null;
  renderUnits();
  renderShop();
}

// ---- Lobby player health ----

const standingsEl = document.getElementById("standings-list");

let players = [];

function createPlayers() {
  players = slots.map((slot, i) => ({
    name: slot.type === "human" ? slot.name.trim() || `Player ${i + 1}` : `Computer ${i + 1}`,
    type: slot.type,
    health: STARTING_HEALTH,
  }));
}

function renderStandings(me) {
  standingsEl.innerHTML = "";
  players.forEach((player) => {
    const li = document.createElement("li");
    li.className = `standing ${player.type}`;
    if (player === me) li.classList.add("me");

    const name = document.createElement("span");
    name.className = "standing-name";
    name.textContent = player.name;

    const health = document.createElement("span");
    health.className = "standing-health";
    health.textContent = `♥ ${player.health}`;

    const bar = document.createElement("div");
    bar.className = "health-bar";
    const fill = document.createElement("div");
    fill.className = "health-fill";
    fill.style.width = `${(player.health / STARTING_HEALTH) * 100}%`;
    bar.appendChild(fill);

    li.append(name, health, bar);
    standingsEl.appendChild(li);
  });
}

// ---- The Tavern (shop) ----

const shopEl = document.getElementById("shop");
const goldEl = document.getElementById("gold-amount");

let gold = 0;
const shop = new Array(SHOP_SIZE).fill(null);

function renderGold() {
  goldEl.textContent = gold;
  renderBard();
}

function renderShop() {
  shopEl.innerHTML = "";
  const benchFull = !bench.includes(null);

  shop.forEach((type, i) => {
    const li = document.createElement("li");
    li.className = "shop-slot";

    if (!type) {
      li.classList.add("empty");
      shopEl.appendChild(li);
      return;
    }

    const card = document.createElement("button");
    card.className = "shop-card";
    card.style.setProperty("--rarity", RARITY_BORDERS[type.rarity]);
    card.disabled = gold < type.cost || benchFull;
    card.title = benchFull ? "Your bench is full" : gold < type.cost ? "Not enough gold" : `Buy ${type.name}`;

    const portrait = document.createElement("img");
    portrait.className = "shop-portrait";
    portrait.src = type.portrait;
    portrait.alt = type.name;

    const info = document.createElement("div");
    info.className = "shop-info";

    const name = document.createElement("div");
    name.className = "shop-name";
    name.textContent = type.name;

    const traits = document.createElement("ul");
    traits.className = "shop-traits";
    type.traits.forEach((traitId) => {
      const trait = TRAITS[traitId];
      const traitEl = document.createElement("li");
      const icon = document.createElement("img");
      icon.src = trait.icon;
      icon.alt = "";
      traitEl.append(icon, trait.name);
      traits.appendChild(traitEl);
    });

    info.append(name, traits);

    const cost = document.createElement("div");
    cost.className = "shop-cost";
    const coin = document.createElement("img");
    coin.src = "assets/icons/gold.svg";
    coin.alt = "Gold";
    cost.append(coin, type.cost);

    card.append(portrait, info, cost);
    card.addEventListener("click", () => buyUnit(i));
    li.appendChild(card);
    shopEl.appendChild(li);
  });
}

function buyUnit(shopIndex) {
  const type = shop[shopIndex];
  const benchIndex = bench.indexOf(null);
  if (!type || gold < type.cost || benchIndex === -1) return;

  gold -= type.cost;
  bench[benchIndex] = createUnit(type.id);
  shop[shopIndex] = null;

  renderGold();
  renderShop();
  renderUnits();
}

// ---- Renown & Fame ----

const renownLevelEl = document.getElementById("renown-level");
const fameFillEl = document.getElementById("fame-fill");
const fameTextEl = document.getElementById("fame-text");
const bardBtn = document.getElementById("bard-btn");

let renown = 1;
let fame = 0;

function gainFame(amount) {
  fame += amount;
  while (FAME_TO_NEXT_LEVEL[renown] && fame >= FAME_TO_NEXT_LEVEL[renown]) {
    fame -= FAME_TO_NEXT_LEVEL[renown];
    renown++;
  }
}

function renderRenown() {
  renownLevelEl.textContent = renown;
  const needed = FAME_TO_NEXT_LEVEL[renown];
  if (needed) {
    fameFillEl.style.width = `${(fame / needed) * 100}%`;
    fameTextEl.textContent = `${fame} / ${needed} Fame to reach level ${renown + 1}`;
  } else {
    fameFillEl.style.width = "0%";
    fameTextEl.textContent = `${fame} Fame`;
  }
}

function renderBard() {
  bardBtn.disabled = gold < BARD_SONG.cost;
  bardBtn.title = bardBtn.disabled ? "Not enough gold" : "";
}

bardBtn.addEventListener("click", () => {
  if (gold < BARD_SONG.cost) return;
  gold -= BARD_SONG.cost;
  gainFame(BARD_SONG.fame);
  renderGold();
  renderShop();
  renderRenown();
});

// The tilted grid's on-screen size differs from its layout size, so size the
// board area to match what is actually drawn.
function fitBoard() {
  const area = document.querySelector(".board-area");
  const stage = document.querySelector(".board-stage");
  stage.style.top = "0px";
  const stageRect = stage.getBoundingClientRect();
  const gridRect = teamGrid.getBoundingClientRect();
  stage.style.top = `${stageRect.top - gridRect.top}px`;
  area.style.height = `${gridRect.height}px`;
}

window.addEventListener("resize", () => {
  if (!playerScreen.classList.contains("hidden")) fitBoard();
});

function openPlayerScreen() {
  createPlayers();
  const me = players.find((p) => p.type === "human") || players[0];
  document.getElementById("player-name").textContent = me.name;
  renderStandings(me);

  grid.fill(null);
  bench.fill(null);
  grid[0] = createUnit("DL-001");
  shop.fill(UNIT_TYPES["DL-001"]);
  gold = STARTING_GOLD;
  renown = 1;
  fame = 0;

  buildCells(teamGrid, "grid", GRID_ROWS * GRID_COLS);
  buildCells(benchEl, "bench", BENCH_SIZE);
  renderUnits();
  renderGold();
  renderShop();
  renderRenown();
  showScreen(playerScreen);
  fitBoard();
}

document.getElementById("start-match-btn").addEventListener("click", openPlayerScreen);
