const LEVEL_TIER_COLORS = [
  "#8A897E", "#868A6E", "#BBCF53", "#BBCF53", "#E8D41E", "#E8A81E",
  "#7FD223", "#7FD223", "#23F133", "#23F133", "#1EE8B2", "#1EB6E8",
  "#1958E9", "#1958E9", "#411DE8", "#9B1EE8", "#9B1EE8", "#BE12D2",
  "#BE12D2", "#E81ED4", "#E81E61", "#AC1648", "#83232B", "#A00952",
  "#71316B", "#D03EC2", "#E675DB", "#DE9DD8", "#E4C1E1", "#E1C9DF"
];

const LEVEL_COLOR_OPTIONS = [
  { name: "Saffron", hex: "#FFEDC1" },
  { name: "Navy", hex: "#B9BDE2" },
  { name: "Sky Blue", hex: "#CBECF4" },
  { name: "Crimson", hex: "#E2B5B5" },
  { name: "Forest Green", hex: "#A4CCAE" },
  { name: "Lime", hex: "#AEF9A8" },
  { name: "Bright Orange", hex: "#FED1AF" },
  { name: "Pink", hex: "#FCDCD6" },
  { name: "Violet", hex: "#D8BFF6" },
  { name: "Light Grey", hex: "#E9E7EC" },
  { name: "Black", hex: "#CBC7C2" },
];

function getLevelColors(level) {
  const lvl = parseInt(level, 10) || 0;
  if (lvl >= 300) {
    return localStorage.getItem("fot_share_level_color") || "#E9E7EC";
  }
  const tier = Math.floor(lvl / 10);
  return LEVEL_TIER_COLORS[tier] || "#ffffff";
}

function loadPlayerAvatar(nick) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    const finish = (val) => { if (!done) { done = true; resolve(val); } };
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    setTimeout(() => finish(null), 5000);
    img.src = `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/52`;
  });
}

function openProfileModal() {
  openShareModal();
}

function saveProfileOnly() {
  const nickInput = document.getElementById("shareNick")?.value.trim() || "";
  const levelInput = document.getElementById("shareLevel")?.value.trim() || "";
  const rawCrew = document.getElementById("shareCrew")?.value.trim() || "";
  const levelColorSelect = document.getElementById("shareLevelColor");
  const levelColor = levelColorSelect ? levelColorSelect.value : "";

  localStorage.setItem("fot_share_nick", nickInput);
  localStorage.setItem("fot_share_level", levelInput);
  localStorage.setItem("fot_share_crew", rawCrew);
  if (parseInt(levelInput || "0", 10) >= 300) {
    localStorage.setItem("fot_share_level_color", levelColor || "#E9E7EC");
  }

  updateMainProfileBanner();
  closeShareModal();
}

function updateMainProfileBanner() {
  const nick = localStorage.getItem("fot_share_nick") || "";
  const level = localStorage.getItem("fot_share_level") || "";
  const crew = localStorage.getItem("fot_share_crew") || "";

  const avatarEl = document.getElementById("mainPlayerAvatar");
  const nickEl = document.getElementById("mainPlayerNick");
  const levelBadge = document.getElementById("mainLevelBadge");
  const levelText = document.getElementById("mainLevelText");
  const crewEl = document.getElementById("mainPlayerCrew");

  if (!nickEl) return;

  if (nick.trim().length > 0) {
    nickEl.textContent = nick;
    if (avatarEl) {
      avatarEl.src = `https://mc-heads.net/avatar/${encodeURIComponent(nick)}/42`;
    }
  } else {
    nickEl.textContent = "Set Nickname";
    if (avatarEl) {
      avatarEl.src = "https://mc-heads.net/avatar/MHF_Steve/42";
    }
  }

  if (level.trim().length > 0) {
    const color = getLevelColors(level);
    if (levelBadge && levelText) {
      levelText.textContent = `LVL ${level}`;
      levelBadge.style.borderColor = color;
      levelText.style.color = color;
      levelBadge.style.display = "inline-flex";
    }
  } else {
    if (levelBadge) levelBadge.style.display = "none";
  }

  if (crewEl) {
    if (crew.trim().length > 0 && crew.toLowerCase() !== "no crew") {
      crewEl.textContent = `⚓ Crew: ${crew}`;
    } else {
      crewEl.textContent = nick ? "No Crew" : "Click to edit profile";
    }
  }
}

const CATEGORY_ICON_PATHS = {
  "Pets": "icons/pets.png",
  "Armor": "icons/armor.png",
  "Rod Parts": "icons/rodparts.png",
  "Pet Items": "icons/petitems.png",
  "Crafting Components": "icons/craftingcomponents.png",
  "Consumables": "icons/consumables.png",
  "Baits": "icons/baits.png",
  "Skins": "icons/skins.png"
};

