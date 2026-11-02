// Small building blocks for the shops of the Pantry Isles (they all live in the shared panel, core/panel.js)
import { addButton } from "../../core/helpers.js";

export function addCategory(box, title) {
    const header = document.createElement("p");
    header.className = "marketCategory";
    header.textContent = title;
    box.appendChild(header);
}

export function addNote(box, text) {
    const note = document.createElement("p");
    note.className = "marketNote";
    note.textContent = text;
    box.appendChild(note);
}

// a row with - amount + and a buy button. amounts = { id: amount } kept by the shop, redraw() draws the shop again.
export function addAmountRow(box, { label, id, amounts, redraw, buyLabel, onBuy }) {
    const amount = amounts[id] || 0;
    const row = document.createElement("div");
    row.className = "supplyRow";
    row.textContent = label;
    const controls = document.createElement("div");
    controls.className = "supplyControls";
    addButton(controls, "-", () => { amounts[id] = Math.max(0, amount - 1); redraw(); });
    controls.append(" " + amount + " ");
    addButton(controls, "+", () => { amounts[id] = amount + 1; redraw(); });
    addButton(controls, buyLabel(amount), () => onBuy(amount));
    row.appendChild(controls);
    box.appendChild(row);
}
