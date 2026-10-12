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

function renderInventory() {
  localStorage.setItem("fishon_inventory", JSON.stringify(userInventory));

  const tbody = document.getElementById("inventoryList");
  const emptyState = document.getElementById("emptyState");
  const unknownAlert = document.getElementById("unknownItemsAlert");
  const unknownCountEl = document.getElementById("unknownCount");
  tbody.innerHTML = "";

  let totalWorth = 0;
  let unknownItemsCount = 0;
  const categoryTotals = {};

  const enriched = userInventory.map((entry, originalIndex) => {
    let name = entry.name;
    let category = entry.category;
    let isUnknown = false;

    if (!entry.isCustomItem) {
      const dbItem = ITEMS_DB.find(i => i.id === entry.id);
      if (dbItem) {
        name = dbItem.name;
        category = dbItem.category;
      } else {
        name = entry.name || entry.id;
        category = "Unknown";
        isUnknown = true;
      }
    }

    if (isUnknown) {
      unknownItemsCount++;
    }

    const price = resolveItemPrice(entry);
    const subtotal = price * entry.qty;
    totalWorth += subtotal;
    categoryTotals[category] = (categoryTotals[category] || 0) + subtotal;

    return { originalIndex, name, category, price, qty: entry.qty, subtotal, isUnknown, rating: entry.rating, customType: entry.customType, infusion: entry.infusion };
  });

  if (unknownAlert && unknownCountEl) {
    if (unknownItemsCount > 0) {
      unknownCountEl.textContent = unknownItemsCount;
      unknownAlert.style.display = "flex";
    } else {
      unknownAlert.style.display = "none";
    }
  }

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
    const warningBadge = entry.isUnknown
      ? `<span class="warning-icon" title="Item ID '${entry.name}' is missing in database!">⚠️</span>`
      : "";

    const formattedName = formatItemNameWithColoredRating(entry);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><b>${formattedName}</b>${warningBadge}</td>
      <td><span class="badge" style="margin-left: 0;">${entry.category}</span></td>
      <td>${formatMoney(entry.price)}</td>
      <td>
        <div class="qty-control-wrapper">
          <button class="qty-step-btn" title="Decrease (Shift+Click for -64)" onclick="stepItemQty(${entry.originalIndex}, -1, event)">-</button>
          <input type="text" class="qty-table-input" value="${entry.qty}" 
                 onchange="updateItemQty(${entry.originalIndex}, this.value)"
                 onkeydown="if(event.key==='Enter') this.blur()">
          <button class="qty-step-btn" title="Increase (Shift+Click for +64)" onclick="stepItemQty(${entry.originalIndex}, 1, event)">+</button>
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
  const allCategories = ["Pets", "Armor", "Rod Parts", "Supercharges", ...new Set(ITEMS_DB.map(i => i.category))].filter(cat => cat !== "Fish");

  allCategories.forEach(cat => {
    const amount = categoryTotals[cat] || 0;
    const pill = document.createElement("div");
    pill.className = "cat-pill";
    pill.innerHTML = `<span>${cat}:</span> <b>${formatMoney(amount)}</b>`;
    breakdownContainer.appendChild(pill);
  });
}

