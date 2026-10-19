// slow bar = the higher number, the more helpfull it is aka "Focus"
// zone bonus = bigger bar
// luck = higher chance for fish
export const marketplaceItems = [
    { id: "rodShallow", name: "Shallow fishing rod (Shallow)", price: 20, slot: "Rod", effect: "Focus: 5%", stats: { slowBar: 5 }, waters: ["shallow"] },
    { id: "rodCoastal", name: "Coastal fishing rod (Coastal)", price: 45, slot: "Rod", effect: "Focus: 5%", stats: { slowBar: 5 }, waters: ["coastal"] },
    { id: "rodDock", name: "Dock fishing rod (Shallow & Coastal)", price: 75, slot: "Rod", effect: "Focus: 5% + Luck: +0.5 ", stats: { slowBar: 2.5, luck: 0.5 }, waters: ["shallow", "coastal"] },
    { id: "fishingHat", name: "Cozy fishing hat", price: 25, slot: "Hat", effect: "Luck: +1", stats: { luck: 1 } },
];