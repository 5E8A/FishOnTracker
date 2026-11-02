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

function formatNumberWithSpaces(val) {
  if (val === null || val === undefined || val === "") return "";
  const parts = val.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
}

function onCashInputChange() {
  const inputEl = document.getElementById("userCashInput");
  if (!inputEl) return;

  const selectionStart = inputEl.selectionStart;
  const oldLength = inputEl.value.length;

  const rawValue = inputEl.value.replace(/[^0-9.]/g, '');
  userCashBalance = parseFloat(rawValue) || 0;

  localStorage.setItem("user_cash_balance", userCashBalance);

  if (rawValue === "") {
    inputEl.value = "";
  } else {
    inputEl.value = formatNumberWithSpaces(rawValue);
  }

  const newLength = inputEl.value.length;
  const cursorDiff = newLength - oldLength;
  const newCursorPos = Math.max(0, selectionStart + cursorDiff);
  inputEl.setSelectionRange(newCursorPos, newCursorPos);

  renderInventory();
}

function initCashInputUI() {
  const cashInput = document.getElementById("userCashInput");
  if (cashInput) {
    cashInput.value = userCashBalance > 0 ? formatNumberWithSpaces(userCashBalance) : "";
  }
}

function renderInventory() {
  localStorage.setItem("fishon_inventory", JSON.stringify(userInventory));

  const tbody = document.getElementById("inventoryList");
  const emptyState = document.getElementById("emptyState");
  const unknownAlert = document.getElementById("unknownItemsAlert");
  const unknownCountEl = document.getElementById("unknownCount");
  if (tbody) tbody.innerHTML = "";

  let itemsTotalWorth = 0;
  let unknownItemsCount = 0;
  const unknownList = [];
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
      unknownList.push({ name, qty: entry.qty });
    }

    const price = resolveItemPrice(entry);
    const subtotal = price * entry.qty;
    itemsTotalWorth += subtotal;
    const totalCategory = category === "Supercharges" ? "Consumables" : category;
    categoryTotals[totalCategory] = (categoryTotals[totalCategory] || 0) + subtotal;

    return { originalIndex, name, category, price, qty: entry.qty, subtotal, isUnknown, rating: entry.rating, customType: entry.customType, infusion: entry.infusion };
  });

  if (unknownAlert) {
    unknownAlert.style.display = "none";
  }

  const noticeEl = document.getElementById("unknownItemsNotice");
  if (noticeEl) {
    if (unknownList.length > 0) {
      const listStr = unknownList.map(u => `${u.name} x${u.qty}`).join(", ");
      noticeEl.innerHTML = `<span style="font-weight: 700; color: #f87171;">⚠️ Unrecognized items (${unknownList.length}):</span> <span style="margin-left: 6px;">${listStr}</span>`;
      noticeEl.style.display = "block";
    } else {
      noticeEl.style.display = "none";
      noticeEl.innerHTML = "";
    }
  }

  const filteredInventory = enriched.filter(entry => {
    const query = inventorySearchQuery.toLowerCase();
    return entry.name.toLowerCase().includes(query) || entry.category.toLowerCase().includes(query);
  });

  if (emptyState) {
    if (userInventory.length === 0) {
      emptyState.textContent = "Inventory is empty. Select items above.";
      emptyState.style.display = "block";
    } else if (filteredInventory.length === 0) {
      emptyState.textContent = "No matching items found in your inventory.";
      emptyState.style.display = "block";
    } else {
      emptyState.style.display = "none";
    }
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

  if (tbody) {
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
  }

  const totalNetWorth = itemsTotalWorth + userCashBalance;
  const netWorthEl = document.getElementById("totalNetWorth");
  if (netWorthEl) {
    netWorthEl.textContent = formatMoney(totalNetWorth);
  }

  const breakdownContainer = document.getElementById("categoryBreakdown");
  if (breakdownContainer) {
    breakdownContainer.innerHTML = "";
    const allCategories = ["Pets", "Armor", "Rod Parts", ...new Set(ITEMS_DB.map(i => i.category))].filter(cat => cat !== "Fish" && cat !== "Supercharges" && cat !== "Unknown" && cat !== "undefined");

    allCategories.forEach(cat => {
      const amount = categoryTotals[cat] || 0;
      const pill = document.createElement("div");
      pill.className = "cat-pill";
      pill.innerHTML = `<span>${cat}:</span> <b>${formatMoney(amount)}</b>`;
      breakdownContainer.appendChild(pill);
    });
  }
}

