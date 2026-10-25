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

export const fishByIsland = {
    freshwaterHaven: freshwaterHaven,
    pointDriftt: [], // no fish yet
};

export const allFish = Object.values(fishByIsland).flat();

// standard times for the fish to bite. if no time, these are the possible times.
export const dayTimes = ["morning", "afternoon", "evening"];

export function fishTimes(type) {
    return type.times || dayTimes;
}
