export async function showArt(element, path) {
    element.textContent = "";
    if (!path) return;
    try {
        const response = await fetch(path);
        if (response.ok) element.textContent = await response.text();
    } catch {
    }
}
