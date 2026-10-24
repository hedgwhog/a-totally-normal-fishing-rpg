function find(popup) {
    return typeof popup === "string" ? document.getElementById(popup) : popup;
}

export function closeAllPopups() {
    document.querySelectorAll(".popup").forEach(popup => popup.style.display = "none");
}

export function openPopup(popup) {
    const element = find(popup);
    closeAllPopups();
    element.style.display = element.dataset.display || "block";
}

export function closePopup(popup) {
    find(popup).style.display = "none";
}

document.addEventListener("click", event => {
    const opener = event.target.closest("[data-open]");
    if (opener) openPopup(opener.dataset.open);

    const closer = event.target.closest("[data-close]");
    if (closer) closePopup(closer.dataset.close);
});
