let inventory = JSON.parse(localStorage.getItem("saveInventory")) || [];

const inventoryItem = document.getElementById("inventoryItem");

const rod = { id: "rod", name: "a Fishing Rod", type: "rod", stats: { fishPerCatch: 1 } };
 
if (!inventory.some(item => item.type === "rod")) {
    inventory.push(rod);
    localStorage.setItem("saveInventory", JSON.stringify(inventory));
}

function showInventory() {
    if (inventory.length === 0) {
        inventoryItem.innerHTML = "A fishing rod";
    } else {
        inventoryItem.innerHTML = inventory.map(item => item.name).join("<br><br>");
    }
}

export function hasItem(id) {
    return inventory.some(item => item.id === id);
}

export function addItem(item) {
    if (item.type) { // your only allowed to own 1 rod
        inventory = inventory.filter(owned => owned.type !== item.type);
    }
    inventory.push({ id: item.id, name: item.name, type: item.type, stats: item.stats }); // attributes item
    localStorage.setItem("saveInventory", JSON.stringify(inventory));
    showInventory();
}

// The highest value on a stat gets returned.
export function getStat(statName, startingValue) {
    let best = startingValue; 
    for (const item of inventory) {
        const value = item.stats[statName];
        if (value !== undefined && value > best) best = value;
    }
    return best;
}

showInventory();