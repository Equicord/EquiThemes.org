export function getCookie(name: string): string | undefined {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) {
        const raw = parts.pop()?.split(";").shift();
        if (raw === undefined) return undefined;
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    }
}

export function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function setCookie(name: string, value: string, days?: number) {
    const expires = days ? `expires=${new Date(Date.now() + days * 864e5).toUTCString()};` : "";
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires} path=/; SameSite=Lax${secure}`;
}
