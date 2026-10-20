const dropMin = 55; // the stone drops after this many catches.
const dropMax = 75;
const xpPerFish = 1;

// name: display name
// effect: small description for the hover
// description: The full description in affinity popup
// chance: how hard it is to get from the stone
// cost: how much you pay to learn it (main affinities are free)
// branches: sub branches to learn specific skills
// The id is also the name for the ASCII 
const affinities = {
    poison: {
        name: "Poison", chance: 40, cost: 0, stats: {},
        effect: "Fish get slower",
        description: "Every 5 seconds, the fish gets slowed 10%. It stacks until 40%",
        slowEvery: 5, slowStep: 10, slowMax: 40,
        branches: {},
    },
    probability: {
        name: "Probability", chance: 40, cost: 0, stats: {},
        effect: "Randomised luck",
        description: "All your catches have a randomised luck between -2,5% to +10%",
        luckMin: -2.5, luckMax: 10,
        branches: {},
    },
    laziness: {
        name: "Laziness", chance: 5, cost: 0, stats: { zoneBonus: 2 },
        effect: "Hitbox +2, sell 75%",
        description: "Increase hitbox: +2, but all the fish you sell are worth 75% of the original price.",
        sellMultiplier: 0.75,
        branches: {},
    },
};

function randomDrop() {
    return dropMin + Math.floor(Math.random() * (dropMax - dropMin + 1));
}

function loadAffinity() {
    let saved;
    try {
        saved = JSON.parse(localStorage.getItem("saveAffinity"));
    } catch {
        saved = null;
    }
    if (!saved || typeof saved !== "object") saved = {};

    return {
        caught: parseInt(saved.caught) || 0,
        dropAt: parseInt(saved.dropAt) || randomDrop(),
        hasStone: saved.hasStone === true,
        path: Array.isArray(saved.path) ? saved.path : [],
        xp: parseInt(saved.xp) || 0,
    };
}

function saveAffinity() {
    localStorage.setItem("saveAffinity", JSON.stringify(affinity));
}

let affinity = loadAffinity();

function affinityPaths() {
    const nodes = [];
    let branches = affinities;
    for (const id of affinity.path) {
        const node = branches[id];
        if (!node) break;
        nodes.push(node);
        branches = node.branches;
    }
    return nodes;
}

// if your affinity gets removed, you get a new stone. 
if (affinityPaths().length !== affinity.path.length) {
    affinity.path = [];
    affinity.hasStone = true;
    saveAffinity();
}

function currentAffinityAbility() {
    const nodes = affinityPaths();
    return nodes[nodes.length - 1] || null;
}

async function showArt(element, id) {
    const response = await fetch("ascii/" + id + ".txt");
    element.textContent = await response.text();
}

export function getAffinityStat(name) {
    const node = currentAffinityAbility();
    if (!node) return 0;

    // Probability:
    if (name === "luck" && node.luckMax !== undefined) {
        const luck = node.luckMin + Math.random() * (node.luckMax - node.luckMin);
        return Math.round(luck * 10) / 10;
    }
    return node.stats[name] || 0;
}

// Poison:
export function getFishSlowdown(seconds) {
    const node = currentAffinityAbility();
    if (!node || node.slowEvery === undefined) return 1;
    const slower = Math.min(Math.floor(seconds / node.slowEvery) * node.slowStep, node.slowMax);
    return 1 + slower / 100;
}

// Laziness:
export function getSellMultiplier() {
    const node = currentAffinityAbility();
    return (node && node.sellMultiplier) || 1;
}

const stoneBox = document.getElementById("affinityItem");
const xpDisplay = document.getElementById("affinityXp");
const slot = document.getElementById("inventoryAffinity");
const slotLocked = document.getElementById("affinityLocked");
const slotArt = document.getElementById("ASCIIAffinity");
const slotName = document.getElementById("nameAffinity");
const slotEffect = document.getElementById("effectAffinity");
const popup = document.getElementById("affinityDisplay");
const popupArt = document.getElementById("affinityArt");
const popupInfo = document.getElementById("affinityInfo");

