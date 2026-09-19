let userInventory = JSON.parse(localStorage.getItem("fishon_inventory") || "[]");
let activeCategory = "Pets";
let searchQuery = "";
let inventorySearchQuery = "";
let sortField = "total";
let sortAsc = false;

// Modal Changelog Controls
function openChangelogModal() {
  document.getElementById("changelogModal").style.display = "flex";
}

function closeChangelogModal(event) {
  if (!event || event.target === document.getElementById("changelogModal") || event.target.classList.contains('modal-close-btn')) {
    document.getElementById("changelogModal").style.display = "none";
  }
}

// Modal Share Card Controls
function openShareModal() {
  document.getElementById("shareModal").style.display = "flex";
}

function closeShareModal(event) {
  if (!event || event.target === document.getElementById("shareModal") || event.target.classList.contains('modal-close-btn')) {
    document.getElementById("shareModal").style.display = "none";
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("changelogModal").style.display = "none";
    document.getElementById("shareModal").style.display = "none";
  }
});

// Pet rating pricing logic
function getCommonBaseRatingValue(rating) {
  const r = Math.round(rating);
  if (r === 20) return 50000;
  if (r < 60) return 2000;
  if (r <= 69) return 5000;
  if (r <= 73) return 10000;
  if (r <= 75) return 15000;
  if (r <= 79) return 50000;
  if (r === 80) return 90000;
  if (r === 81) return 100000;
  if (r === 82) return 150000;
  if (r >= 83 && r <= 85) return 250000;
  if (r >= 86 && r <= 88) return 300000;
  if (r === 89) return 320000;
  if (r === 90) return 500000;
  if (r === 91) return 550000;
  if (r === 92) return 600000;
  if (r === 93) return 650000;
  if (r === 94) return 700000;
  if (r === 95) return 750000;
  if (r === 96) return 800000;
  if (r === 97) return 900000;
  if (r === 98) return 950000;
  if (r === 99) return 1000000;
  if (r >= 100) return 5000000;
  return 2000;
}

function calculatePetPrice(rarity, rating, specialStat) {
  const mult = PET_RARITIES[rarity] || 1;
  const baseRatingVal = getCommonBaseRatingValue(rating);
  let bonus = 0;
  if (rating < 100) {
    if (specialStat === "luck") bonus = 50000;
    if (specialStat === "scale") bonus = 100000;
  }
  return (baseRatingVal + bonus) * mult;
}

// Armor rating pricing logic
function getArmorBaseValue(rating) {
  const r = Math.round(rating);
  if (r === 1) return 50000;
  if (r < 80) return 0;
  if (r <= 89) return 40000;
  if (r <= 97) return 100000;
  if (r <= 99) return 130000;
  if (r >= 100) return 150000;
  return 0;
}

// Dynamic Infusion Pricing (1 Infusion Capsule + 4 Shards)
function getInfusionPrice(infusionKey) {
  if (typeof INFUSION_RECIPES === "undefined") {
    const fallbackPrices = { albino: 710000, melanistic: 1070000, trophy: 3950000 };
    return fallbackPrices[infusionKey] || 0;
  }
  const recipe = INFUSION_RECIPES[infusionKey];
  if (!recipe || !recipe.capsuleId) return 0;

  const capsule = ITEMS_DB.find(i => i.id === recipe.capsuleId);
  const shard = ITEMS_DB.find(i => i.id === recipe.shardId);

  const capsulePrice = capsule ? capsule.price : 0;
  const shardPrice = shard ? shard.price : 0;

  return capsulePrice + (shardPrice * recipe.shardCount);
}

function calculateArmorPrice(climateName, rarity, rating, infusion) {
  const basePrice = getArmorBaseValue(rating);
  const climateObj = ARMOR_CLIMATES.find(c => c.name === climateName) || { shardPrice: 7000 };
  const shardCount = ARMOR_SHARDS_CUMULATIVE[rarity] || 0;
  const shardsValue = shardCount * climateObj.shardPrice;
  const infusionValue = getInfusionPrice(infusion);

  return basePrice + shardsValue + infusionValue;
}

