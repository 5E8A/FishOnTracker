function initTabs() {
  const categories = ["Pets", "Armor", "Rod Parts", "Supercharges", ...new Set(ITEMS_DB.map(i => i.category))]
    .filter(cat => cat !== "Fish");
  
  const tabsContainer = document.getElementById("categoryTabs");
  if (!tabsContainer) return;
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

  const superchargeSel = document.getElementById("superchargeClimate");
  if (superchargeSel) {
    superchargeSel.innerHTML = "";
    ARMOR_CLIMATES.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      superchargeSel.appendChild(opt);
    });
  }

  if (document.getElementById("rodTypeSelect")) {
    onRodTypeChange();
  }

  updatePetLivePreview();
  updateArmorLivePreview();
  updateSuperchargeLivePreview();
}

function switchView() {
  const petCard = document.getElementById("petCreatorCard");
  const armorCard = document.getElementById("armorCreatorCard");
  const rodCard = document.getElementById("rodCreatorCard");
  const superchargeCard = document.getElementById("superchargeCreatorCard");
  const searchWrapper = document.querySelector(".catalog-card-body .search-wrapper");
  const grid = document.getElementById("itemsGrid");

  const isCustomCreator = ["Pets", "Armor", "Rod Parts", "Supercharges"].includes(activeCategory);

  if (petCard) petCard.style.display = (activeCategory === "Pets") ? "flex" : "none";
  if (armorCard) armorCard.style.display = (activeCategory === "Armor") ? "flex" : "none";
  if (rodCard) rodCard.style.display = (activeCategory === "Rod Parts") ? "flex" : "none";
  if (superchargeCard) superchargeCard.style.display = (activeCategory === "Supercharges") ? "flex" : "none";

  if (isCustomCreator) {
    if (searchWrapper) searchWrapper.style.display = "none";
    if (grid) grid.style.display = "none";

    if (activeCategory === "Pets") updatePetLivePreview();
    if (activeCategory === "Armor") updateArmorLivePreview();
    if (activeCategory === "Rod Parts") updateRodLivePreview();
    if (activeCategory === "Supercharges") updateSuperchargeLivePreview();
  } else {
    if (searchWrapper) searchWrapper.style.display = "flex";
    if (grid) grid.style.display = "grid";
    renderGrid();
  }
}

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

  const speciesKey = species.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const rarityKey = rarity.toLowerCase();

  userInventory.push({
    id: `pet_${speciesKey}_${rarityKey}_${rating}_${specialStat}`,
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
  if (infusion === "blessed") infStr = " [Wizard's Blessed Infusion]";
  if (infusion === "sicly") infStr = " [Wizard's Sicly Infusion]";

  const climateKey = climate.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const pieceKey = piece.toLowerCase();
  const rarityKey = rarity.toLowerCase();
  const infusionKey = infusion.toLowerCase();

  userInventory.push({
    id: `armor_${climateKey}_${pieceKey}_${rarityKey}_${rating}_${infusionKey}`,
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

function onRodTypeChange() {
  const typeEl = document.getElementById("rodTypeSelect");
  if (!typeEl) return;
  const type = typeEl.value;
  const modelSel = document.getElementById("rodModelSelect");
  const techGroup = document.getElementById("rodTechGroup");
  const techLabel = document.getElementById("rodTechLabel");
  const techSel = document.getElementById("rodTechSelect");

  modelSel.innerHTML = "";

  if (type === "BlankTech") {
    ROD_BLANK_TECHS.filter(t => t.name !== "None").forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = `${item.name} (${formatMoney(item.price)})`;
      modelSel.appendChild(opt);
    });
    techGroup.style.display = "none";
  } else if (type === "GearTech") {
    GEAR_SYSTEM_TECHS.filter(g => g.name !== "None").forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.name;
      opt.textContent = `${item.name} (${formatMoney(item.price)})`;
      modelSel.appendChild(opt);
    });
    techGroup.style.display = "none";
  } else {
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
  }

  updateRodLivePreview();
}

function updateRodLivePreview() {
  const type = document.getElementById("rodTypeSelect").value;
  const model = document.getElementById("rodModelSelect").value;
  const tech = (type === "Pole" || type === "Reel") ? document.getElementById("rodTechSelect").value : "None";

  const price = calculateRodPrice(type, model, tech);
  document.getElementById("rodLivePrice").textContent = formatMoney(price);
}

function addCustomRodPart() {
  const type = document.getElementById("rodTypeSelect").value;
  const model = document.getElementById("rodModelSelect").value;
  const tech = (type === "Pole" || type === "Reel") ? document.getElementById("rodTechSelect").value : "None";

  let name = model;
  if ((type === "Pole" || type === "Reel") && tech && tech !== "None") {
    name += ` [${tech}]`;
  }

  const modelKey = model.toLowerCase().replace(/[\u0027'`’]/g, '_').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  const techKey = tech.toLowerCase().replace(/[\u0027'`’]/g, '_').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  const typeKey = type.toLowerCase();

  userInventory.push({
    id: `rod_${typeKey}_${modelKey}_${techKey}`,
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

function updateSuperchargeLivePreview() {
  const cEl = document.getElementById("superchargeClimate");
  const rEl = document.getElementById("superchargeRarity");
  if (!cEl || !rEl) return;

  const price = calculateSuperchargePrice(cEl.value, rEl.value);
  document.getElementById("superchargeLivePrice").textContent = formatMoney(price);
}

function addCustomSupercharge() {
  const climate = document.getElementById("superchargeClimate").value;
  const rarity = document.getElementById("superchargeRarity").value;

  const climateKey = climate.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const rarityKey = rarity.toLowerCase();

  userInventory.push({
    id: `supercharge_${climateKey}_${rarityKey}`,
    isCustomItem: true,
    customType: "supercharge",
    climate,
    rarity,
    name: `${rarity} ${climate} Supercharge`,
    category: "Supercharges",
    qty: 1
  });

  renderInventory();
}

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
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 30px;">No items found.</div>`;
    return;
  }

  filtered.forEach(item => {
    const isStackable = item.category === "Crafting Components" || item.category === "Consumables";
    const card = document.createElement("div");
    card.className = "item-card";
    
    const actionsClass = isStackable ? "item-actions has-stack" : "item-actions";

    card.innerHTML = `
      <div class="item-header">
        <span class="item-title" title="${item.name}">${item.name}</span>
        <span class="item-price">${formatMoney(item.price)}</span>
      </div>
      <div class="${actionsClass}">
        <div class="qty-field-wrapper">
          <input type="text" id="qty-${item.id}" value="1" placeholder="${isStackable ? '1s' : '1'}" class="qty-input">
        </div>
        <button class="btn-add-main" onclick="addItem('${item.id}')">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add
        </button>
        ${isStackable ? `<button class="btn-add-stack" onclick="addStack('${item.id}')" title="Add 64 items">+64</button>` : ''}
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