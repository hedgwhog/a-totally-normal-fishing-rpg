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