const categoryIconImages = {};

function preloadCategoryIcons() {
  Object.keys(CATEGORY_ICON_PATHS).forEach(cat => {
    const img = new Image();
    img.onload = () => { categoryIconImages[cat] = img; };
    img.onerror = () => { /* fallback dot will be used */ };
    img.src = CATEGORY_ICON_PATHS[cat];
    categoryIconImages[cat] = img;
  });
}

function drawCategoryIcon(ctx, cat, cx, cy, size) {
  const s = size || 16;
  const img = categoryIconImages[cat];
  ctx.save();
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s);
  } else {
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

async function buildProfileCardCanvas() {
  const nickInputEl = document.getElementById("shareNick");
  const levelInputEl = document.getElementById("shareLevel");
  const crewInputEl = document.getElementById("shareCrew");

  const nickInput = (nickInputEl && nickInputEl.value.trim()) || localStorage.getItem("fot_share_nick") || "";
  const levelInput = (levelInputEl && levelInputEl.value.trim()) || localStorage.getItem("fot_share_level") || "";
  const rawCrew = (crewInputEl && crewInputEl.value.trim()) || localStorage.getItem("fot_share_crew") || "";

  const nick = nickInput || "Player";
  const level = levelInput || "1";
  const hasCrew = rawCrew.length > 0 && rawCrew.toLowerCase() !== "no crew";

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();

  const dateDisplay = `${mm}/${dd}/${yyyy}`;
  const dateFile = `${mm}-${dd}-${yyyy}`;

  let itemsWorth = 0;
  let totalItemsCount = 0;
  const categoryTotals = {};

  userInventory.forEach(entry => {
    let category = entry.category || "Other";
    if (!entry.isCustomItem) {
      const dbItem = ITEMS_DB.find(i => i.id === entry.id);
      if (dbItem) category = dbItem.category;
    }
    if (category === "Supercharges") category = "Consumables";

    const price = resolveItemPrice(entry);
    const sub = price * entry.qty;
    itemsWorth += sub;
    totalItemsCount += entry.qty;
    categoryTotals[category] = (categoryTotals[category] || 0) + sub;
  });

  const currentCash = typeof userCashBalance === 'number' ? userCashBalance : 0;
  const totalWorth = itemsWorth + currentCash;

  const avatarImg = await loadPlayerAvatar(nick);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = 850;
  const height = 420;
  canvas.width = width;
  canvas.height = height;

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#0c1710");
  bgGrad.addColorStop(1, "#060a08");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#22382b";
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  const avatarX = 40;
  const avatarY = 36;
  const avatarSize = 52;
  const textStartX = avatarImg ? avatarX + avatarSize + 16 : 40;

  if (avatarImg) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 10);
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    ctx.strokeStyle = "#22382b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 10);
    ctx.stroke();
  }

  const nickY = hasCrew ? 58 : 69;
  const pillY = hasCrew ? 37 : 48;

  ctx.fillStyle = "#f0fdf4";
  ctx.font = "bold 26px 'Segoe UI', sans-serif";
  ctx.fillText(nick, textStartX, nickY);

  const nickWidth = ctx.measureText(nick).width;

  const baseColor = getLevelColors(level);
  const pillBgColor = "#0c120a";
  const textShadowColor = "#000000";

  ctx.font = "bold 13px 'Segoe UI', sans-serif";
  const lvlText = "LVL " + level;
  const lvlTextWidth = ctx.measureText(lvlText).width;
  const pillPadding = 12;
  const pillW = lvlTextWidth + (pillPadding * 2);
  const pillX = textStartX + nickWidth + 14;

  ctx.fillStyle = pillBgColor;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, 26, 7);
  ctx.fill();

  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, 26, 7);
  ctx.stroke();

  const textY = pillY + 18;

  ctx.fillStyle = textShadowColor;
  ctx.fillText(lvlText, pillX + pillPadding + 1.5, textY + 1.5);

  ctx.fillStyle = baseColor;
  ctx.fillText(lvlText, pillX + pillPadding, textY);

  if (hasCrew) {
    ctx.fillStyle = "#86efac99";
    ctx.font = "14px 'Segoe UI', sans-serif";
    ctx.fillText("⚓ Crew: " + rawCrew, textStartX, 84);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#86efac66";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText("FishOnTracker • v1.1.4", width - 40, 48);
  ctx.textAlign = "left";

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 106);
  ctx.lineTo(width - 40, 106);
  ctx.stroke();

  ctx.fillStyle = "#86efac99";
  ctx.font = "bold 12px 'Segoe UI', sans-serif";
  ctx.fillText("TOTAL NET WORTH", 40, 136);

  ctx.fillStyle = "#4ade80";
  ctx.font = "900 46px 'Segoe UI', sans-serif";
  ctx.fillText(formatMoney(totalWorth), 40, 186);

  ctx.fillStyle = "#86efac99";
  ctx.font = "13px 'Segoe UI', sans-serif";
  const subDetailText = `Items: ${formatMoney(itemsWorth)}  •  Cash: ${formatMoney(currentCash)}`;
  ctx.fillText(subDetailText, 40, 212);

  ctx.fillStyle = "#f0fdf4";
  ctx.font = "bold 13px 'Segoe UI', sans-serif";
  ctx.fillText("CATEGORY BREAKDOWN", 40, 246);

  ctx.fillStyle = "#86efac99";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText(`Items tracked: ${totalItemsCount.toLocaleString()}`, 40, 262);

  const categories = [
    "Pets", "Armor", "Rod Parts",
    "Pet Items", "Crafting Components", "Consumables", "Baits", "Skins"
  ];

  const startX = 40;
  const startY = 274;
  const catPillW = 180;
  const catPillH = 42;
  const gapX = 15;
  const gapY = 10;

  categories.forEach((cat, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
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

    drawCategoryIcon(ctx, cat, x + 8 + 14, y + 21, 28);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillText(cat, x + 44, y + 18);

    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.fillText(formatMoney(val), x + 44, y + 34);
  });

  ctx.textAlign = "right";
  ctx.fillStyle = "#86efac66";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText(`Generated: ${dateDisplay}`, width - 40, height - 20);
  ctx.textAlign = "left";

  const safeNick = nick.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  canvas.dataset.safeNick = safeNick;
  canvas.dataset.dateFile = dateFile;
  return canvas;
}