function showAffinity() {
    const nodes = affinityPaths();
    const unlocked = nodes.length > 0;

    stoneBox.style.display = affinity.hasStone ? "block" : "none";
    xpDisplay.style.display = unlocked ? "block" : "none";
    xpDisplay.innerHTML = "Current: <br>" + affinity.xp;
    slotLocked.style.display = unlocked ? "none" : "block";

    if (unlocked) {
        const lastId = affinity.path[affinity.path.length - 1];
        showArt(slotArt, lastId);
        slotName.textContent = nodes.map(node => node.name).join(" > ");
        slotEffect.textContent = currentAffinityAbility().effect;
    } else {
        slotArt.textContent = "";
        slotName.textContent = "";
        slotEffect.textContent = "";
    }

    showPopup();
}

function addLine(text) {
    const line = document.createElement("p");
    line.textContent = text || "\u00a0";
    popupInfo.appendChild(line);
}

function showPopup() {
    const nodes = affinityPaths();
    if (nodes.length === 0) return;

    const current = nodes[nodes.length - 1];
    showArt(popupArt, affinity.path[affinity.path.length - 1]);

    popupInfo.innerHTML = "";
    addLine("Affinity: " + nodes.map(node => node.name).join(" > "));
    addLine("Current: " + affinity.xp);
    addLine("");
    addLine("Effect:");
    addLine(current.description);
    addLine("");
    addLine("Skills you can learn:");

    const options = Object.entries(current.branches);
    if (options.length === 0) {
        addLine("Nothing to learn, for now...");
    }
    options.forEach(([id, branch]) => {
        const button = document.createElement("button");
        button.textContent = branch.name + " | " + branch.effect + " | " + branch.cost + " XP";
        button.addEventListener("click", () => learnAffinity(id));
        popupInfo.appendChild(button);
    });
}

function useStone() {
    const ids = Object.keys(affinities);
    let roll = Math.random() * ids.reduce((sum, id) => sum + affinities[id].chance, 0);
    let pickedId = ids[ids.length - 1];
    for (const id of ids) {
        roll -= affinities[id].chance;
        if (roll < 0) {
            pickedId = id;
            break;
        }
    }

    affinity.hasStone = false;
    affinity.path = [pickedId];
    saveAffinity();
    showAffinity();
    alert("The stone melts into your hand...\nYou got the " + affinities[pickedId].name + " affinity!");
}

function learnAffinity(id) {
    const next = currentAffinityAbility().branches[id];

    if (affinity.xp < next.cost) {
        alert("You need " + next.cost + " current to learn " + next.name + ".");
        return;
    }
    if (!confirm("Learn " + next.name + " for " + next.cost + " current?\nif so, your current affinity gets replaced with" + next.name)) return;

    affinity.xp -= next.cost;
    affinity.path.push(id);
    saveAffinity();
    showAffinity();
}

export function affinityFishCaught() {
    let message = "";
    affinity.caught++;

    if (affinity.path.length > 0) {
        affinity.xp += xpPerFish;
        message += "\n+" + xpPerFish + " Current";
    }
    if (affinity.caught === affinity.dropAt) {
        affinity.hasStone = true;
        message += "\nSomething shiny was stuck to the fish:\n an Affinity Stone!";
    }

    saveAffinity();
    showAffinity();
    return message;
}

document.getElementById("useStone").addEventListener("click", useStone);
document.getElementById("affinityClose").addEventListener("click", () => popup.style.display = "none");
slot.addEventListener("click", () => {
    if (document.getElementById("nextFish").disabled) return; 
    if (affinity.path.length === 0) {
        alert("You don't have an affinity yet.");
        return;
    }
    popup.style.display = "block";
});

showAffinity();