// Rod Parts pricing logic
function calculateRodPrice(type, model, tech) {
  const baseItems = BASE_ROD_ITEMS[type] || [];
  const found = baseItems.find(i => i.name === model);
  const basePrice = found ? found.basePrice : 0;

  let techPrice = 0;
  if (type === "Pole") {
    const t = ROD_BLANK_TECHS.find(x => x.name === tech);
    if (t) techPrice = t.price;
  } else if (type === "Reel") {
    const g = GEAR_SYSTEM_TECHS.find(x => x.name === tech);
    if (g) techPrice = g.price;
  }

  return basePrice + techPrice;
}

// Master Dynamic Price Resolver
function resolveItemPrice(entry) {
  if (!entry.isCustomItem) {
    const dbItem = ITEMS_DB.find(i => i.id === entry.id);
    return dbItem ? dbItem.price : (entry.price || 0);
  }

  if (entry.customType === "pet") {
    return calculatePetPrice(entry.rarity, entry.rating, entry.specialStat);
  } else if (entry.customType === "armor") {
    return calculateArmorPrice(entry.climate, entry.rarity, entry.rating, entry.infusion);
  } else if (entry.customType === "rod") {
    return calculateRodPrice(entry.partType, entry.model, entry.tech);
  }

  return entry.price || 0;
}

// Quantity and Currency Parsers
function parseQuantity(input) {
  if (typeof input === 'number') return Math.max(1, Math.floor(input));
  const raw = String(input).trim().toLowerCase();

  if (raw.includes('s')) {
    const parts = raw.split('s');
    const stacks = parseFloat(parts[0]) || 0;
    const extraItems = parseInt(parts[1], 10) || 0;
    const total = Math.round(stacks * 64) + extraItems;
    return Math.max(1, total);
  }

  const parsed = parseInt(raw, 10);
  return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
}

function formatQuantity(qty, category) {
  if (category === "Pets" || category === "Armor" || category === "Rod Parts" || category === "Baits" || category === "Pet Items" || category === "Skins") {
    return `x${qty}`;
  }
  if (qty >= 64) {
    const stacks = Math.floor(qty / 64);
    const remainder = qty % 64;
    return remainder > 0 ? `${stacks}s + ${remainder} (x${qty})` : `${stacks}s (x${qty})`;
  }
  return `x${qty}`;
}

function formatMoney(amount) {
  if (amount >= 1000000) {
    const val = amount / 1000000;
    return "$" + (Number.isInteger(val) ? val : val.toFixed(2)) + "M";
  }
  if (amount >= 1000) {
    const val = amount / 1000;
    return "$" + (Number.isInteger(val) ? val : val.toFixed(1)) + "k";
  }
  return "$" + amount.toLocaleString("en-US");
}

// Tabs & Navigation
function initTabs() {
  const categories = ["Pets", "Armor", "Rod Parts", ...new Set(ITEMS_DB.map(i => i.category))];
  const tabsContainer = document.getElementById("categoryTabs");
  tabsContainer.innerHTML = "";

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `tab-btn ${cat === activeCategory ? 'active' : ''}`;
    btn.textContent = cat;
    btn.onclick = () => {
      activeCategory = cat;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchView();
    };
    tabsContainer.appendChild(btn);
  });
}

function initDropdowns() {
  const petSel = document.getElementById("petSpecies");
  if (petSel) {
    petSel.innerHTML = "";
    PET_SPECIES.forEach(sp => {
      const opt = document.createElement("option");
      opt.value = sp;
      opt.textContent = sp;
      petSel.appendChild(opt);
    });
  }

  const armorSel = document.getElementById("armorClimate");
  if (armorSel) {
    armorSel.innerHTML = "";
    ARMOR_CLIMATES.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      armorSel.appendChild(opt);
    });
  }

  if (document.getElementById("rodTypeSelect")) {
    onRodTypeChange();
  }

  updatePetLivePreview();
  updateArmorLivePreview();
}

