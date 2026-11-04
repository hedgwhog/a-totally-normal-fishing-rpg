// The box under the start screen with the Privacy Policy, Terms of Service and Rules.
// The bar on top switches between them. The texts come from the pages in public/ (privacy.html, terms.html, rules.html),
// so there's only one copy of each, and they also work on their own as a web page.
const box = document.getElementById("legalBox");
const content = document.getElementById("legalContent");
const pages = { privacy: "privacy.html", terms: "terms.html", rules: "rules.html" };
const loaded = {};
let current = null;

async function load(name) {
    if (loaded[name]) return loaded[name];
    try {
        const response = await fetch(pages[name], { cache: "no-cache" });
        const page = new DOMParser().parseFromString(await response.text(), "text/html");
        page.querySelectorAll("nav, script, style, link").forEach(element => element.remove());
        loaded[name] = page.body;
    } catch {
        const fallback = document.createElement("div");
        fallback.textContent = "Couldn't load this. Check your internet, or open " + pages[name] + ".";
        loaded[name] = fallback;
    }
    return loaded[name];
}

export async function showLegal(name) {
    if (!pages[name] || !content) return;
    current = name;
    box.querySelectorAll(".legalTabs [data-legal]").forEach(tab => tab.classList.toggle("active", tab.dataset.legal === name));
    const body = await load(name);
    if (current !== name) return; // another tab was clicked while loading
    content.replaceChildren(...[...body.childNodes].map(node => node.cloneNode(true)));
    content.scrollTop = 0;
}

// every link to one of the pages (the bar, the texts themselves, the sign-up form) switches the box instead of opening it
document.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link || !document.getElementById("startScreen")?.contains(link)) return;
    const name = link.dataset.legal || Object.keys(pages).find(key => link.getAttribute("href") === pages[key]);
    if (!name) return;
    event.preventDefault();
    showLegal(name);
    box.scrollIntoView({ block: "nearest" });
});

if (box) showLegal("privacy");
