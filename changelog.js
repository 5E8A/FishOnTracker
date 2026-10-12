// changelog.js
const CHANGELOG_DATA = [
              {
    version: "v1.1.0",
    date: "Official Release",
    changes: [
      "Redesigned website layout and navigation",
      "Added interactive Inventory Sync Preview with live Net Worth comparison",
      "Added Player Identity Banner",
      "Added dynamic colors for percentage ratings and armor infusions",
      "Added Added direct link to the Fabric Mod GitHub repository",
      "Added disclaimer information to the website footer",
      "Added billion-scale ($1B+) currency formatting",
      "Added favicon",
      "Changed website's default font",
      "Fixed wrong pet skins names in the database",
      "Fixed outline colors for level badge on Share Cards",
    ]
  },
            {
    version: "v1.0.7",
    date: "Official Release",
    changes: [
      "Added minecraft head for Share Cards",
      "Added dynamic level badge colors to Share Cards",
      "Share Card details (IGN, level, crew) will now be saved in web cache",
      "Hide Crew name label on Share Cards if left blank",
      "Removed x symbol in total items tracked on Share Cards",
      "Added Vacation Koala Pet to the database",
    ]
  },
          {
    version: "v1.0.6",
    date: "Official Release",
    changes: [
      "Added missing Pet Skins to the database",
    ]
  },
        {
    version: "v1.0.5",
    date: "Official Release",
    changes: [
      "Added Supercharges to the database",
      "Added support for standalone Rod Blank and Gear System Tech",
      "Added dynamic pricing support for exported Rod Parts",
      "Added event Baits to the database",
    ]
  },
      {
    version: "v1.0.4",
    date: "Official Release",
    changes: [
      "Added Quick Paste button for JSON file, for future FishOnTracker Mod",
      "Added missing Poles and Reels to the database",
      "Added missing database item indicators",
      "Changed a few internal item IDs"
    ]
  },
    {
    version: "v1.0.4",
    date: "Official Release",
    changes: [
      "Added Quick Paste button for JSON file, for future FishOnTracker Mod",
      "Added missing Poles and Reels to the database",
      "Added missing database item indicators",
      "Changed a few internal item IDs"
    ]
  },
  {
    version: "v1.0.3",
    date: "Official Release",
    changes: [
      "Added price change tracking — view historical price adjustments",
      "Added generation date stamp to Share Cards",
      "Updated file naming to Share Cards and Inventory JSON files",
      "Added quick-access GitHub repository link to header navigation"
    ]
  },
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