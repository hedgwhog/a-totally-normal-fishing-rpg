import { altar } from "./quests.js";
export const contract = { hadalFishWanted: 6 };
export const boatman = { tripPrice: 125, travelDays: 2 };
export const lockers = { prices: [25, 150] };
export const station = {
    levels: [
        ...altar.levels,
        { level: 4, cost: 300, extraChance: 0.8, levelUpChance: 1.15 },
    ],
    upgradeLevel: { level: 5, cost: 675, extraChance: 0.95, levelUpChance: 1.4 },
    upgradeRank: 4,
    rodsWanted: 9, // amount of upgrades you need of level 4
    dissonanceCost: 12.5,
};

export const store = {
    supplies: ["birdFood", "fishCan", "waterBottle"],
    supplyMultiplier: 2,
    sellPercent: 75,
};