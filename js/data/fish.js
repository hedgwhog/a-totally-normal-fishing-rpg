// id: unique name for the code and the save
// name: the name players see
// price: how many coins worth
// waters: type of water the fish lives in. Your equipped rod must have one of these waters.
// zone: size of the hitbox, smaller is harder!
// speed: ms for your line (|), lower ms is harder! (Focus slows it down)
// chance: how often it shows up in comparison to other fish
// rarity: 0 = common, higher = more rare. The luck stat boosts the chance of rarer fish.
// resonance: how much resonance you get when you catch it
// rounds: how many rounds the fishing takes
// hits: how many of those rounds you need to hit to catch it
// barWidth: how long the bar is, shorter is harder! Use a list for a different width per bar: [16, 10, 13] = 3 bars for example
// bars: how many bars, only needed when barWidth is one number. After every hit your line goes to the next bar
// fishSpeed: ms for the fish, lower ms is harder! 0 = the fish stands still
// times: when the fish bites. Leave it out for the default, default is: morning, afternoon & evening
// sellable: false = nobody buys this fish (the hadal fish). Leave it out for normal fish.
const freshwaterHaven = [
    // Shallow
    { id: "bluegill", name: "Bluegill", price: 1, waters: ["shallow"], zone: 6, speed: 55, chance: 60, rarity: 0, resonance: 1, rounds: 3, hits: 2, barWidth: 22, bars: 1, fishSpeed: 300 },
    { id: "pumpkinseed", name: "Pumpkinseed", price: 1, waters: ["shallow"], zone: 6, speed: 55, chance: 55, rarity: 0, resonance: 1, rounds: 3, hits: 2, barWidth: 22, bars: 1, fishSpeed: 280 },
    { id: "perch", name: "Yellow Perch", price: 2, waters: ["shallow"], zone: 5, speed: 50, chance: 45, rarity: 0.5, resonance: 1, rounds: 3, hits: 3, barWidth: 22, bars: 1, fishSpeed: 240 },
    { id: "crappie", name: "Crappie", price: 2, waters: ["shallow"], zone: 5, speed: 50, chance: 40, rarity: 0.5, resonance: 1, rounds: 3, hits: 3, barWidth: 20, bars: 1, fishSpeed: 220 },
    { id: "tench", name: "Tench", price: 3, waters: ["shallow"], zone: 4, speed: 45, chance: 20, rarity: 1.5, resonance: 2, rounds: 4, hits: 3, barWidth: 20, bars: 1, fishSpeed: 200 },
    { id: "catfish", name: "Channel Catfish", price: 5, waters: ["shallow"], zone: 3, speed: 35, chance: 6, rarity: 3, resonance: 3, rounds: 4, hits: 4, barWidth: [16, 14], fishSpeed: 170 },

    // Shallow & Coastal
    { id: "bass", name: "Largemouth Bass", price: 3, waters: ["shallow", "coastal"], zone: 4, speed: 45, chance: 30, rarity: 1, resonance: 2, rounds: 4, hits: 3, barWidth: 20, bars: 1, fishSpeed: 200 },
    { id: "carp", name: "Common Carp", price: 3, waters: ["shallow", "coastal"], zone: 4, speed: 50, chance: 25, rarity: 1, resonance: 2, rounds: 5, hits: 3, barWidth: 20, bars: 1, fishSpeed: 230 },

    // Coastal
    { id: "whitefish", name: "Lake Whitefish", price: 1, waters: ["coastal"], zone: 6, speed: 50, chance: 60, rarity: 0, resonance: 1, rounds: 3, hits: 2, barWidth: 22, bars: 1, fishSpeed: 260 },
    { id: "walleye", name: "Walleye", price: 2, waters: ["coastal"], zone: 5, speed: 45, chance: 40, rarity: 0.5, resonance: 1, rounds: 3, hits: 3, barWidth: 20, bars: 1, fishSpeed: 220 },
    { id: "trout", name: "Rainbow Trout", price: 3, waters: ["coastal"], zone: 4, speed: 40, chance: 30, rarity: 1, resonance: 2, rounds: 4, hits: 3, barWidth: 18, bars: 1, fishSpeed: 190 },
    { id: "pike", name: "Northern Pike", price: 4, waters: ["coastal"], zone: 4, speed: 35, chance: 15, rarity: 2, resonance: 2, rounds: 4, hits: 4, barWidth: 18, bars: 1, fishSpeed: 160 },
    { id: "muskie", name: "Muskellunge", price: 8, waters: ["coastal"], zone: 3, speed: 25, chance: 4, rarity: 5, resonance: 4, rounds: 5, hits: 5, barWidth: [14, 12], fishSpeed: 130 },

    // Abyssal (only at night)
    { id: "cisco", name: "Cisco", price: 3, waters: ["abyssal"], zone: 5, speed: 45, chance: 55, rarity: 0, resonance: 2, rounds: 3, hits: 3, barWidth: 20, bars: 1, fishSpeed: 220, times: ["night"] },
    { id: "sculpin", name: "Deepwater Sculpin", price: 3, waters: ["abyssal"], zone: 4, speed: 45, chance: 45, rarity: 0.5, resonance: 2, rounds: 3, hits: 3, barWidth: 18, bars: 1, fishSpeed: 200, times: ["night"] },
    { id: "burbot", name: "Burbot", price: 5, waters: ["abyssal"], zone: 4, speed: 35, chance: 30, rarity: 1.5, resonance: 3, rounds: 4, hits: 4, barWidth: 18, bars: 1, fishSpeed: 170, times: ["night"] },
    { id: "lakeTrout", name: "Lake Trout", price: 6, waters: ["abyssal"], zone: 3, speed: 35, chance: 20, rarity: 2, resonance: 3, rounds: 4, hits: 4, barWidth: [16, 14], fishSpeed: 160, times: ["night"] },
    { id: "sturgeon", name: "Lake Sturgeon", price: 12, waters: ["abyssal"], zone: 3, speed: 25, chance: 5, rarity: 5, resonance: 6, rounds: 5, hits: 5, barWidth: [14, 12], fishSpeed: 130, times: ["night"] },
    { id: "golomyanka", name: "Golomyanka", price: 30, waters: ["abyssal"], zone: 2, speed: 20, chance: 0.5, rarity: 8, resonance: 15, rounds: 6, hits: 6, barWidth: [14, 10, 12], fishSpeed: 110, times: ["night"] },

    //fossil (for later)
    // { id: "fossilPannoniasaurus", name: "Pannoniasaurus", price: 100, waters: ["shallow", "coastal", "abyssal"], zone: 9, speed: 40, chance: 100, rarity: 0, resonance: 0, rounds: 30, hits: 30, barWidth: 40, fishSpeed: 400, category: "Fossils"},
];

