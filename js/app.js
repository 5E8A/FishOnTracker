// Global State
let userInventory = JSON.parse(localStorage.getItem("fishon_inventory") || "[]");
let userCashBalance = parseFloat(localStorage.getItem("user_cash_balance")) || 0;
let activeCategory = "Pets";
let searchQuery = "";
let inventorySearchQuery = "";
let sortField = "total";
let sortAsc = false;
let pendingInventory = null;

// Modal Navigation Controls
function openChangelogModal() {
  document.getElementById("changelogModal").style.display = "flex";
}

function closeChangelogModal(event) {
  if (!event || event.target === document.getElementById("changelogModal") || event.target.classList.contains('modal-close-btn')) {
    document.getElementById("changelogModal").style.display = "none";
  }
}

function openShareModal() {
  const savedNick = localStorage.getItem("fot_share_nick");
  const savedLevel = localStorage.getItem("fot_share_level");
  const savedCrew = localStorage.getItem("fot_share_crew");

  if (savedNick !== null) {
    document.getElementById("shareNick").value = savedNick;
  }
  if (savedLevel !== null) {
    document.getElementById("shareLevel").value = savedLevel;
  }
  if (savedCrew !== null) {
    document.getElementById("shareCrew").value = savedCrew;
  }

  document.getElementById("shareModal").style.display = "flex";
}

function closeShareModal(event) {
  if (!event || event.target === document.getElementById("shareModal") || event.target.classList.contains('modal-close-btn')) {
    document.getElementById("shareModal").style.display = "none";
  }
}

function openPriceChangesModal() {
  document.getElementById("priceChangesModal").style.display = "flex";
}

function closePriceChangesModal(event) {
  if (!event || event.target === document.getElementById("priceChangesModal") || event.target.classList.contains('modal-close-btn')) {
    document.getElementById("priceChangesModal").style.display = "none";
  }
}

// Global Keyboard Shortcuts
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("changelogModal").style.display = "none";
    document.getElementById("shareModal").style.display = "none";
    const priceModal = document.getElementById("priceChangesModal");
    if (priceModal) priceModal.style.display = "none";
    const diffModal = document.getElementById("importDiffModal");
    if (diffModal) {
      pendingInventory = null;
      diffModal.style.display = "none";
    }
  }
});

// Event Listeners for Inputs
const searchEl = document.getElementById("searchInput");
if (searchEl) {
  searchEl.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderGrid();
  });
}

const invSearchEl = document.getElementById("invSearchInput");
if (invSearchEl) {
  invSearchEl.addEventListener("input", (e) => {
    inventorySearchQuery = e.target.value;
    renderInventory();
  });
}

// App Initialization
initTabs();
initDropdowns();
switchView();

if (typeof initCashInputUI === "function") {
  initCashInputUI();
}

renderInventory();
updateMainProfileBanner();

if (typeof renderChangelog === "function") {
  renderChangelog();
}

if (typeof renderPriceChanges === "function") {
  renderPriceChanges();
}