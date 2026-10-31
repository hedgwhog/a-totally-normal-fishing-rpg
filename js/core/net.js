export function getToken() {
    return localStorage.getItem("authToken");
}

export function setToken(token) {
    if (token) localStorage.setItem("authToken", token);
    else localStorage.removeItem("authToken");
}

export async function api(path, body = null) {
    try {
        const response = await fetch(path, {
            method: body ? "POST" : "GET",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (getToken() || "") },
            body: body ? JSON.stringify(body) : undefined,
        });
        return await response.json();
    } catch {
        return { error: "Can't reach the server. Check your internet and try again." };
    }
}

export function connect(kind, options = {}) {
    const auth = {
        token: getToken(),
        kind: kind,
        slot: options.slot || null,
        sessionId: options.sessionId || "",
    };
    return window.io({ auth: auth });
}
