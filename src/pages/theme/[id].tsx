"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import type {
    GetStaticPaths,
    GetStaticProps,
    InferGetStaticPropsType
} from "next";
import App from "@components/page/theme-info";
import { type Theme, type ThemeListItem } from "@types";
import { SERVER } from "@constants";
import clientPromise, { THEMES_DB } from "@utils/db";

export const getStaticPaths: GetStaticPaths = async () => {
    const res = await fetch(`${SERVER}/api/themes?content=false`);
    const themesData: ThemeListItem[] = await res.json();

    const paths = themesData.map((theme) => ({
        params: { id: String(theme.id) }
    }));

    return {
        paths,
        fallback: "blocking"
    };
};

export const getStaticProps = (async (context) => {
    const { id } = context.params!;
    const idString = String(id);

    let theme: ThemeListItem | null = null;

    const client = await clientPromise;
    if (typeof client?.db === "function") {
        const db = client.db(THEMES_DB);
        const themesCollection = db.collection("themes");

        const query = /^\d+$/.test(idString)
            ? { id: Number(idString) }
            : { name: { $regex: new RegExp(`^${idString.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } };

        theme = (await themesCollection.findOne(query, { projection: { _id: 0 } })) as unknown as ThemeListItem | null;
    } else {
        const res = await fetch(`${SERVER}/api/themes?content=false`);
        const themesData: ThemeListItem[] = await res.json();
        theme = themesData.find((x) => String(x.id) === idString || x.name.toLowerCase() === idString.toLowerCase()) ?? null;

        if (theme) {
            const cssRes = await fetch(`${SERVER}/api/${theme.id}`);
            if (cssRes.ok) {
                theme.content = Buffer.from(await cssRes.text()).toString("base64");
            }
        }
    }

    if (!theme) {
        return { notFound: true };
    }

    return { props: { theme: JSON.parse(JSON.stringify(theme)) as Theme }, revalidate: 60 };
}) satisfies GetStaticProps<{
    theme: Theme;
}>;

export default function ThemePage({ theme }: InferGetStaticPropsType<typeof getStaticProps>) {
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (!id || !theme) return;

        if (String(theme.id) !== id) {
            router.replace(`/theme/${theme.id}`);
        }
    }, [id, theme, router]);

    if (!theme) {
        return null;
    }

    return <App id={String(theme.id)} theme={theme} />;
}
