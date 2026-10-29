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
// bound: true = you can't sell it or drop it (like the deep fishing rod, it belongs to the research facility).
//        You CAN put it in a storage locker.
//
// SELLING AND BUYING BACK: gear you sell is sold again by the shop you sold it to, for the full price.
// (See js/rules/shops.js.) Only the starter gear (the old gear) is gone for good once it's sold.
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

// sold at the inconvenience store on Point Driftt
export const storeGear = [
    { id: "researchHat", name: "Research hat", price: 125, slot: "Hat", effect: "Focus: 7.5%", stats: { slowBar: 7.5 } },
    { id: "researchCloak", name: "Research cloak", price: 200, slot: "Cloak", effect: "Focus: 7.5%", stats: { slowBar: 7.5 } },
];

// you get it from the research facility when you arrive on Point Driftt. It belongs to them (see the contract).
export const deepRod = {
    id: "rodDeep", name: "Deep fishing rod (Ocean & Hadal)", slot: "Rod", effect: "",
    stats: {}, waters: ["ocean", "hadal"], bound: true,
};

// reward from the fortune teller
export const luckRod = {
    id: "rodLuck", name: "Luck fishing rod (Shallow)", slot: "Rod", effect: "Luck: +1",
    stats: { luck: 1 }, waters: ["shallow"], sellValue: 40,
};

// reward from the annual ritual
export const charmCloak = {
    id: "charmCloak", name: "Charm cloak", slot: "Cloak", effect: "Luck: +0.5 (abyssal)",
    stats: {}, waterStats: { abyssal: { luck: 0.5 } }, sellValue: 80,
};

// every piece of gear in the game. New gear must be in here, or it can't be loaded from a save.
export const allGear = [...Object.values(starterGear), ...marketplaceGear, ...storeGear, charmCloak, luckRod, deepRod];

export const findGear = id => allGear.find(gear => gear.id === id);
export const isStarterGear = id => Object.values(starterGear).some(gear => gear.id === id);