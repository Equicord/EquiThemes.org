import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { SERVER } from "@constants";

const redirect = `https://discord.com/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_AUTH_DISCORD_ID}&response_type=code&redirect_uri=${SERVER}/api/user/auth?callback={CALLBACK}&scope=connections%20identify`;

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const callback = (router.query?.callback as string) ?? "/auth/callback";
            const finalRedirect = redirect.replace("{CALLBACK}", encodeURIComponent(callback));

            router.replace(finalRedirect);
        }
    }, [router]);

    return (
        <>
            <Head>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <meta name="keywords" content="discord theme login, discord authentication, theme library login, discord themes account, secure discord themes" />
                <meta name="theme-color" content="#1a1b26" />
                <meta name="application-name" content="Theme Library" />
                <meta name="description" content="Sign in to Theme Library using your Discord account. Access and manage your Discord themes collection securely." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://themes.equicord.org/" />
                <meta property="og:title" content="Sign in with Discord | Theme Library" />
                <meta property="og:description" content="Connect your Discord account to access Theme Library. Browse, submit, and manage your Discord themes collection." />
                <title>Sign in with Discord | Theme Library</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="flex flex-col justify-center items-center min-h-screen px-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">Connecting to Discord</h2>
                        <p className="text-muted-foreground">Please wait while we redirect you to Discord for authentication...</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps() {
    // Ensure this page is always server-side rendered
    return { props: {} };
}
