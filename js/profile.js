const LEVEL_TIER_COLORS = [
  "#8A897E", "#868A6E", "#BBCF53", "#BBCF53", "#E8D41E", "#E8A81E",
  "#7FD223", "#7FD223", "#23F133", "#23F133", "#1EE8B2", "#1EB6E8",
  "#1958E9", "#1958E9", "#411DE8", "#9B1EE8", "#9B1EE8", "#BE12D2",
  "#BE12D2", "#E81ED4", "#E81E61", "#AC1648", "#83232B", "#A00952",
  "#71316B", "#D03EC2", "#E675DB", "#DE9DD8", "#E4C1E1", "#E1C9DF"
];

function getLevelColors(level) {
  const lvl = parseInt(level, 10) || 0;
  if (lvl >= 300) return "#ffffff";
  const tier = Math.floor(lvl / 10);
  return LEVEL_TIER_COLORS[tier] || "#ffffff";
}

function loadPlayerAvatar(nick) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
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

  localStorage.setItem("fot_share_nick", nickInput);
  localStorage.setItem("fot_share_level", levelInput);
  localStorage.setItem("fot_share_crew", rawCrew);

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

async function generateSummaryImage() {
  const nickInput = document.getElementById("shareNick").value.trim();
  const levelInput = document.getElementById("shareLevel").value.trim();
  const rawCrew = document.getElementById("shareCrew").value.trim();

  localStorage.setItem("fot_share_nick", nickInput);
  localStorage.setItem("fot_share_level", levelInput);
  localStorage.setItem("fot_share_crew", rawCrew);

  updateMainProfileBanner();

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
  const height = 490;
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
  ctx.fillText("FishOnTracker • v1.1.1", width - 40, 48);
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
    "Pets", "Armor", "Rod Parts", "Supercharges",
    "Pet Items", "Crafting Components", "Consumables", "Baits", "Skins"
  ];

  const startX = 40;
  const startY = 274;
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

  ctx.textAlign = "right";
  ctx.fillStyle = "#86efac66";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText(`Generated: ${dateDisplay}`, width - 40, height - 20);
  ctx.textAlign = "left";

  const safeNick = nick.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  const link = document.createElement("a");
  link.download = `fot_${safeNick}_${dateFile}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  link.remove();

  closeShareModal();
}