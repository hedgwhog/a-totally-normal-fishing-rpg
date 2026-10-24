// The merchant shows up once every 13 days. The code for it to work are in a different file, here are the numbers
export const merchantEvery = 1;

// backpack upgrades:
export const backpackUpgrades = [
    { slots: 3, price: 25 },
    { slots: 4, price: 50 },
    { slots: 5, price: 100 },
    { slots: 6, price: 200 },
    { slots: 7, price: 400 },
    { slots: 8, price: 800 },
];

// what the item is, and what he can have in stock from least to most
export const merchantStock = {
    luckCharm: [0, 5],
    resonanceCharm: [0, 5],
    resonanceBottle: [1, 9],
};

// hes greedy lmao
export const merchantBuyPercent = 20;
