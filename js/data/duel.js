export const duelDefaults = {
    time: 60,
    lives: 3,
    minLineSpeed: 35, maxLineSpeed: 60,
    minFishSpeed: 120, maxFishSpeed: 250,
    minWidth: 14, maxWidth: 22,
};

export const duelLimits = {
    time: [10, 300],
    lives: [1, 10],
    lineSpeed: [15, 150],
    fishSpeed: [50, 500],
    width: [8, 40],
};

export const duelZone = 3;
export const stakeCategories = ["Trinkets", "Supplies"];
