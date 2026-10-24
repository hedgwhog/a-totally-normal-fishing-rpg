// name: what players see
// stat: which stat it boosts
// perLevel: how much each level adds
// maxLevel: the highest level it can get
// chance: how often you get it
// minRank: minimum rank for it to be able to show up
// levelUp: lowers the chance of getting a higher level, for rare enchants
export const enchants = {
    luck: { name: "Luck", stat: "luck", perLevel: 0.5, maxLevel: 10, chance: 43 },
    focus: { name: "Focus", stat: "slowBar", perLevel: 2.5, maxLevel: 10, chance: 44 },
    hitbox: { name: "Hitbox", stat: "zoneBonus", perLevel: 1, maxLevel: 2, minRank: 2, chance: 2, levelUp: 0.15 },
    rewind: { name: "Rewind", stat: "rewind", perLevel: 1, maxLevel: 3, minRank: 2, chance: 4, levelUp: 0.20 },
};

// level numbers are roman numbers
export const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
