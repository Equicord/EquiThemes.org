"use cache";

import { readFileSync } from "fs";
import { join } from "path";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const { url, theme } = req.query;
    const filePath = join(process.cwd(), "public", "preview", "index.html");
    let htmlContent = readFileSync(filePath, "utf8");

    const themeClassMap = {
        light: "platform-win theme-light images-light density-default font-size-16 has-webkit-scrollbar mouse-mode full-motion app-focused visual-refresh",
        dark: "platform-win theme-dark images-dark density-default font-size-16 has-webkit-scrollbar mouse-mode full-motion app-focused visual-refresh",
        ash: "platform-win theme-dark theme-darker images-dark density-default font-size-16 has-webkit-scrollbar mouse-mode full-motion app-focused visual-refresh",
        onyx: "platform-win theme-dark theme-midnight images-dark density-default font-size-16 has-webkit-scrollbar mouse-mode full-motion app-focused visual-refresh",
    };

    const themeTypes = Object.keys(themeClassMap);
    const themeType = typeof theme === "string" && themeClassMap[theme] ? theme : "dark";
    const initialClassTags = themeClassMap[themeType];
    const initialThemeIdx = themeTypes.indexOf(themeType);

    const script = `
    <script type="module">
        const toolbar = document.getElementById('theme-toolbar');
        const toggle = document.getElementById('theme-toggle');
        const themeClassMap = JSON.parse(\`'+JSON.stringify(themeClassMap)+'\`);
        const themeTypes = Object.keys(themeClassMap);
        let currentThemeIdx = themeTypes.indexOf('${themeType}');
        function setTheme(idx) {
            const theme = themeTypes[idx];
            document.documentElement.className = themeClassMap[theme];
            toolbar.className = 'theme-toolbar ' + theme;
            toggle.className = 'theme-toggle ' + theme;
            const nextIdx = (idx + 1) % themeTypes.length;
            toggle.textContent = themeTypes[nextIdx].charAt(0).toUpperCase() + themeTypes[nextIdx].slice(1) + ' Mode';
        }
        setTheme(currentThemeIdx);
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            currentThemeIdx = (currentThemeIdx + 1) % themeTypes.length;
            setTheme(currentThemeIdx);
        });
    </script>
`;

    const escapeHtml = (unsafe: string): string => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    if (url) {
        const sanitizedUrl = escapeHtml(decodeURIComponent(url as any as string));
        const linkTag = `<link rel="stylesheet" href="${sanitizedUrl}">`;
        htmlContent = htmlContent.replace("<!--injectSpace-->", linkTag);
    }

    htmlContent = htmlContent.replace('<html', `<html class="${initialClassTags}"`);
    htmlContent = htmlContent.replace("</body>", `${script}</body>`);

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(htmlContent);
}
