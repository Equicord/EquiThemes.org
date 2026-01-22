import React from "react";
import { AuthProvider } from "@context/auth";
import ThemeProvider from "@components/theme-provider";
import blob from "/public/favicon.ico";
import Image from "next/image";
import "./theme.css";
import { Toaster } from "@components/ui/toaster";
import { AccountBar } from "@components/account-bar";
import { BanBanner } from "@components/ban-banner";
import Head from "next/head";
import { Analytics } from "@vercel/analytics/react";
import { SearchProvider, useSearch } from "@context/search";
import { SearchBar } from "@components/search-bar";

function App({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Head>
                <meta http-equiv="content-language" content="en" />
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <meta name="keywords" content="discord, theme, custom, discord themes, Vencord, equicord" />
                <meta name="theme-color" content="#1a1b26" />
                <meta name="application-name" content="Theme Library" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://themes.equicord.org/" />
                <title>Theme Library</title>
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/favicon.ico" />
            </Head>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <SearchProvider>
                    <div className="min-h-screen flex flex-col">
                        <Toaster />
                        <Analytics />
                        <Image unoptimized id="favicon" src={blob} alt="Blob" width={100} height={100} className="border-sm absolute mx-auto w-[80px] sm:w-[100px] h-auto rounded-lg select-none hidden pointer-events-none" />

                        <header className={`sticky top-0 z-50 border-b border-border bg-background` }>
                            <div className="container mx-auto px-4 lg:px-8">
                                <HeaderWithSearchInner />
                            </div>
                        </header>

                        <BanBanner />

                        <main className="flex-1">
                            <div className="container mx-auto px-4 lg:px-8 py-8 pb-28">
                                <Component {...pageProps} />
                            </div>
                        </main>

                        <footer className="fixed bottom-0 left-0 w-full z-40 bg-background border-t border-border select-none py-2">
                            <div className="container mx-auto px-2">
                                <div className="flex flex-col items-center gap-1">
                                    <p className="text-center text-xs text-muted-foreground">discord-themes(.com) is not affiliated with or endorsed by Discord Inc.</p>
                                    <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground">
                                        <a href="https://www.cloudflare.com" className="text-muted-foreground no-underline hover:text-foreground transition-colors duration-200 flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                                            Protected by Cloudflare
                                        </a>
                                        <div className="h-3 w-px bg-muted-foreground/60 sm:block hidden"></div>
                                        <span className="text-muted-foreground">hosted on a samsung fridge!</span>
                                        <div className="h-3 w-px bg-muted-foreground/60 sm:block hidden"></div>
                                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-muted-foreground no-underline hover:text-foreground transition-colors duration-200 flex items-center gap-2">
                                            Privacy Policy
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </SearchProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

function HeaderWithSearchInner() {
    const { searchQuery, setSearchQuery } = useSearch();

    return (
        <div>
            <div className="flex h-16 items-center gap-4">
                <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <Image src={blob} alt="Theme Library" width={32} height={32} className="rounded-lg" />
                    <span className="text-xl font-semibold tracking-tight">Theme Library</span>
                </a>

                <div className={`mx-auto w-full max-w-3xl`}>
                    <SearchBar value={searchQuery} onSearch={setSearchQuery} />
                </div>

                <div className="ml-auto">
                    <AccountBar className="flex items-center" />
                </div>
            </div>
        </div>
    );
}

export default App;
