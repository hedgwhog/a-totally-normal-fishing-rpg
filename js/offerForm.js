import { findItem } from "./data/items.js";

export function showOfferForm(box, inventory, offer, onSend) {
    box.innerHTML = "";
    const inputs = {};

    function addInput(label, key, max, step) {
        const row = document.createElement("label");
        row.className = "row";
        row.textContent = label + " (you have " + max + ")";
        const input = document.createElement("input");
        input.type = "number";
        input.min = 0;
        input.max = max;
        input.step = step;
        input.style.width = "70px";
        input.value = key in offer ? offer[key] : (offer.items[key] || 0);
        row.appendChild(input);
        box.appendChild(row);
        inputs[key] = input;
    }

    addInput("Coins", "coins", inventory.coins, 0.1);
    addInput("Resonance", "resonance", inventory.resonance, 0.1);
    for (const [id, amount] of Object.entries(inventory.items)) addInput(findItem(id).name, id, amount, 1);

    const send = document.createElement("button");
    send.textContent = "Set my offer";
    send.addEventListener("click", () => {
        const items = {};
        for (const id of Object.keys(inventory.items)) items[id] = Number(inputs[id].value) || 0;
        onSend({ coins: Number(inputs.coins.value) || 0, resonance: Number(inputs.resonance.value) || 0, items });
    });
    box.appendChild(send);
}

export function offerText(offer) {
    const parts = [];
    if (offer.coins) parts.push(offer.coins + " coins");
    if (offer.resonance) parts.push(offer.resonance + " resonance");
    for (const [id, amount] of Object.entries(offer.items || {})) parts.push(amount + " " + findItem(id).name);
    return parts.length ? parts.join(", ") : "nothing";
}
