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
  if (type === "BlankTech") {
    const t = ROD_BLANK_TECHS.find(x => x.name === model);
    return t ? t.price : 0;
  }
  if (type === "GearTech") {
    const g = GEAR_SYSTEM_TECHS.find(x => x.name === model);
    return g ? g.price : 0;
  }

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

function calculateSuperchargePrice(climateName, rarity) {
  const bottleItem = ITEMS_DB.find(i => i.id === "lightning_in_a_bottle");
  const bottlePrice = bottleItem ? bottleItem.price : 90000;

  const shardId = climateName.toLowerCase().replace(/[^a-z0-9]/g, '_') + "_shard";
  const shardItem = ITEMS_DB.find(i => i.id === shardId);

  let shardPrice = 0;
  if (shardItem) {
    shardPrice = shardItem.price;
  } else {
    const climateObj = ARMOR_CLIMATES.find(c => c.name === climateName);
    shardPrice = climateObj ? climateObj.shardPrice : 7000;
  }

  const shardCount = SUPERCHARGE_SHARDS_CUMULATIVE[rarity] || 8;
  return bottlePrice + (shardCount * shardPrice);
}

function parseRodPartFromName(fullName) {
  let baseName = fullName;
  let techName = "None";

  const bracketMatch = fullName.match(/\[(.*?)\]/);
  if (bracketMatch) {
    techName = bracketMatch[1].trim();
    baseName = fullName.replace(/\[.*?\]/, "").trim();
  }

  let partType = "Pole";
  if (baseName.toLowerCase().endsWith("reel")) {
    partType = "Reel";
  } else if (baseName.toLowerCase().endsWith("line")) {
    partType = "Line";
  }

  return { partType, model: baseName, tech: techName };
}

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
  } else if (entry.customType === "supercharge") {
    return calculateSuperchargePrice(entry.climate, entry.rarity);
  }

  if (entry.category === "Rod Parts" && entry.name) {
    const blankMatch = ROD_BLANK_TECHS.find(t => t.name.toLowerCase() === entry.name.toLowerCase());
    if (blankMatch) return blankMatch.price;

    const gearMatch = GEAR_SYSTEM_TECHS.find(g => g.name.toLowerCase() === entry.name.toLowerCase());
    if (gearMatch) return gearMatch.price;

    const parsed = parseRodPartFromName(entry.name);
    return calculateRodPrice(parsed.partType, parsed.model, parsed.tech);
  }

  return entry.price || 0;
}

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
  if (category === "Pets" || category === "Armor" || category === "Rod Parts" || category === "Supercharges" || category === "Baits" || category === "Pet Items" || category === "Skins") {
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
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const sign = isNegative ? "-" : "";

  if (abs >= 1000000000) {
    const val = abs / 1000000000;
    return sign + "$" + (Number.isInteger(val) ? val : val.toFixed(2)) + "B";
  }
  if (abs >= 1000000) {
    const val = abs / 1000000;
    return sign + "$" + (Number.isInteger(val) ? val : val.toFixed(2)) + "M";
  }
  if (abs >= 1000) {
    const val = abs / 1000;
    return sign + "$" + (Number.isInteger(val) ? val : val.toFixed(1)) + "k";
  }
  return sign + "$" + abs.toLocaleString("en-US");
}

function getPetRatingColor(rating) {
  const r = Math.round(rating);
  if (r >= 100) return "#AF00AF";
  if (r === 20)  return "#74403B";
  if (r >= 90)  return "#FF55FF";
  if (r >= 80)  return "#55FFFF";
  if (r >= 70)  return "#00AA00";
  if (r >= 60)  return "#00AA00";
  if (r >= 50)  return "#55FF55";
  if (r >= 40)  return "#FFAA00";
  if (r >= 30)  return "#FFFF55";
  return "#FF5555";
}

function getArmorRatingColor(rating) {
  const r = Math.round(rating);
  if (r >= 100) return "#00FDC9";
  if (r === 1)   return "#D23434";
  if (r >= 90)  return "#2D9019";
  if (r >= 80)  return "#2D9019";
  if (r >= 70)  return "#57EC46";
  if (r >= 60)  return "#57EC46";
  if (r >= 50)  return "#ECE03C";
  if (r >= 40)  return "#ECE03C";
  if (r >= 30)  return "#EC8E3F";
  if (r >= 20)  return "#EC8E3F";
  if (r >= 10)  return "#AC1648";
  return "#D23434";
}

function getInfusionColor(infusionType) {
  if (!infusionType) return null;
  const inf = String(infusionType).toLowerCase();
  if (inf.includes("albino")) return "#E3C6E2";
  if (inf.includes("melanistic")) return "#5A5E62";
  if (inf.includes("trophy")) return "#D4C010";
  return null;
}

function formatItemNameWithColoredRating(entry) {
  let displayName = entry.name;
  if (!displayName) return "";

  let rating = entry.rating;
  if (rating === undefined) {
    const match = displayName.match(/\((\d+(?:\.\d+)?)\%\)/);
    if (match) {
      rating = parseFloat(match[1]);
    }
  }

  if (rating !== undefined) {
    let color = null;
    if (entry.customType === "pet" || entry.category === "Pets") {
      color = getPetRatingColor(rating);
    } else if (entry.customType === "armor" || entry.category === "Armor") {
      color = getArmorRatingColor(rating);
    }

    if (color) {
      displayName = displayName.replace(
        /\((\d+(?:\.\d+)?\%)\)/,
        `(<span style="color: ${color}; font-weight: bold;">$1</span>)`
      );
    }
  }

  const bracketMatch = displayName.match(/\[(.*?)\]/);
  if (bracketMatch) {
    const fullBracket = bracketMatch[0];
    const innerText = bracketMatch[1];

    let infusionKey = entry.infusion || innerText;
    const color = getInfusionColor(infusionKey);

    if (color) {
      displayName = displayName.replace(
        fullBracket,
        `[<span style="color: ${color}; font-weight: bold;">${innerText}</span>]`
      );
    }
  }

  return displayName;
}