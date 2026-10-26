// id: unique name for the code, the save and the ASCII file
// name: what players see when they hover over it
// slot: "Hat", "Cloak" or "Rod"

// stats: what the gear always gives you
// slowBar = Focus, the higher the number, the slower your line
// zoneBonus = bigger hitbox
// luck = rarer fish show up more often

// waters: in what waters you can fish in
// price: what it costs
// sellValue: fixed sell price, for gear you can't buy (everything else sells for a part of its price)
// The ASCII art is in ascii/gear/<slot>s/<id>.txt

// what every new player starts with
export const starterGear = {
    Hat: { id: "oldHat", name: "Old Hat", slot: "Hat", effect: "", stats: {}, sellValue: 2 },
    Cloak: { id: "oldCloak", name: "Old Cloak", slot: "Cloak", effect: "", stats: {}, sellValue: 2 },
    Rod: { id: "oldRod", name: "Old Fishing Rod (shallow)", slot: "Rod", effect: "", stats: {}, waters: ["shallow"], sellValue: 2 },
};

// sold at the marketplace. Rods show under "Fishing rods", everything else under "Clothing".
export const marketplaceGear = [
    { id: "rodBasic", name: "Basic fishing rod (Shallow)", price: 20, slot: "Rod", effect: "Focus: 5%", stats: { slowBar: 5 }, waters: ["shallow"] },
    { id: "rodSimple", name: "Simple fishing rod (Coastal)", price: 45, slot: "Rod", effect: "Focus: 5%", stats: { slowBar: 5 }, waters: ["coastal"] },
    { id: "rodCombined", name: "Combined fishing rod (Shallow & Coastal)", price: 75, slot: "Rod", effect: "Focus: 2.5% + Luck: +0.5", stats: { slowBar: 2.5, luck: 0.5 }, waters: ["shallow", "coastal"] },
    { id: "rodCracked", name: "Cracked fishing rod (Abyssal)", price: 160, slot: "Rod", effect: "", stats: {}, waters: ["abyssal"] },
    { id: "cozyFishingHat", name: "Cozy fishing hat", price: 25, slot: "Hat", effect: "Luck: +1", stats: { luck: 1 } },
    { id: "relaxingFishingHat", name: "Relaxing fishing hat", price: 25, slot: "Hat", effect: "Focus: 5%", stats: { slowBar: 5 } }, // focus is the "slowBar" stat
    { id: "simpleCloak", name: "Simple Cloak", price: 40, slot: "Cloak", effect: "Focus: 0.5%", stats: { slowBar: 0.5 } },
];

// reward from the fortune teller
export const luckRod = {
    id: "rodLuck", name: "Luck fishing rod (Coastal)", slot: "Rod", effect: "Luck: +1",
    stats: { luck: 1 }, waters: ["coastal"], sellValue: 40,
};

// reward from the annual ritual
export const charmCloak = {
    id: "charmCloak", name: "Charm cloak", slot: "Cloak", effect: "Luck: +0.5 (abyssal)",
    stats: {}, waterStats: { abyssal: { luck: 0.5 } }, sellValue: 80,
};

// every piece of gear in the game. New gear must be in here, or it can't be loaded from a save.
export const allGear = [...Object.values(starterGear), ...marketplaceGear, charmCloak, luckRod];