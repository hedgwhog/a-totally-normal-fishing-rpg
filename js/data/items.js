// category: where it shows up in the items list and the marketplace
// "Trinkets" can be used, they double something for a few catches
// "Bottles" can be used, they give you something right away
// "Supplies" are only for trading
//  Special" are rare items with no use (yet)

// boost/catches: (trinkets) what it doubles, and for how many catches
// resonance: (bottles) how much resonance you get when you use it
// fishChance: % chance to fish it up with a catch
// price: what it costs to buy
export const items = [
    { id: "luckCharm", name: "Luck trinket", category: "Trinkets", boost: "luck", catches: 5, fishChance: 2, price: 35 },
    { id: "resonanceCharm", name: "Resonance trinket", category: "Trinkets", boost: "resonance", catches: 5, fishChance: 2, price: 35 },
    { id: "focusCharm", name: "Focus trinket", category: "Trinkets", boost: "focus", catches: 5, fishChance: 2, price: 35 },
    { id: "slowCharm", name: "Slow trinket", category: "Trinkets", boost: "slow-fish", catches: 5, fishChance: 2, price: 35 },

    { id: "resonanceBottle", name: "Bottle of resonance", category: "Bottles", resonance: 10, price: 15 },

    { id: "fishCan", name: "Cans of processed fish", category: "Supplies", price: 6 },
    { id: "waterBottle", name: "Bottles of fresh water", category: "Supplies", price: 2 },
    { id: "beer", name: "Beer", category: "Supplies", price: 5 },

    { id: "theCharm", name: "The charm", category: "Special" },
];

export const itemCategories = ["Trinkets", "Bottles", "Supplies", "Special", "Fossils"];

export function findItem(id) {
    return items.find(item => item.id === id);
}
