// water: type of water the fish lives in.
// zone: size of the hitbox, smaller is harder!
// speed: ms for the bar, lower ms is harder!
// chance: how often it shows up in comparison to other fish
// rarity: 0 = common, higher = more rare. The luck stat boosts the chance of rarer fish.
export const fishList = [
    // Shallow
    { id: "crappie", name: "Crappie", price: 2, waters: ["shallow"], zone: 4, speed: 60, chance: 45, rarity: 1 },
    { id: "bluegill", name: "Bluegill", price: 1, waters: ["shallow"], zone: 6, speed: 50, chance: 60, rarity: 0 },
    { id: "panfish", name: "Panfish", price: 1, waters: ["shallow"], zone: 6, speed: 50, chance: 60, rarity: 0 },
    { id: "catfish", name: "Catfish", price: 4, waters: ["shallow"], zone: 3, speed: 30, chance: 5, rarity: 3 },

    // Shallow & Coastal
    { id: "flounder", name: "Flounder", price: 3, waters: ["shallow", "coastal"], zone: 4, speed: 45, chance: 30, rarity: 0.2 },
    { id: "bass", name: "Bass", price: 2, waters: ["shallow", "coastal"], zone: 5, speed: 66, chance: 35, rarity: 0 },

    // Coastal
    { id: "snook", name: "Snook", price: 2, waters: ["coastal"], zone: 4, speed: 40, chance: 35, rarity: 0 },
    { id: "mackerel", name: "Mackerel", price: 2, waters: ["coastal"], zone: 4, speed: 40, chance: 35, rarity: 0 },
    { id: "cod", name: "Cod", price: 1, waters: ["coastal"], zone: 5, speed: 45, chance: 70, rarity: 0 },
    { id: "lumpfish", name: "Lumpfish", price: 7, waters: ["coastal"], zone: 3, speed: 20, chance: 8, rarity: 5 },
];