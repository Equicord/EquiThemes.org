import { createContext, useContext, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";

const WebContext = createContext(null);

const protectedRoutes = ["/theme/submit", "/theme/submitted"];
const adminRoutes = ["/theme/submitted/view", "/admin"];

export function AuthProvider({ children }) {
    const router = useRouter();
    const isAuthPath = router.pathname.startsWith("/auth");

    const {
        data: authData,
        error: authError,
        mutate,
        isLoading: authLoading
    } = useSWR(
        !isAuthPath ? "/api/user/isAuthed" : null,
        async () => {
            const res = await fetch("/api/user/isAuthed", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) return null;
            return res.json();
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: Infinity
        }
    );

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
        !isAuthPath ? "/api/themes?content=false" : null,
        async (url: string) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch themes");
            return res.json();
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
            revalidateOnReconnect: true
        }
    );

    const value = useMemo(
        () => ({
            authorizedUser: authData?.user,
            isAuthenticated: authData?.authenticated,
            isLoading: authLoading,
            error: authError || themesError,
            themes,
            themesLoading,
            mutate,
            mutateThemes
        }),
        [authData, authLoading, authError, themes, themesError, themesLoading, mutate, mutateThemes]
    );

    return <WebContext.Provider value={value}>{children}</WebContext.Provider>;
}

export const useWebContext = () => useContext(WebContext);
