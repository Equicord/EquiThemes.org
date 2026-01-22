import { createContext, useContext, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import { getCookie } from "@utils/cookies";

const WebContext = createContext(null);

const protectedRoutes = ["/theme/submit", "/theme/submitted"];
const adminRoutes = ["/theme/submitted/view", "/admin"];

export function AuthProvider({ children }) {
    const router = useRouter();
    const isAuthPath = router.pathname.startsWith("/auth");
    if (isAuthPath) console.log("%c[client/webcontext]", "color: #5865F2; background: #E5E5E5; padding: 4px 8px; border-radius: 4px;", "skipping auth check for path");

    const {
        data: authData,
        error: authError,
        mutate,
        isLoading: authLoading
    } = useSWR(
        !isAuthPath ? "/api/user/isAuthed" : null,
        async () => {
            const token = getCookie("_dtoken");
            if (!token) return null;

            const res = await fetch("/api/user/isAuthed", {
                method: "GET",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: Infinity
        }
    );

    if (authData) console.log("%c[server/auth]", "color: #5865F2; background: #E5E5E5; padding: 4px 8px; border-radius: 4px;", authData);

    useEffect(() => {
        const isProtectedRoute = protectedRoutes.some((route) => router.pathname.startsWith(route));
        const isAdminRoute = adminRoutes.some((route) => router.pathname.startsWith(route));

        if (isAdminRoute && !authLoading && !authData?.user?.admin) {
            console.log("%c[client/webcontext]", "color: #5865F2; background: #E5E5E5; padding: 4px 8px; border-radius: 4px;", "redirecting to /");
            router.push("/");
        }
        if (isProtectedRoute && !authLoading && !authData?.authenticated) {
            console.log("%c[client/webcontext]", "color: #5865F2; background: #E5E5E5; padding: 4px 8px; border-radius: 4px;", "redirecting to /auth/login");
            router.push("/auth/login");
        }
    }, [router, authData, authLoading]);

    const {
        data: themes,
        error: themesError,
        isLoading: themesLoading,
        mutate: mutateThemes
    } = useSWR(
        !isAuthPath ? "/api/themes" : null,
        async () => {
            const res = await fetch("/api/themes");
            if (!res.ok) throw new Error("Failed to fetch themes");
            return res.json();
        },
        {
            revalidateOnFocus: true,
            dedupingInterval: 0,
            revalidateOnReconnect: true
        }
    );

    if (themes) console.log("%c[client/fetch]", "color: #5865F2; background: #E5E5E5; padding: 4px 8px; border-radius: 4px;", "themes fetched");

    return (
        <WebContext.Provider
            value={{
                authorizedUser: authData?.user,
                isAuthenticated: authData?.authenticated,
                isLoading: authLoading || themesLoading,
                error: authError || themesError,
                themes,
                mutate,
                mutateThemes
            }}
        >
            {children}
        </WebContext.Provider>
    );
}

export const useWebContext = () => useContext(WebContext);