async function generateSummaryImage() {
  const nickInput = document.getElementById("shareNick")?.value.trim() || "";
  const levelInput = document.getElementById("shareLevel")?.value.trim() || "";
  const rawCrew = document.getElementById("shareCrew")?.value.trim() || "";

  localStorage.setItem("fot_share_nick", nickInput);
  localStorage.setItem("fot_share_level", levelInput);
  localStorage.setItem("fot_share_crew", rawCrew);

  updateMainProfileBanner();

  const canvas = await buildProfileCardCanvas();
  triggerProfileCardDownload(canvas);
  closeShareModal();
}

function triggerProfileCardDownload(canvas) {
  if (!canvas) return;
  const safeNick = canvas.dataset.safeNick || "player";
  const dateFile = canvas.dataset.dateFile || "";
  const link = document.createElement("a");
  link.download = `fot_${safeNick}_${dateFile}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  link.remove();
}

let lastProfileCardCanvas = null;

async function openProfileCardModal() {
  const nickInputEl = document.getElementById("shareNick");
  const levelInputEl = document.getElementById("shareLevel");
  const crewInputEl = document.getElementById("shareCrew");

  const savedNick = localStorage.getItem("fot_share_nick") || "";
  const savedLevel = localStorage.getItem("fot_share_level") || "";
  const savedCrew = localStorage.getItem("fot_share_crew") || "";

  if (nickInputEl && !nickInputEl.value.trim()) nickInputEl.value = savedNick;
  if (levelInputEl && !levelInputEl.value.trim()) levelInputEl.value = savedLevel;
  if (crewInputEl && !crewInputEl.value.trim()) crewInputEl.value = savedCrew;

  const preview = document.getElementById("profileCardPreview");
  if (preview) preview.innerHTML = '<div style="color: var(--text-muted); padding: 24px;">Generating profile card...</div>';
  const modal = document.getElementById("profileCardModal");
  if (modal) {
    modal.classList.remove("modal-closing");
    modal.style.display = "flex";
  }

  try {
    const canvas = await buildProfileCardCanvas();
    if (!canvas) throw new Error("Failed to build canvas");
    lastProfileCardCanvas = canvas;
    if (preview) {
      preview.innerHTML = "";
      canvas.style.maxWidth = "100%";
      canvas.style.height = "auto";
      preview.appendChild(canvas);
    }
  } catch (err) {
    console.error("Profile card generation failed:", err);
    if (preview) preview.innerHTML = '<div style="color: #f87171; padding: 24px;">Failed to generate profile card.</div>';
  }
}

async function downloadProfileCard() {
  try {
    const canvas = lastProfileCardCanvas || await buildProfileCardCanvas();
    if (!canvas) throw new Error("No canvas");
    lastProfileCardCanvas = canvas;
    triggerProfileCardDownload(canvas);
  } catch (err) {
    console.error("Profile card download failed:", err);
    alert("Failed to download profile card.");
  }
}

function closeProfileCardModal(event) {
  if (!event || event.target === document.getElementById("profileCardModal") || event.target.classList.contains('modal-close-btn') || event.target.classList.contains('btn-clear')) {
    const modal = document.getElementById("profileCardModal");
    if (modal) modal.style.display = "none";
  }
}