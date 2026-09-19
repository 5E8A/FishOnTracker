// price_changes.js
const PRICE_CHANGES_DATA = [
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