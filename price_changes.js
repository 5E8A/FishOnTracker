// price_changes.js
const PRICE_CHANGES_DATA = [
            {
    date: "2026-10-03",
    tag: "Price Update",
    changes: [
        { name: "Spinnerbait (White Shad)", oldPrice: 2000, newPrice: 1500 },
        { name: "Arid Shard", oldPrice: 5500, newPrice: 5000 },
    ]
    },
          {
    date: "2026-09-27",
    tag: "Price Update",
    changes: [
        { name: "Subtropical Shard", oldPrice: 3000, newPrice: 5000 },
        { name: "Glide Bait (Rainbow Trout)", oldPrice: 4000, newPrice: 7000 },
        { name: "Ballyhoo Live Bait", oldPrice: 4000, newPrice: 3500 },
        { name: "Rusty Crawfish", oldPrice: 1500, newPrice: 1000 },
        { name: "Florida Crawfish", oldPrice: 1500, newPrice: 1000 },
        { name: "French Fry", oldPrice: 350, newPrice: 250 },
        { name: "Sweet Corn", oldPrice: 400, newPrice: 350 },
        { name: "Glide Bait (Crystal)", oldPrice: 15000, newPrice: 11000 },
        { name: "Glide Bait (Bluegill)", oldPrice: 15000, newPrice: 11000 },
        { name: "Small Chunk Of Bonito Cutbait", oldPrice: 400, newPrice: 300 },
    ]
    },
    {
    date: "2026-09-25",
    tag: "Price Update",
    changes: [
        { name: "Marlin Lure (Blue)", oldPrice: 4000, newPrice: 8000 },
        { name: "Marlin Lure (Mini Mahi)", oldPrice: 4000, newPrice: 8000 },
        { name: "Marlin Lure (Purple)", oldPrice: 4000, newPrice: 8000 },
        { name: "Cut Roach", oldPrice: 1500, newPrice: 3500 },
        { name: "Popper (Volcano)", oldPrice: 4000, newPrice: 5000 },
        { name: "Popper (Ghost)", oldPrice: 4000, newPrice: 6000 },
        { name: "Menhaden Live Bait", oldPrice: 400, newPrice: 550 },
        { name: "Spinnerbait (Lime)", oldPrice: 4000, newPrice: 2500 },
        { name: "Frog (Rainforest Yellow)", oldPrice: 2500, newPrice: 2000 },
        { name: "Mythical Chummer", oldPrice: 225000, newPrice: 200000 },
        { name: "Cut Mullet", oldPrice: 1200, newPrice: 1000 },

    ]
    },
    {
    date: "2026-09-23",
    tag: "Price Update",
    changes: [
        { name: "Spinnerbait (Chartreuse)", oldPrice: 1500, newPrice: 2500 },
        { name: "Prospecting Amulet", oldPrice: 50000, newPrice: 100000 },
        { name: "Salmon Head", oldPrice: 4000, newPrice: 5000 },
        { name: "Cownose Ray Cutbait", oldPrice: 4000, newPrice: 6000 },
        { name: "Chicken Scraps", oldPrice: 450, newPrice: 350 },
        { name: "Subarctic Shard", oldPrice: 7000, newPrice: 6000 },
        { name: "Fabled Shard", oldPrice: 1500000, newPrice: 1200000 },
        { name: "Fabled Amulet", oldPrice: 7500000, newPrice: 6000000 },
    ]
    },
    {
    date: "2026-09-22",
    tag: "Price Update",
    changes: [
        { name: "Frog (Rainforest Yellow)", oldPrice: 4000, newPrice: 2500 },
        { name: "Cut Mullet", oldPrice: 1500, newPrice: 1200 },
        { name: "Shad Live Bait", oldPrice: 1500, newPrice: 1000 },
        { name: "Bardi Grub", oldPrice: 400, newPrice: 300 },
        { name: "Cut Shad", oldPrice: 400, newPrice: 350 },
        { name: "Advanced Bait Package (Epic)", oldPrice: 50000, newPrice: 45000 },
    ]
  },
  {
    date: "2026-09-20",
    tag: "Price Update",
    changes: [
        { name: "Roostertail (Fire Tiger)", oldPrice: 400, newPrice: 1000 },
        { name: "Roostertail (White Chartreuse)", oldPrice: 400, newPrice: 1000 },
        { name: "Roostertail (Bubblegum)", oldPrice: 400, newPrice: 1000 },
        { name: "Crankbait (Tiger Craw)", oldPrice: 400, newPrice: 1000 },
        { name: "Crankbait (Smokin' Shad)", oldPrice: 400, newPrice: 1000 },
        { name: "Lousiana Crawfish", oldPrice: 600, newPrice: 700 },
        { name: "Yabby Crawfish", oldPrice: 1500, newPrice: 700 },
        { name: "Spinnerbait (White Shad)", oldPrice: 4000, newPrice: 2000 },
    ]
  }
];

function renderPriceChanges() {
  const container = document.getElementById("priceChangesList");
  if (!container) return;

  container.innerHTML = PRICE_CHANGES_DATA.map(entry => `
    <div class="changelog-entry price-entry">
      <h4>${entry.tag} <span class="date">• ${entry.date}</span></h4>
      <div class="price-change-rows">
        ${entry.changes.map(item => {
          const diff = item.newPrice - item.oldPrice;
          const isUp = diff >= 0;
          const sign = diff > 0 ? "+" : "";
          const diffClass = isUp ? "price-up" : "price-down";
          return `
            <div class="price-row">
              <span class="price-item-name">${item.name}</span>
              <span class="price-item-values">
                <span class="old-val">${formatMoney(item.oldPrice)}</span>
                <span class="arrow">➜</span>
                <span class="new-val">${formatMoney(item.newPrice)}</span>
                <span class="diff-badge ${diffClass}">${sign}${formatMoney(diff)}</span>
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}