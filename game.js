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