function switchView() {
  const petCard = document.getElementById("petCreatorCard");
  const armorCard = document.getElementById("armorCreatorCard");
  const rodCard = document.getElementById("rodCreatorCard");
  const searchInput = document.getElementById("searchInput");
  const grid = document.getElementById("itemsGrid");

  if (petCard) petCard.style.display = (activeCategory === "Pets") ? "flex" : "none";
  if (armorCard) armorCard.style.display = (activeCategory === "Armor") ? "flex" : "none";
  if (rodCard) rodCard.style.display = (activeCategory === "Rod Parts") ? "flex" : "none";

  if (activeCategory === "Pets" || activeCategory === "Armor" || activeCategory === "Rod Parts") {
    if (searchInput) searchInput.style.display = "none";
    if (grid) grid.style.display = "none";
    if (activeCategory === "Pets") updatePetLivePreview();
    if (activeCategory === "Armor") updateArmorLivePreview();
    if (activeCategory === "Rod Parts") updateRodLivePreview();
  } else {
    if (searchInput) searchInput.style.display = "block";
    if (grid) grid.style.display = "grid";
    renderGrid();
  }
}

// Live Preview & Add Pet
function updatePetLivePreview() {
  const rEl = document.getElementById("petRarity");
  const ratEl = document.getElementById("petRating");
  if (!rEl || !ratEl) return;

  const rating = parseFloat(ratEl.value) || 0;
  const luckRadio = document.querySelector('input[name="petSpecialStat"][value="luck"]');
  const scaleRadio = document.querySelector('input[name="petSpecialStat"][value="scale"]');
  const noneRadio = document.querySelector('input[name="petSpecialStat"][value="none"]');

  if (rating >= 100) {
    if (luckRadio) luckRadio.disabled = true;
    if (scaleRadio) scaleRadio.disabled = true;
    if (noneRadio) noneRadio.checked = true;
  } else {
    if (luckRadio) luckRadio.disabled = false;
    if (scaleRadio) scaleRadio.disabled = false;
  }

  const sEl = document.querySelector('input[name="petSpecialStat"]:checked');
  const specialStat = (rating >= 100) ? "none" : (sEl ? sEl.value : "none");

  const price = calculatePetPrice(rEl.value, rating, specialStat);
  document.getElementById("petLivePrice").textContent = formatMoney(price);
}

function addCustomPet() {
  const species = document.getElementById("petSpecies").value;
  const rarity = document.getElementById("petRarity").value;
  const rating = parseFloat(document.getElementById("petRating").value) || 0;
  const sEl = document.querySelector('input[name="petSpecialStat"]:checked');
  const specialStat = (rating >= 100) ? "none" : (sEl ? sEl.value : "none");

  let tagStr = "";
  if (rating < 100) {
    if (specialStat === "luck") tagStr = " [100% Luck]";
    if (specialStat === "scale") tagStr = " [100% Scale]";
  }

  userInventory.push({
    id: `pet_${Date.now()}`,
    isCustomItem: true,
    customType: "pet",
    species,
    rarity,
    rating,
    specialStat,
    name: `${rarity} ${species} (${rating}%)${tagStr}`,
    category: "Pets",
    qty: 1
  });

  renderInventory();
}

// Live Preview & Add Armor
function updateArmorLivePreview() {
  const cEl = document.getElementById("armorClimate");
  const rEl = document.getElementById("armorRarity");
  const ratEl = document.getElementById("armorRating");
  const infEl = document.getElementById("armorInfusion");
  if (!cEl || !rEl || !ratEl || !infEl) return;

  const price = calculateArmorPrice(cEl.value, rEl.value, parseFloat(ratEl.value) || 0, infEl.value);
  document.getElementById("armorLivePrice").textContent = formatMoney(price);
}

