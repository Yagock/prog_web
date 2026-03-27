export function slugify(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function toRootPath(path) {
    const value = String(path || "").trim();
    if (!value) return "/";
    return value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
}

export function resolvePublicAsset(path) {
    const base = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
    const normalized = toRootPath(path);
    return `${base}${normalized}`;
}

export function asArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

export function money(value) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 0
    }).format(Number(value) || 0);
}

export function normalizeImagePath(path) {
    const value = String(path || "").trim();
    if (!value) return "/imagenes/Hotel4_mejorada.jpg";
    return toRootPath(value);
}
