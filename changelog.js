// changelog.js
const CHANGELOG_DATA = [
  {
    version: "v1.0.2",
    date: "Official Release",
    changes: [
      "Dynamic price synchronization — custom Pets, Armor, and Rod Parts",
      "Added missing Baits to the database",
      "Simplified display labels for Armor climates, Armor rarities, and Pet rarities"
    ]
  },
  {
    version: "v1.0.1",
    date: "Official Release",
    changes: [
      "Fixed Rod Blank and Gear System prices"
    ]
  },
  {
    version: "v1.0.0",
    date: "Official Release",
    changes: [
      "Total Net Worth Calculation — track the full value of your account in real time with automatic category breakdowns.",
      "Custom Equipment Builders — advanced calculators for Pets (ratings & bonus stats), Armor sets (climate shards & infusions), and Rod Parts (tech upgrades).",
      "Comprehensive Item Catalog — built-in database of official FishOnMC items, crafting materials, baits, and consumables.",
      "Shareable Profile Cards — export high-resolution PNG summary cards featuring your IGN, level, crew tag, and wealth distribution.",
      "Interactive Inventory Table — easily adjust quantities (+/- controls, stack shortcuts) and sort items by value, quantity, or name.",
      "Local Storage & Portability — your data saves automatically in your browser with full JSON export/import support for manual backups."
    ]
  }
];

function renderChangelog() {
  const container = document.getElementById("changelogList");
  if (!container) return;

  container.innerHTML = CHANGELOG_DATA.map(entry => `
    <div class="changelog-entry">
      <h4>${entry.version} <span class="date">• ${entry.date}</span></h4>
      <ul>
        ${entry.changes.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}