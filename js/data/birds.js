export const birds = {
    msPerTile: 60 * 60 * 1000, // 1 hour per tile
    minTiles: 1, // a trip is always at least 1 tile
    food: "birdFood", // the item it eats (data/items.js)
    discoverFood: 3, // birdfood to send it out to discover waters
    mailFood: 5, // birdfood to send it out with a letter
    defaultName: "Markus",
    maxNameLength: 20,
    maxLetterLength: 300, // characters per letter
    inboxSize: 30, // letters you can keep. When it's full, the oldest letter is thrown away
    giftCategories: ["Trinkets"], // items the pigeon can carry (and coins and resonance)
};
