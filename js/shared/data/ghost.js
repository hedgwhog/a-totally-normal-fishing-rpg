// The Ghost of Noy: has the gear you lost (dropped) that no shop sells.
// It visits in the night before every 101st day (when you sleep from day 100 to 101, 201 to 202, ...),
// wherever you are, but only when it has something of yours.
// You pay for lost gear with time (days) AND with coins or resonance (any mix, 1 resonance counts as 1 coin).
// The days pass after you're done with the ghost.

export const ghost = {
    every: 101,          // the day it visits on (every 101st day)
    coinsPerDay: 8,      // 1 day for every 8 coins the gear is worth (rounded up, at least 1 day)
    valuePercent: 300,   // and coins and/or resonance: this % of what the gear is worth
};
