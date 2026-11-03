// Finds a popup window by id, and builds it when the page doesn't have it (an older game.html, from a cache
// or an upload that missed it). html = the inside of the window. The window goes in the game's #container.
export function ensurePopup(id, html, className = "popup bigPopup") {
    let popup = document.getElementById(id);
    if (popup) return popup;
    console.warn("game.html has no #" + id + ", it's built by the script. Is game.html up to date on the server?");
    popup = document.createElement("div");
    popup.id = id;
    popup.className = className;
    popup.innerHTML = html;
    (document.getElementById("container") || document.body).appendChild(popup);
    return popup;
}

function find(popup) {
    return typeof popup === "string" ? document.getElementById(popup) : popup;
}

export function closeAllPopups() {
    document.querySelectorAll(".popup").forEach(popup => popup.style.display = "none");
}

export function openPopup(popup) {
    const element = find(popup);
    closeAllPopups();
    let display = "block";
    if (element.classList.contains("bigPopup")) display = "flex";
    if (element.dataset.display) display = element.dataset.display;
    element.style.display = display;
}

export function closePopup(popup) {
    find(popup).style.display = "none";
}

function showBag(id) {
    document.querySelectorAll(".bagTabs button").forEach(tab => tab.classList.toggle("activeTab", tab.dataset.bag === id));
    document.querySelectorAll(".bagPane").forEach(pane => pane.classList.toggle("activePane", pane.id === id));
}
document.querySelectorAll(".bagTabs button").forEach(tab => tab.addEventListener("click", () => showBag(tab.dataset.bag)));
showBag("fishPane");

document.addEventListener("click", event => {
    const opener = event.target.closest("[data-open]");
    if (opener) openPopup(opener.dataset.open);

    const closer = event.target.closest("[data-close]");
    if (closer) closePopup(closer.dataset.close);
});
