export function addText(box, text) {
    const line = document.createElement("div");
    line.textContent = text;
    box.appendChild(line);
}

export function addButton(box, label, action) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", action);
    box.appendChild(button);
    return button;
}

export function round1(number) {
    return Math.round(number * 10) / 10;
}

export function formatNumber(number) {
    return String(round1(number));
}

export function coinsText(amount) {
    return formatNumber(amount) + (round1(amount) === 1 ? " coin" : " coins");
}