function exportInventory() {
  if (userInventory.length === 0) {
    alert("Your inventory is empty.");
    return;
  }

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

function getItemMatchingKey(item) {
  if (item.id && !item.isCustomItem && !item.id.startsWith("pet_") && !item.id.startsWith("armor_") && !item.id.startsWith("rod_") && !item.id.startsWith("supercharge_")) {
    return item.id;
  }
  return (item.name || item.id || "Unknown Item").trim();
}

function getItemDisplayName(item) {
  if (!item.isCustomItem && item.id) {
    const dbItem = ITEMS_DB.find(i => i.id === item.id);
    if (dbItem) return dbItem.name;
  }
  return item.name || item.id || "Unknown Item";
}

function processInventoryImport(newInventory) {
  if (!userInventory || userInventory.length === 0) {
    userInventory = newInventory;
    renderInventory();
    return;
  }

  pendingInventory = newInventory;

  let oldTotal = 0;
  const oldMap = new Map();

  userInventory.forEach(item => {
    const price = resolveItemPrice(item);
    const qty = item.qty || 1;
    const sub = price * qty;
    oldTotal += sub;

    const key = getItemMatchingKey(item);
    const displayName = getItemDisplayName(item);

    if (oldMap.has(key)) {
      const existing = oldMap.get(key);
      existing.qty += qty;
      existing.subtotal += sub;
    } else {
      oldMap.set(key, { ...item, name: displayName, price, qty, subtotal: sub });
    }
  });

  let newTotal = 0;
  const newMap = new Map();

  pendingInventory.forEach(item => {
    const price = resolveItemPrice(item);
    const qty = item.qty || 1;
    const sub = price * qty;
    newTotal += sub;

    const key = getItemMatchingKey(item);
    const displayName = getItemDisplayName(item);

    if (newMap.has(key)) {
      const existing = newMap.get(key);
      existing.qty += qty;
      existing.subtotal += sub;
    } else {
      newMap.set(key, { ...item, name: displayName, price, qty, subtotal: sub });
    }
  });

  const totalDiff = newTotal - oldTotal;
  const isPositive = totalDiff >= 0;
  const diffSign = isPositive ? "+" : "";
  const diffClass = isPositive ? "pos" : "neg";

  const changes = [];
  const allKeys = new Set([...oldMap.keys(), ...newMap.keys()]);

  allKeys.forEach(key => {
    const oldItem = oldMap.get(key);
    const newItem = newMap.get(key);

    const name = newItem ? newItem.name : oldItem.name;
    const sampleEntry = newItem || oldItem;

    const oldQty = oldItem ? oldItem.qty : 0;
    const newQty = newItem ? newItem.qty : 0;
    const qtyChange = newQty - oldQty;

    const oldSub = oldItem ? oldItem.subtotal : 0;
    const newSub = newItem ? newItem.subtotal : 0;
    const valChange = newSub - oldSub;

    if (qtyChange !== 0 || valChange !== 0) {
      const qtySign = qtyChange > 0 ? "+" : "";
      changes.push({
        name,
        sampleEntry,
        qtyChange,
        qtyText: `${qtySign}${qtyChange}`,
        valChange
      });
    }
  });

  changes.sort((a, b) => Math.abs(b.valChange) - Math.abs(a.valChange));

  const contentEl = document.getElementById("importDiffContent");
  if (contentEl) {
    let rowsHtml = "";
    if (changes.length === 0) {
      rowsHtml = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">No changes detected. Inventory is identical.</div>`;
    } else {
      rowsHtml = changes.map(ch => {
        const isUp = ch.valChange >= 0;
        const sign = isUp ? "+" : "";
        const valClass = isUp ? "pos" : "neg";
        const qtyClass = ch.qtyChange >= 0 ? "pos" : "neg";

        const formattedTitle = formatItemNameWithColoredRating(ch.sampleEntry);

        return `
          <div class="diff-item-row">
            <div class="diff-item-title">
              <span>${formattedTitle}</span>
              <span class="diff-qty-badge ${qtyClass}">(${ch.qtyText})</span>
            </div>
            <span class="diff-value ${valClass}">
              ${sign}${formatMoney(ch.valChange)}
            </span>
          </div>
        `;
      }).join("");
    }

    contentEl.innerHTML = `
      <div class="diff-summary-card">
        <div class="diff-summary-item">
          <span class="diff-summary-label">Current Value</span>
          <span class="diff-summary-value" style="color: var(--text-muted);">${formatMoney(oldTotal)}</span>
        </div>
        <div class="diff-arrow">➜</div>
        <div class="diff-summary-item">
          <span class="diff-summary-label">New Net Worth</span>
          <span class="diff-summary-value" style="color: var(--success);">${formatMoney(newTotal)}</span>
        </div>
        <div class="diff-summary-item">
          <span class="diff-summary-label">Net Difference</span>
          <span class="diff-summary-value ${diffClass}">${diffSign}${formatMoney(totalDiff)}</span>
        </div>
      </div>

      <div style="font-weight: 700; font-size: 0.8rem; margin-bottom: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
        Detailed Changes (${changes.length})
      </div>
      <div class="diff-list-section">
        ${rowsHtml}
      </div>
    `;
  }

  openImportDiffModal();
}

function importInventory(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        processInventoryImport(imported);
      } else {
        alert("Invalid inventory file format.");
      }
    } catch (err) {
      alert("Error parsing file.");
    }
  };
  reader.readAsText(file);
  if (event.target && event.target.value !== undefined) {
    event.target.value = "";
  }
}

async function quickPasteInventory() {
  const btn = document.getElementById('btn-quick-paste');
  const originalText = btn ? btn.innerHTML : "📋 Quick Paste";

  try {
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText || !clipboardText.trim()) {
      alert("Clipboard is empty! Run /fot scan stop in-game first.");
      return;
    }

    const imported = JSON.parse(clipboardText.trim());
    if (Array.isArray(imported)) {
      if (btn) {
        btn.innerHTML = "✔ Pasted!";
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 1500);
      }
      processInventoryImport(imported);
    } else {
      alert("Invalid clipboard format: expected a JSON array.");
    }
  } catch (err) {
    console.error("Quick paste error:", err);
    alert("Failed to paste: clipboard does not contain valid JSON.");
  }
}

function openImportDiffModal() {
  const modal = document.getElementById("importDiffModal");
  if (modal) modal.style.display = "flex";
}

function cancelImportDiffModal(event) {
  if (!event || event.target === document.getElementById("importDiffModal") || event.target.classList.contains('modal-close-btn') || event.target.classList.contains('btn-clear')) {
    pendingInventory = null;
    const modal = document.getElementById("importDiffModal");
    if (modal) modal.style.display = "none";
  }
}

function confirmImportDiffModal() {
  if (pendingInventory) {
    userInventory = pendingInventory;
    pendingInventory = null;
    renderInventory();
  }
  const modal = document.getElementById("importDiffModal");
  if (modal) modal.style.display = "none";
}