const pointDriftt = [
    // Day (morning, afternoon & evening)
    { id: "herring", name: "Atlantic Herring", price: 2, waters: ["ocean"], zone: 5, speed: 45, chance: 60, rarity: 0, resonance: 1, rounds: 3, hits: 2, barWidth: 20, bars: 1, fishSpeed: 240 },
    { id: "mackerel", name: "Atlantic Mackerel", price: 2, waters: ["ocean"], zone: 5, speed: 45, chance: 55, rarity: 0, resonance: 1, rounds: 3, hits: 3, barWidth: 20, bars: 1, fishSpeed: 220 },
    { id: "silverHake", name: "Silver Hake", price: 3, waters: ["ocean"], zone: 5, speed: 42, chance: 45, rarity: 0.5, resonance: 2, rounds: 3, hits: 3, barWidth: 20, bars: 1, fishSpeed: 210 },
    { id: "haddock", name: "Haddock", price: 3, waters: ["ocean"], zone: 4, speed: 42, chance: 40, rarity: 0.5, resonance: 2, rounds: 4, hits: 3, barWidth: 18, bars: 1, fishSpeed: 200 },
    { id: "cod", name: "Atlantic Cod", price: 4, waters: ["ocean"], zone: 4, speed: 40, chance: 40, rarity: 1, resonance: 2, rounds: 4, hits: 3, barWidth: 18, bars: 1, fishSpeed: 200 },
    { id: "rosefish", name: "Blackbelly Rosefish", price: 4, waters: ["ocean"], zone: 4, speed: 40, chance: 30, rarity: 1, resonance: 2, rounds: 4, hits: 3, barWidth: 18, bars: 1, fishSpeed: 190 },
    { id: "sablefish", name: "Sablefish", price: 6, waters: ["ocean"], zone: 4, speed: 35, chance: 20, rarity: 2, resonance: 3, rounds: 4, hits: 4, barWidth: 18, bars: 1, fishSpeed: 170 },
    { id: "wahoo", name: "Wahoo", price: 7, waters: ["ocean"], zone: 3, speed: 30, chance: 15, rarity: 2, resonance: 3, rounds: 4, hits: 4, barWidth: [16, 14], fishSpeed: 150 },
    { id: "bluefinTuna", name: "Bluefin Tuna", price: 18, waters: ["ocean"], zone: 3, speed: 25, chance: 4, rarity: 5, resonance: 7, rounds: 5, hits: 5, barWidth: [14, 12], fishSpeed: 125 },
    { id: "opah", name: "Opah", price: 35, waters: ["ocean"], zone: 2, speed: 20, chance: 0.5, rarity: 8, resonance: 15, rounds: 6, hits: 6, barWidth: [14, 10, 12], fishSpeed: 110 },

    // Evening & night (they come up from the deep when it gets dark)
    { id: "escolar", name: "Escolar", price: 8, waters: ["ocean"], zone: 3, speed: 35, chance: 15, rarity: 2.5, resonance: 4, rounds: 4, hits: 4, barWidth: [16, 14], fishSpeed: 160, times: ["evening", "night"] },
    { id: "swordfish", name: "Swordfish", price: 15, waters: ["ocean"], zone: 3, speed: 25, chance: 5, rarity: 4, resonance: 6, rounds: 5, hits: 5, barWidth: [14, 12], fishSpeed: 130, times: ["evening", "night"] },

    // Night only
    { id: "lanternfish", name: "Lanternfish", price: 3, waters: ["ocean"], zone: 5, speed: 45, chance: 55, rarity: 0, resonance: 2, rounds: 3, hits: 3, barWidth: 20, bars: 1, fishSpeed: 220, times: ["night"] },
    { id: "hatchetfish", name: "Hatchetfish", price: 4, waters: ["ocean"], zone: 4, speed: 40, chance: 40, rarity: 0.5, resonance: 2, rounds: 3, hits: 3, barWidth: 18, bars: 1, fishSpeed: 200, times: ["night"] },
];