function addCustomArmor() {
  const climate = document.getElementById("armorClimate").value;
  const piece = document.getElementById("armorPiece").value;
  const rarity = document.getElementById("armorRarity").value;
  const rating = parseFloat(document.getElementById("armorRating").value) || 0;
  const infusion = document.getElementById("armorInfusion").value;

  let infStr = "";
  if (infusion === "albino") infStr = " [Albino Infusion]";
  if (infusion === "melanistic") infStr = " [Melanistic Infusion]";
  if (infusion === "trophy") infStr = " [Trophy Infusion]";

  userInventory.push({
    id: `armor_${Date.now()}`,
    isCustomItem: true,
    customType: "armor",
    climate,
    piece,
    rarity,
    rating,
    infusion,
    name: `${rarity} ${climate} ${piece} (${rating}%)${infStr}`,
    category: "Armor",
    qty: 1
  });

  renderInventory();
}

// Rod Parts Form Logic
function onRodTypeChange() {
  const typeEl = document.getElementById("rodTypeSelect");
  if (!typeEl) return;
  const type = typeEl.value;
  const modelSel = document.getElementById("rodModelSelect");
  const techGroup = document.getElementById("rodTechGroup");
  const techLabel = document.getElementById("rodTechLabel");
  const techSel = document.getElementById("rodTechSelect");

  modelSel.innerHTML = "";
  (BASE_ROD_ITEMS[type] || []).forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.name;
    opt.textContent = `${item.name} (${formatMoney(item.basePrice)})`;
    modelSel.appendChild(opt);
  });

  if (type === "Pole") {
    techGroup.style.display = "flex";
    techLabel.textContent = "Rod Blank Tech";
    techSel.innerHTML = "";
    ROD_BLANK_TECHS.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.name;
      opt.dataset.price = t.price;
      opt.textContent = t.price > 0 ? `${t.name} (+${formatMoney(t.price)})` : t.name;
      techSel.appendChild(opt);
    });
  } else if (type === "Reel") {
    techGroup.style.display = "flex";
    techLabel.textContent = "Gear System Tech";
    techSel.innerHTML = "";
    GEAR_SYSTEM_TECHS.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.name;
      opt.dataset.price = t.price;
      opt.textContent = t.price > 0 ? `${t.name} (+${formatMoney(t.price)})` : t.name;
      techSel.appendChild(opt);
    });
  } else {
    techGroup.style.display = "none";
  }

  updateRodLivePreview();
}

function updateRodLivePreview() {
  const type = document.getElementById("rodTypeSelect").value;
  const model = document.getElementById("rodModelSelect").value;
  const tech = (type !== "Line") ? document.getElementById("rodTechSelect").value : "None";

  const price = calculateRodPrice(type, model, tech);
  document.getElementById("rodLivePrice").textContent = formatMoney(price);
}

function addCustomRodPart() {
  const type = document.getElementById("rodTypeSelect").value;
  const model = document.getElementById("rodModelSelect").value;
  const tech = (type !== "Line") ? document.getElementById("rodTechSelect").value : "None";

  let name = model;
  if (type !== "Line" && tech && tech !== "None") {
    name += ` [${tech}]`;
  }

  userInventory.push({
    id: `rod_${Date.now()}`,
    isCustomItem: true,
    customType: "rod",
    partType: type,
    model,
    tech,
    name,
    category: "Rod Parts",
    qty: 1
  });

  renderInventory();
}

