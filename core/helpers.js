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

export function shortNumber(number) {
    const value = round1(number);
    if (Math.abs(value) < 1000) return formatNumber(value);
    const units = [["T", 1e12], ["B", 1e9], ["M", 1e6], ["K", 1e3]];
    for (const [unit, size] of units) {
        const amount = Math.abs(value) / size;
        if (amount < 1) continue;
        const shown = amount < 100 ? Math.floor(amount * 10) / 10 : Math.floor(amount);
        return (value < 0 ? "-" : "") + shown + unit;
    }
    return formatNumber(value);
}
