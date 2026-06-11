import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AuthCallback() {
    const [redirected, setRedirected] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const redirectUrl = localStorage.getItem("redirect");
        if (redirectUrl && typeof redirectUrl === "string") {
            router.replace(redirectUrl);
            localStorage.removeItem("redirect");
            setRedirected(true);
        } else {
            if (!redirected) router.replace("/");
            setRedirected(true);
        }
    }, [redirected, router]);

    return (
        <div className="flex flex-col justify-center items-center min-h-screen px-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Authentication Complete</h2>
                    <p className="text-muted-foreground">Welcome! Redirecting you back to the app...</p>
                </div>
            </div>
        </div>
    );
}

export async function getServerSideProps() {
    return { props: {} };
}