function exportInventory() {
  if (userInventory.length === 0 && userCashBalance === 0) {
    alert("Your inventory and cash balance are empty.");
    return;
  }

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateFile = `${mm}-${dd}-${yyyy}`;

  const savedNick = localStorage.getItem("fot_share_nick") || "";
  const savedLevel = localStorage.getItem("fot_share_level") || "";

  const exportData = {
    version: "1.1",
    username: savedNick,
    level: savedLevel ? parseInt(savedLevel, 10) : 0,
    cash: userCashBalance,
    inventory: userInventory
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
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

function processInventoryImport(importedData) {
  let newInventory = [];
  let newCash = userCashBalance;
  let newUsername = null;
  let newLevel = null;

  if (Array.isArray(importedData)) {
    newInventory = importedData;
  } else if (typeof importedData === 'object' && importedData !== null) {
    newInventory = Array.isArray(importedData.inventory) ? importedData.inventory : [];
    if (typeof importedData.cash === 'number') {
      newCash = importedData.cash;
    } else if (typeof importedData.balance === 'number') {
      newCash = importedData.balance;
    }
    if (importedData.username) {
      newUsername = importedData.username;
    }
    if (importedData.level !== undefined && importedData.level !== null) {
      newLevel = Number(importedData.level);
    }
  }

  const currentUsername = localStorage.getItem("fot_share_nick") || "";
  const currentLevelStr = localStorage.getItem("fot_share_level") || "";
  const currentLevel = currentLevelStr !== "" ? Number(currentLevelStr) : null;

  if (!userInventory || (userInventory.length === 0 && userCashBalance === 0 && !currentUsername)) {
    userInventory = newInventory;
    userCashBalance = newCash;
    localStorage.setItem("user_cash_balance", userCashBalance);

    if (newUsername) {
      localStorage.setItem("fot_share_nick", newUsername);
    }
    if (newLevel !== null) {
      localStorage.setItem("fot_share_level", String(newLevel));
    }

    if (typeof updateMainProfileBanner === "function") {
      updateMainProfileBanner();
    }
    initCashInputUI();
    renderInventory();
    return;
  }

  pendingInventory = {
    inventory: newInventory,
    cash: newCash,
    username: newUsername,
    level: newLevel
  };

  let oldTotal = userCashBalance;
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

  let newTotal = newCash;
  const newMap = new Map();
  const unknownItemsFound = [];

  newInventory.forEach(item => {
    const price = resolveItemPrice(item);
    const qty = item.qty || 1;
    const sub = price * qty;
    newTotal += sub;

    const key = getItemMatchingKey(item);
    const displayName = getItemDisplayName(item);

    if (!item.isCustomItem) {
      const dbItem = ITEMS_DB.find(i => i.id === item.id);
      if (!dbItem) {
        unknownItemsFound.push({
          id: item.id || "unknown",
          name: item.name || item.id || "Unknown Item",
          qty: qty
        });
      }
    }

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

  if (newCash !== userCashBalance) {
    const cashDiff = newCash - userCashBalance;
    changes.push({
      name: "Cash Balance",
      sampleEntry: { name: "Cash Balance" },
      qtyChange: 0,
      qtyText: "",
      valChange: cashDiff
    });
  }

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
    let profileChangesHtml = "";
    const isLegacyFormat = Array.isArray(importedData) || (!importedData.username && importedData.level === undefined);
    const hasNickChange = newUsername && newUsername !== currentUsername;
    const hasLevelChange = newLevel !== null && newLevel !== currentLevel;

if (isLegacyFormat) {
      profileChangesHtml = `
        <div class="diff-summary-card" style="margin-bottom: 6px; display: block; padding: 12px 18px;">
          <div style="font-weight: 700; font-size: 0.8rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Legacy File Format (v1.0)
          </div>
          <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">
            This file does not contain profile metadata. Only inventory items will be updated.
          </div>
        </div>
      `;
    } else if (hasNickChange || hasLevelChange) {
      profileChangesHtml = `
        <div class="diff-summary-card" style="margin-bottom: 6px; display: block; padding: 12px 18px;">
          <div style="font-weight: 700; font-size: 0.8rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Profile Info Updates
          </div>
          <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.85rem; align-items: center; justify-content: center;">
            ${hasNickChange ? `
              <div>
                <span style="color: var(--text-muted);">Nickname:</span>
                <b>${currentUsername || "None"}</b> <span style="color: var(--accent); margin: 0 4px;">➔</span> <b style="color: var(--success);">${newUsername}</b>
              </div>
            ` : ''}
            ${hasLevelChange ? `
              <div>
                <span style="color: var(--text-muted);">Level:</span>
                <b>${currentLevel !== null ? currentLevel : 'None'}</b> <span style="color: var(--accent); margin: 0 4px;">➔</span> <b style="color: var(--success);">${newLevel}</b>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    let unknownAlertHtml = "";
    if (unknownItemsFound.length > 0) {
      const unknownListStr = unknownItemsFound.map(u => {
        const hasCustomName = u.name && u.name !== u.id;
        const displayName = hasCustomName ? `<b>${u.name}</b> (${u.id})` : `<b>${u.id}</b>`;
        return `${displayName} x${u.qty}`;
      }).join(", ");

      unknownAlertHtml = `
        <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 10px; margin-bottom: 6px; font-size: 0.85rem;">
          <div style="font-weight: 700; color: #f87171; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            ⚠️ Unrecognized Items (${unknownItemsFound.length})
          </div>
          <div style="color: #fca5a5; line-height: 1.4;">
            The following items were not found in database and are valued at $0:
            <div style="margin-top: 4px; font-size: 0.8rem; color: #fee2e2;">${unknownListStr}</div>
          </div>
        </div>
      `;
    }

    let rowsHtml = "";
    if (changes.length === 0) {
      rowsHtml = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">No changes detected. Inventory is identical.</div>`;
    } else {
      rowsHtml = changes.map(ch => {
        const isUp = ch.valChange >= 0;
        const sign = isUp ? "+" : "";
        const valClass = isUp ? "pos" : "neg";
        const qtyClass = ch.qtyChange >= 0 ? "pos" : "neg";

        const formattedTitle = ch.name === "Cash Balance" ? "<b>Cash Balance</b>" : formatItemNameWithColoredRating(ch.sampleEntry);

        return `
          <div class="diff-item-row">
            <div class="diff-item-title">
              <span>${formattedTitle}</span>
              ${ch.qtyText ? `<span class="diff-qty-badge ${qtyClass}">(${ch.qtyText})</span>` : ''}
            </div>
            <span class="diff-value ${valClass}">
              ${sign}${formatMoney(ch.valChange)}
            </span>
          </div>
        `;
      }).join("");
    }

      contentEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 6px;">${profileChangesHtml}</div>
      ${unknownAlertHtml}

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

function handleImportFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      processInventoryImport(imported);
    } catch (err) {
      alert("Error parsing file.");
    }
  };
  reader.readAsText(file);
}

function importInventory(event) {
  const file = event?.target?.files?.[0];
  handleImportFile(file);
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
    if (btn) {
      btn.innerHTML = "✔ Pasted!";
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 1500);
    }
    processInventoryImport(imported);
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
    if (typeof pendingInventory === 'object' && pendingInventory.inventory) {
      userInventory = pendingInventory.inventory;
      if (typeof pendingInventory.cash === 'number') {
        userCashBalance = pendingInventory.cash;
        localStorage.setItem("user_cash_balance", userCashBalance);
        initCashInputUI();
      }
      if (pendingInventory.username) {
        localStorage.setItem("fot_share_nick", pendingInventory.username);
      }
      if (pendingInventory.level !== undefined && pendingInventory.level !== null) {
        localStorage.setItem("fot_share_level", String(pendingInventory.level));
      }
      if (typeof updateMainProfileBanner === "function") {
        updateMainProfileBanner();
      }
    } else if (Array.isArray(pendingInventory)) {
      userInventory = pendingInventory;
    }
    pendingInventory = null;
    renderInventory();
  }
  const modal = document.getElementById("importDiffModal");
  if (modal) modal.style.display = "none";
}

// --- Analytics / Detailed Breakdown ---
function openAnalyticsModal() {
  const modal = document.getElementById("analyticsModal");
  if (modal) {
    try {
      renderAnalytics();
    } catch (err) {
      console.error("renderAnalytics error:", err);
      const contentEl = document.getElementById("analyticsContent");
      if (contentEl) contentEl.innerHTML = `<div style="color:#f87171;padding:12px;">Error: ${String(err && err.message ? err.message : err)}</div>`;
    }
    modal.style.display = "flex";
  }
}

function closeAnalyticsModal(event) {
  if (!event || event.target === document.getElementById("analyticsModal") || event.target.classList.contains('modal-close-btn')) {
    const modal = document.getElementById("analyticsModal");
    if (modal) modal.style.display = "none";
  }
}

function renderAnalytics() {
  const contentEl = document.getElementById("analyticsContent");
  if (!contentEl) return;

  let itemsTotalWorth = 0;
  let totalQty = 0;
  const categoryTotals = {};
  const categoryBest = {}; // category -> entry with max subtotal
  const uniqueCount = userInventory.length;

  userInventory.forEach(entry => {
    let name = entry.name;
    let category = entry.category;
    if (!entry.isCustomItem) {
      const dbItem = ITEMS_DB.find(i => i.id === entry.id);
      if (dbItem) {
        name = dbItem.name;
        category = dbItem.category;
      }
    }
    if (category === "Supercharges") category = "Consumables";
    const price = resolveItemPrice(entry);
    const subtotal = price * entry.qty;
    itemsTotalWorth += subtotal;
    totalQty += entry.qty;
    categoryTotals[category] = (categoryTotals[category] || 0) + subtotal;

    if (!categoryBest[category] || subtotal > categoryBest[category].subtotal) {
      categoryBest[category] = { name, category, qty: entry.qty, price, subtotal };
    }
  });

  const totalWithCash = itemsTotalWorth + userCashBalance;

  // Percentage breakdown
  const sortedCats = Object.keys(categoryTotals).filter(cat => cat !== "Fish" && cat !== "Unknown" && cat !== "undefined").sort((a, b) => categoryTotals[b] - categoryTotals[a]);
  const shownTotal = sortedCats.reduce((s, c) => s + (categoryTotals[c] || 0), 0);
  let pctHtml = sortedCats.map(cat => {
    const amt = categoryTotals[cat];
    const pct = shownTotal > 0 ? (amt / shownTotal * 100) : 0;
    return `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
          <span style="color: var(--text-main); font-weight: 600;">${cat}</span>
          <span style="color: var(--text-muted);">${formatMoney(amt)} <span style="color: var(--accent);">(${pct.toFixed(1)}%)</span></span>
        </div>
        <div style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; width: ${pct.toFixed(1)}%; background: var(--accent); border-radius: 3px; transition: width 0.3s;"></div>
        </div>
      </div>
    `;
  }).join("");

  if (sortedCats.length === 0) {
    pctHtml = `<div style="text-align: center; color: var(--text-muted); padding: 12px;">No items in inventory.</div>`;
  }

  // Most valuable item per category (exclude Fish)
  const bestCats = Object.keys(categoryBest)
    .filter(cat => cat !== "Fish" && cat !== "Unknown" && cat !== "undefined")
    .sort((a, b) => categoryBest[b].subtotal - categoryBest[a].subtotal);
  let bestHtml = bestCats.map(cat => {
    const b = categoryBest[cat];
    if (!b) return "";
    let coloredName;
    try {
      coloredName = formatItemNameWithColoredRating(b);
    } catch (e) {
      coloredName = (b.name || cat).replace(/</g, "&lt;");
    }
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; font-size: 0.85rem;">
        <span style="color: var(--text-main); font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><span style="color: var(--accent); font-size: 0.72rem; font-weight: 700; margin-right: 6px;">${cat}</span>${coloredName}${b.qty > 1 ? ` <span style="color: var(--text-muted); font-weight: 400;">(x${b.qty})</span>` : ''}</span>
        ${b.qty > 1 ? `<span style="color: var(--text-muted); font-size: 0.78rem; margin: 0 10px;">${formatMoney(b.price)} / each</span>` : ''}
        <span style="color: var(--success); font-weight: 700;">${formatMoney(b.subtotal)}</span>
      </div>
    `;
  }).join("");

  if (bestCats.length === 0 || !bestHtml.trim()) {
    bestHtml = `<div style="text-align: center; color: var(--text-muted); padding: 12px;">No items in inventory.</div>`;
  }

  contentEl.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px;">
      <div class="diff-summary-item" style="background: rgba(15,23,18,0.6); border: 1px solid var(--border); border-radius: 10px; padding: 10px 8px; text-align: center;">
        <span class="diff-summary-label">Unique Items</span>
        <span class="diff-summary-value" style="font-size: 1.05rem;">${uniqueCount}</span>
      </div>
      <div class="diff-summary-item" style="background: rgba(15,23,18,0.6); border: 1px solid var(--border); border-radius: 10px; padding: 10px 8px; text-align: center;">
        <span class="diff-summary-label">Total Qty</span>
        <span class="diff-summary-value" style="font-size: 1.05rem;">${totalQty.toLocaleString()}</span>
      </div>
      <div class="diff-summary-item" style="background: rgba(15,23,18,0.6); border: 1px solid var(--border); border-radius: 10px; padding: 10px 8px; text-align: center;">
        <span class="diff-summary-label">Items Value</span>
        <span class="diff-summary-value" style="font-size: 1.05rem; color: var(--text-muted);">${formatMoney(itemsTotalWorth)}</span>
      </div>
      <div class="diff-summary-item" style="background: rgba(15,23,18,0.6); border: 1px solid var(--border); border-radius: 10px; padding: 10px 8px; text-align: center;">
        <span class="diff-summary-label">Cash</span>
        <span class="diff-summary-value" style="font-size: 1.05rem; color: var(--text-muted);">${formatMoney(userCashBalance)}</span>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, rgba(74,222,128,0.12), rgba(15,23,18,0.6)); border: 1px solid var(--accent); border-radius: 10px; padding: 10px 16px; text-align: center; margin-bottom: 10px;">
      <span class="diff-summary-label" style="color: var(--accent);">Net Worth</span>
      <div class="diff-summary-value" style="color: var(--success); font-size: 1.5rem;">${formatMoney(totalWithCash)}</div>
    </div>

    <div style="font-weight: 700; font-size: 0.8rem; margin-bottom: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
      Percentage Breakdown
    </div>
    <div style="margin-bottom: 10px;">
      ${pctHtml}
    </div>

    <div style="font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
      Most Valuable Item per Category
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px;">
      ${bestHtml}
    </div>
  `;
}

function exportInventoryCSV() {
  if (userInventory.length === 0 && userCashBalance === 0) {
    alert("Inventory and cash balance are empty.");
    return;
  }

  const rows = [];
  rows.push(['Name', 'Category', 'Qty', 'Unit Price', 'Subtotal'].join(','));

  userInventory.forEach(entry => {
    let name = entry.name;
    let category = entry.category;
    if (!entry.isCustomItem) {
      const dbItem = ITEMS_DB.find(i => i.id === entry.id);
      if (dbItem) {
        name = dbItem.name;
        category = dbItem.category;
      }
    }
    const price = resolveItemPrice(entry);
    const subtotal = price * entry.qty;
    const safeName = `"${String(name || '').replace(/"/g, '""')}"`;
    const safeCat = `"${String(category || '').replace(/"/g, '""')}"`;
    rows.push([safeName, safeCat, entry.qty, price, subtotal].join(','));
  });

  const itemsTotal = userInventory.reduce((s, e) => s + resolveItemPrice(e) * e.qty, 0);
  rows.push(['"TOTAL (items)"', '""', '', '', itemsTotal].join(','));
  rows.push(['"Cash Balance"', '""', '', '', userCashBalance].join(','));
  rows.push(['"NET WORTH"', '""', '', '', itemsTotal + userCashBalance].join(','));

  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  link.download = `fot_inventory_${mm}-${dd}-${yyyy}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}