// Catalog Grid
function renderGrid() {
  const grid = document.getElementById("itemsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const filtered = ITEMS_DB.filter(item => {
    const matchesCat = item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  filtered.sort((a, b) => a.name.localeCompare(b.name));

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 20px;">No items found.</div>`;
    return;
  }

  filtered.forEach(item => {
    const isStackable = item.category === "Crafting Components" || item.category === "Consumables";
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-info">
        <span class="title" title="${item.name}">${item.name}</span>
        <span class="price">${formatMoney(item.price)}</span>
      </div>
      <div class="item-actions">
        <input type="text" id="qty-${item.id}" value="1" placeholder="${isStackable ? '1s' : '1'}">
        <button onclick="addItem('${item.id}')">+ Add</button>
        ${isStackable ? `<button onclick="addStack('${item.id}')" title="Add 64 items">+64</button>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

function addItem(id) {
  const qtyInput = document.getElementById(`qty-${id}`);
  const qty = parseQuantity(qtyInput ? qtyInput.value : 1);

  const existingIndex = userInventory.findIndex(i => i.id === id);
  if (existingIndex > -1) {
    userInventory[existingIndex].qty += qty;
  } else {
    userInventory.push({ id, qty });
  }

  if (qtyInput) qtyInput.value = "1";
  renderInventory();
}

function addStack(id) {
  const existingIndex = userInventory.findIndex(i => i.id === id);
  if (existingIndex > -1) {
    userInventory[existingIndex].qty += 64;
  } else {
    userInventory.push({ id, qty: 64 });
  }
  renderInventory();
}

function removeItem(index) {
  userInventory.splice(index, 1);
  renderInventory();
}

function updateItemQty(index, newQtyStr) {
  const parsed = parseQuantity(newQtyStr);
  if (parsed <= 0) {
    removeItem(index);
  } else {
    userInventory[index].qty = parsed;
    renderInventory();
  }
}

function stepItemQty(index, delta, event) {
  const step = (event && event.shiftKey) ? 64 : 1;
  const current = userInventory[index].qty || 1;
  const next = current + (delta * step);

  if (next <= 0) {
    removeItem(index);
  } else {
    userInventory[index].qty = next;
    renderInventory();
  }
}

function clearInventory() {
  if (confirm("Are you sure you want to clear the entire inventory?")) {
    userInventory = [];
    renderInventory();
  }
}

function toggleSort(field) {
  if (sortField === field) {
    sortAsc = !sortAsc;
  } else {
    sortField = field;
    sortAsc = (field === 'name' || field === 'category');
  }
  renderInventory();
}

// Main Inventory Rendering
function renderInventory() {
  localStorage.setItem("fishon_inventory", JSON.stringify(userInventory));

  const tbody = document.getElementById("inventoryList");
  const emptyState = document.getElementById("emptyState");
  tbody.innerHTML = "";

  let totalWorth = 0;
  const categoryTotals = {};

  const enriched = userInventory.map((entry, originalIndex) => {
    let name = entry.name;
    let category = entry.category;

    if (!entry.isCustomItem) {
      const dbItem = ITEMS_DB.find(i => i.id === entry.id) || { name: entry.id, category: "Other" };
      name = dbItem.name;
      category = dbItem.category;
    }

    const price = resolveItemPrice(entry);
    const subtotal = price * entry.qty;
    totalWorth += subtotal;
    categoryTotals[category] = (categoryTotals[category] || 0) + subtotal;

    return { originalIndex, name, category, price, qty: entry.qty, subtotal };
  });

  const filteredInventory = enriched.filter(entry => {
    const query = inventorySearchQuery.toLowerCase();
    return entry.name.toLowerCase().includes(query) || entry.category.toLowerCase().includes(query);
  });

  if (userInventory.length === 0) {
    emptyState.textContent = "Inventory is empty. Select items above.";
    emptyState.style.display = "block";
  } else if (filteredInventory.length === 0) {
    emptyState.textContent = "No matching items found in your inventory.";
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }

  filteredInventory.sort((a, b) => {
    let valA, valB;
    if (sortField === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(a.name.toLowerCase());
    } else if (sortField === 'category') {
      valA = a.category.toLowerCase();
      valB = b.category.toLowerCase();
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(a.category.toLowerCase());
    } else if (sortField === 'price') {
      valA = a.price;
      valB = b.price;
    } else if (sortField === 'qty') {
      valA = a.qty;
      valB = b.qty;
    } else {
      valA = a.subtotal;
      valB = b.subtotal;
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  ['name', 'category', 'price', 'qty', 'total'].forEach(col => {
    const el = document.getElementById(`sort-icon-${col}`);
    if (!el) return;
    if (sortField === col) {
      el.textContent = sortAsc ? ' ▲' : ' ▼';
      el.style.color = 'var(--accent)';
    } else {
      el.textContent = '';
    }
  });

  filteredInventory.forEach(entry => {
    const isStackable = entry.category === "Crafting Components" || entry.category === "Consumables";
    let stackHint = "";
    if (isStackable && entry.qty >= 64) {
      const s = Math.floor(entry.qty / 64);
      const rem = entry.qty % 64;
      stackHint = `<span class="qty-stack-hint">${rem > 0 ? `(${s}s+${rem})` : `(${s}s)`}</span>`;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><b>${entry.name}</b></td>
      <td><span class="badge" style="margin-left: 0;">${entry.category}</span></td>
      <td>${formatMoney(entry.price)}</td>
      <td>
        <div class="qty-control-wrapper">
          <button class="qty-step-btn" title="Decrease (Shift+Click for -64)" onclick="stepItemQty(${entry.originalIndex}, -1, event)">-</button>
          <input type="text" class="qty-table-input" value="${entry.qty}" 
                 onchange="updateItemQty(${entry.originalIndex}, this.value)"
                 onkeydown="if(event.key==='Enter') this.blur()">
          <button class="qty-step-btn" title="Increase (Shift+Click for +64)" onclick="stepItemQty(${entry.originalIndex}, 1, event)">+</button>
          ${stackHint}
        </div>
      </td>
      <td style="color: var(--success); font-weight: 600;">${formatMoney(entry.subtotal)}</td>
      <td style="text-align: right;">
        <button class="btn-remove" title="Remove" onclick="removeItem(${entry.originalIndex})">&times;</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("totalNetWorth").textContent = formatMoney(totalWorth);

  const breakdownContainer = document.getElementById("categoryBreakdown");
  breakdownContainer.innerHTML = "";
  const allCategories = ["Pets", "Armor", "Rod Parts", ...new Set(ITEMS_DB.map(i => i.category))];

  allCategories.forEach(cat => {
    const amount = categoryTotals[cat] || 0;
    const pill = document.createElement("div");
    pill.className = "cat-pill";
    pill.innerHTML = `<span>${cat}:</span> <b>${formatMoney(amount)}</b>`;
    breakdownContainer.appendChild(pill);
  });
}

// Summary Image Generator (HTML5 Canvas - 490px Height)
function generateSummaryImage() {
  const nick = document.getElementById("shareNick").value.trim() || "Player";
  const level = document.getElementById("shareLevel").value.trim() || "1";
  const crew = document.getElementById("shareCrew").value.trim() || "No Crew";

  // Format MM/DD/Year
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();

  const dateDisplay = `${mm}/${dd}/${yyyy}`; // Na obrazie: MM/DD/Year (np. 09/20/2026)
  const dateFile = `${mm}-${dd}-${yyyy}`;    // W nazwie pliku: MM-DD-Year (np. 09-20-2026)

  let totalWorth = 0;
  let totalItemsCount = 0;
  const categoryTotals = {};

  userInventory.forEach(entry => {
    let category = entry.category || "Other";
    if (!entry.isCustomItem) {
      const dbItem = ITEMS_DB.find(i => i.id === entry.id);
      if (dbItem) category = dbItem.category;
    }

    const price = resolveItemPrice(entry);
    const sub = price * entry.qty;
    totalWorth += sub;
    totalItemsCount += entry.qty;
    categoryTotals[category] = (categoryTotals[category] || 0) + sub;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = 850;
  const height = 490;
  canvas.width = width;
  canvas.height = height;

  // 1. Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#0c1710");
  bgGrad.addColorStop(1, "#060a08");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Border
  ctx.strokeStyle = "#22382b";
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // 3. User Header
  ctx.fillStyle = "#f0fdf4";
  ctx.font = "bold 26px 'Segoe UI', sans-serif";
  ctx.fillText(nick, 40, 56);

  // Level Pill
  const nickWidth = ctx.measureText(nick).width;
  ctx.font = "bold 13px 'Segoe UI', sans-serif";
  const lvlText = "LVL " + level;
  const lvlTextWidth = ctx.measureText(lvlText).width;
  const pillPadding = 12;
  const pillW = lvlTextWidth + (pillPadding * 2);
  const pillX = 40 + nickWidth + 14;

  ctx.fillStyle = "#1a2820";
  ctx.beginPath();
  ctx.roundRect(pillX, 35, pillW, 26, 6);
  ctx.fill();

  ctx.fillStyle = "#4ade80";
  ctx.fillText(lvlText, pillX + pillPadding, 52);

  // Crew name
  ctx.fillStyle = "#86efac99";
  ctx.font = "14px 'Segoe UI', sans-serif";
  ctx.fillText("⚓ Crew: " + crew, 40, 84);

  // Version info in top-right corner
  ctx.textAlign = "right";
  ctx.fillStyle = "#86efac66";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText("FishOnTracker • v1.0.3", width - 40, 48);
  ctx.textAlign = "left";

  // Horizontal divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 102);
  ctx.lineTo(width - 40, 102);
  ctx.stroke();

  // 4. Total Net Worth
  ctx.fillStyle = "#86efac99";
  ctx.font = "bold 12px 'Segoe UI', sans-serif";
  ctx.fillText("TOTAL NET WORTH", 40, 134);

  ctx.fillStyle = "#4ade80";
  ctx.font = "900 46px 'Segoe UI', sans-serif";
  ctx.fillText(formatMoney(totalWorth), 40, 184);

  // 5. Total items count
  ctx.fillStyle = "#86efac99";
  ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText(`Total items tracked: x${totalItemsCount.toLocaleString()}`, 40, 210);

  // 6. Category breakdown grid
  ctx.fillStyle = "#f0fdf4";
  ctx.font = "bold 13px 'Segoe UI', sans-serif";
  ctx.fillText("CATEGORY BREAKDOWN", 40, 250);

  const categories = [
    "Pets",
    "Armor",
    "Rod Parts",
    "Pet Items",
    "Crafting Components",
    "Consumables",
    "Baits",
    "Skins"
  ];

  const startX = 40;
  const startY = 268;
  const catPillW = 240;
  const catPillH = 42;
  const gapX = 20;
  const gapY = 10;

  categories.forEach((cat, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = startX + col * (catPillW + gapX);
    const y = startY + row * (catPillH + gapY);
    const val = categoryTotals[cat] || 0;

    ctx.fillStyle = "rgba(26, 40, 32, 0.85)";
    ctx.beginPath();
    ctx.roundRect(x, y, catPillW, catPillH, 8);
    ctx.fill();

    ctx.strokeStyle = "#22382b";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillText(cat, x + 14, y + 18);

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.fillText(formatMoney(val), x + 14, y + 34);
  });

  // 7. Data w prawym dolnym rogu (MM/DD/Year)
  ctx.textAlign = "right";
  ctx.fillStyle = "#86efac66";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText(`Generated: ${dateDisplay}`, width - 40, height - 28);
  ctx.textAlign = "left";

  // 8. Pobranie pliku z nazwą fot_[nickname]_[MM-DD-YYYY].png
  const safeNick = nick.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  const link = document.createElement("a");
  link.download = `fot_${safeNick}_${dateFile}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  link.remove();

  closeShareModal();
}

// Import / Export
function exportInventory() {
  if (userInventory.length === 0) {
    alert("Your inventory is empty.");
    return;
  }

  // Format daty MM-DD-Year
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateFile = `${mm}-${dd}-${yyyy}`;

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userInventory, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `fot_eq_${dateFile}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importInventory(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        userInventory = imported;
        renderInventory();
        alert("Inventory imported successfully!");
      } else {
        alert("Invalid inventory file.");
      }
    } catch (err) {
      alert("Error parsing file.");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

// Event Listeners & Startup
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

// Modal Price Changes Controls
function openPriceChangesModal() {
  document.getElementById("priceChangesModal").style.display = "flex";
}

function closePriceChangesModal(event) {
  if (!event || event.target === document.getElementById("priceChangesModal") || event.target.classList.contains('modal-close-btn')) {
    document.getElementById("priceChangesModal").style.display = "none";
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("changelogModal").style.display = "none";
    document.getElementById("shareModal").style.display = "none";
    document.getElementById("priceChangesModal").style.display = "none";
  }
});

if (typeof renderPriceChanges === "function") {
  renderPriceChanges();
}

// App Initialization
initTabs();
initDropdowns();
switchView();
renderInventory();
if (typeof renderChangelog === "function") {
  renderChangelog();
}