// water: type of water the fish lives in.
// zone: size of the hitbox, smaller is harder!
// speed: ms for your line (|), lower ms is harder! (Focus slows it down)
// chance: how often it shows up in comparison to other fish
// rarity: 0 = common, higher = more rare. The luck stat boosts the chance of rarer fish.
// resonance: how much resonance you get when you catch it
// rounds: how many rounds the fishing takes
// hits: how many of those rounds you need to hit to catch it
// barWidth: how long the bar is, shorter is harder! Use a list for a different width per bar: [16, 10, 13] = 3 bars
// bars: how many bars (1 to 3), only needed when barWidth is one number. After every hit your line goes to the next bar
// fishSpeed: ms for the fish (===) to move, lower ms is harder! 0 = the fish stands still (Poison slows it down)
export const fishList = [
    // Shallow
    { id: "crappie", name: "Crappie", price: 2, waters: ["shallow"], zone: 4, speed: 50, chance: 45, rarity: 1, resonance: 1, rounds: 3, hits: 3, barWidth: 20, bars: 1, fishSpeed: 180 },
    { id: "bluegill", name: "Bluegill", price: 1, waters: ["shallow"], zone: 6, speed: 50, chance: 60, rarity: 0, resonance: 1, rounds: 3, hits: 2, barWidth: 24, bars: 1, fishSpeed: 170 },
    { id: "panfish", name: "Panfish", price: 1, waters: ["shallow"], zone: 6, speed: 50, chance: 60, rarity: 0, resonance: 1, rounds: 3, hits: 2, barWidth: 25, bars: 1, fishSpeed: 175 },
    { id: "catfish", name: "Catfish", price: 4, waters: ["shallow"], zone: 3, speed: 30, chance: 5, rarity: 3, resonance: 2, rounds: 4, hits: 4, barWidth: 16, bars: 4, fishSpeed: 250 },

    // Shallow & Coastal
    { id: "flounder", name: "Flounder", price: 3, waters: ["shallow", "coastal"], zone: 4, speed: 30, chance: 30, rarity: 0.2, resonance: 2, rounds: 4, hits: 4, barWidth: 28, bars: 2, fishSpeed: 280 },
    { id: "bass", name: "Bass", price: 2, waters: ["shallow", "coastal"], zone: 5, speed: 45, chance: 35, rarity: 0, resonance: 1, rounds: 5, hits: 4, barWidth: 32, bars: 1, fishSpeed: 80 },

    // Coastal
    { id: "snook", name: "Snook", price: 2, waters: ["coastal"], zone: 4, speed: 60, chance: 35, rarity: 0, resonance: 1, rounds: 3, hits: 3, barWidth: 30, bars: 1, fishSpeed: 35 },
    { id: "mackerel", name: "Mackerel", price: 2, waters: ["coastal"], zone: 4, speed: 50, chance: 35, rarity: 0, resonance: 1, rounds: 3, hits: 3, barWidth: 38, bars: 1, fishSpeed: 30 },
    { id: "cod", name: "Cod", price: 1, waters: ["coastal"], zone: 5, speed: 40, chance: 70, rarity: 0, resonance: 1, rounds: 2, hits: 1, barWidth: 16, bars: 1, fishSpeed: 170 },
    { id: "lumpfish", name: "Lumpfish", price: 7, waters: ["coastal"], zone: 3, speed: 18, chance: 8, rarity: 5, resonance: 3, rounds: 6, hits: 6, barWidth: [24, 20, 16], fishSpeed: 300 },
];