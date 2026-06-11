"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import type {
    GetStaticPaths,
    GetStaticProps,
    InferGetStaticPropsType
} from "next";
import App from "@components/page/theme-info";
import { type Theme } from "@types";
import { SERVER } from "@constants";

export const getStaticPaths: GetStaticPaths = async () => {
    const res = await fetch(`${SERVER}/api/themes`);
    const themesData = await res.json();

    const paths = themesData.map((theme: any) => ({
        params: { id: String(theme.id) }
    }));

    return {
        paths,
        fallback: "blocking"
    };
};

export const getStaticProps = (async (context) => {
    const { id } = context.params!;
    const res = await fetch(`${SERVER}/api/themes?content=true`);
    const themesData = await res.json();

    const theme = themesData.find((x: any) => String(x.id) === id || x.name.toLowerCase() === (id as string).toLowerCase());

    if (!theme) {
        return { notFound: true };
    }

    return { props: { theme }, revalidate: 60 };
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
