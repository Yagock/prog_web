export function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

export function writeStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

export async function fetchSeed(url, fallback) {
    try {
        const response = await fetch(url);
        if (!response.ok) return fallback;
        return await response.json();
    } catch (error) {
        return fallback;
    }
}
