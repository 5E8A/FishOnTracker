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

  const levelColorSelect = document.getElementById("shareLevelColor");
  if (levelColorSelect) {
    levelColorSelect.innerHTML = "";
    const savedColor = localStorage.getItem("fot_share_level_color") || "#E9E7EC";
    LEVEL_COLOR_OPTIONS.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.hex;
      option.textContent = opt.name;
      if (opt.hex.toLowerCase() === savedColor.toLowerCase()) option.selected = true;
      levelColorSelect.appendChild(option);
    });
  }

  const levelColorGroup = document.getElementById("levelColorGroup");
  if (levelColorGroup) {
    const lvl = parseInt(savedLevel || "0", 10) || 0;
    levelColorGroup.style.display = lvl >= 300 ? "flex" : "none";
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
    const analyticsModal = document.getElementById("analyticsModal");
    if (analyticsModal) analyticsModal.style.display = "none";
    const profileCardModal = document.getElementById("profileCardModal");
    if (profileCardModal) profileCardModal.style.display = "none";
  }
});

// Drag & Drop import on the existing Import button
(function initImportDragDrop() {
  const btn = document.getElementById("btnImportFile");
  if (!btn) return;

  btn.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.classList.add("drag-over");
  });

  btn.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.classList.remove("drag-over");
  });

  btn.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.classList.remove("drag-over");
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && (file.name.toLowerCase().endsWith(".json") || file.name.toLowerCase().endsWith(".txt"))) {
      if (typeof handleImportFile === "function") {
        handleImportFile(file);
      }
    }
  });
})();

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

const shareLevelEl = document.getElementById("shareLevel");
if (shareLevelEl) {
  shareLevelEl.addEventListener("input", () => {
    const group = document.getElementById("levelColorGroup");
    if (group) {
      const lvl = parseInt(shareLevelEl.value || "0", 10) || 0;
      group.style.display = lvl >= 300 ? "flex" : "none";
    }
  });
}

// Preload profile card category icons
if (typeof preloadCategoryIcons === "function") {
  preloadCategoryIcons();
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