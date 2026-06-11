import React from "react";
import App from "@components/page/theme";
import Head from "next/head";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { type Theme } from "@types";

import { SERVER } from "@constants";

export const getStaticProps = (async () => {
    try {
        const res = await fetch(`${SERVER}/api/themes?content=false`);
        if (!res.ok) return { props: { themes: [] }, revalidate: 60 };

        const themes = await res.json();
        if (!Array.isArray(themes)) return { props: { themes: [] }, revalidate: 60 };

        return { props: { themes }, revalidate: 60 };
    } catch {
        return { props: { themes: [] }, revalidate: 60 };
    }
}) satisfies GetStaticProps<{
    themes: Theme[];
}>;

export default function ThemePage({ themes }: InferGetStaticPropsType<typeof getStaticProps>) {
    return (
        <div>
            <Head>
                <meta property="og:title" content="ThemeLibrary" key="og-title" />
                <meta property="og:description" content="Find your favourite themes for Equicord or Vencord all at one place." key="og-description" />
                <title>Theme Library</title>
                <meta name="description" content="Find your favourite themes for Equicord or Vencord all at one place." key="description" />
            </Head>
            <App themes={themes} />
        </div>
    );
}
