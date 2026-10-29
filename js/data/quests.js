// Ichthyologist: every round she asks for 4 random fish from these waters, plus the 2 rare fish fish for the final one
export const rareFish = ["catfish", "muskie"];
export const researcherRounds = [
    { waters: ["shallow"], extra: [], coins: 10, resonance: 5 },
    { waters: ["coastal"], extra: [], coins: 15, resonance: 10 },
    { waters: ["shallow", "coastal"], extra: [], coins: 20, resonance: 15 },
    { waters: ["shallow", "coastal"], extra: rareFish, coins: 25, resonance: 20 },
];

export const tavern = { orderDays: 3, coinMultiplier: 1.5, resonanceMultiplier: 2 };

export const ritual = {
    every: 19,
    charm: { id: "theCharm", name: "The charm", zone: 2, speed: 28, rounds: 12, hits: 12, barWidth: [17, 13, 15], fishSpeed: 115 },
};

export const ramlaris = { daysToArrive: 11, payment: { fishCan: 12, waterBottle: 20, beer: 4 } };

export const altar = {
    levels: [
        { level: 1, cost: 20, extraChance: 0.25, levelUpChance: 0.4 },
        { level: 2, cost: 50, extraChance: 0.4, levelUpChance: 0.75 },
        { level: 3, cost: 125, extraChance: 0.65, levelUpChance: 0.95 },
    ],
    dissonanceCost: 20,
};

export const marketplace = { sellPercent: 70 };
export const fortuneTeller = { trinketsWanted: 3, trinket: "luckCharm" };
export const mayor = { tavernHelps: 5, donation: 50 };
