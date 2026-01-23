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

export const getStaticPaths: GetStaticPaths = async () => {
	const res = await fetch(
		"https://raw.githubusercontent.com/Equicord/EquiThemes.org/refs/heads/master/themes.json"
	);
	const themes = await res.json();

	const paths = themes.map((theme: Theme) => ({
		params: { id: String(theme.id) }
	}));

	return {
		paths,
		fallback: "blocking"
	};
};

export const getStaticProps = (async context => {
	const res = await fetch(
		"https://raw.githubusercontent.com/Equicord/EquiThemes.org/refs/heads/master/themes.json"
	);
	const themes = await res.json();
	return { props: { themes }, revalidate: 60 };
}) satisfies GetStaticProps<{
	themes: Theme[];
}>;

export default function ThemePage({
	themes
}: InferGetStaticPropsType<typeof getStaticProps>) {
	const router = useRouter();
	const { id } = router.query;

	let theme = themes.find(x => x.id == id);

	// try to get the theme name instead
	const validTheme =
		!theme && typeof id === "string"
			? themes.find(x => x.name.toLowerCase() === id.toLowerCase())
			: null;

	useEffect(() => {
		if (!id) return;

		if (validTheme) {
			router.replace(`/theme/${validTheme.id}`);
		} else if (!theme) {
			router.replace("/");
		}
	}, [id, theme, validTheme, router]);

  // prevent site crashing during redirect
	if (!theme) {
		return null;
	}

	return <App id={id as string} theme={theme} />;
}