const allTimes = ["morning", "afternoon", "evening", "night"];
const hadalDeep = [
    { id: "grenadier", name: "Pacific Grenadier", price: 0, sellable: false, waters: ["hadal"], zone: 3, speed: 25, chance: 50, rarity: 0, resonance: 10, rounds: 6, hits: 5, barWidth: [16, 14], fishSpeed: 130, times: allTimes },
    { id: "cuskEel", name: "Abyssal Cusk-eel", price: 0, sellable: false, waters: ["hadal"], zone: 3, speed: 22, chance: 30, rarity: 2, resonance: 14, rounds: 6, hits: 5, barWidth: [14, 12], fishSpeed: 120, times: allTimes },
    { id: "etherealSnailfish", name: "Ethereal Snailfish", price: 0, sellable: false, waters: ["hadal"], zone: 2, speed: 22, chance: 20, rarity: 4, resonance: 18, rounds: 7, hits: 6, barWidth: [14, 12, 13], fishSpeed: 115, times: allTimes },
    { id: "marianaSnailfish", name: "Mariana Snailfish", price: 0, sellable: false, waters: ["hadal"], zone: 2, speed: 16, chance: 0.5, rarity: 12, resonance: 50, rounds: 8, hits: 8, barWidth: [12, 10, 11], fishSpeed: 95, times: allTimes },
];

export const fishByIsland = {
    freshwaterHaven: freshwaterHaven,
    pointDriftt: pointDriftt,
    hadalDeep: hadalDeep,
};

export const allFish = Object.values(fishByIsland).flat();
export const dayTimes = ["morning", "afternoon", "evening"];

export function fishTimes(type) {
    return type.times || dayTimes;
}

export function isSellable(type) {
    return type.sellable !== false;
}

export const hadalFish = hadalDeep;
