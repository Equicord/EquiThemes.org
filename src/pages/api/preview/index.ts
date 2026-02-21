"use cache";

import { readFileSync } from "fs";
import { join } from "path";
import type { NextApiRequest, NextApiResponse } from "next";
import { ErrorHandler } from "@lib/errorHandler";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const { url, theme } = req.query;
    const filePath = join(process.cwd(), "public", "preview", "index.html");
    let htmlContent = readFileSync(filePath, "utf8");

    const themeClassMap = {
        light: "platform-web theme-light images-light density-cozy font-size-16 has-webkit-scrollbar full-motion visual-refresh mana-toggle-inputs",
        ash: "platform-web theme-dark images-dark density-cozy font-size-16 has-webkit-scrollbar full-motion visual-refresh mana-toggle-inputs",
        dark: "platform-web theme-dark theme-darker images-dark density-cozy font-size-16 has-webkit-scrollbar mouse-mode full-motion app-focused visual-refresh mana-toggle-inputs",
        onyx: "platform-web theme-dark theme-midnight images-dark density-cozy font-size-16 has-webkit-scrollbar full-motion visual-refresh mana-toggle-inputs",
    };

    const themeType = typeof theme === "string" && themeClassMap[theme] ? theme : "dark";
    const initialClassTags = themeClassMap[themeType];

    const toolbarHTML = `
    <div id="theme-toolbar" class="theme-toolbar dark">
        <div class="toolbar-slide">
            <div class="toolbar-content">
                <button id="theme-toggle" class="theme-toggle">Light Mode</button>
                <span class="theme-help">
                    Nothing changing? The theme might not <br /> support both modes!
                </span>
            </div>
            <div class="toolbar-footer">
                <span class="theme-disclaimer">
                    themes.equicord.org is not affiliated or endorsed by Discord Inc.
                </span>
            </div>
        </div>
    </div>

    <style>
        .theme-toolbar {
            position: fixed;
            bottom: 82px;
            right: 0;
            display: flex;
            flex-direction: column;
            max-width: 100vw;
        }

        .toolbar-slide {
            position: relative;
            transform: translateX(calc(100% - 24px));
            transition: transform 0.3s ease;
            background: rgba(0,0,0,0.85);
            padding: 8px 24px 8px 8px;
            border-radius: 4px 0 0 4px;
            box-shadow: -2px 2px 8px rgba(0,0,0,0.2);
            pointer-events: auto;
            max-width: calc(100vw - 24px);
            overflow: hidden;
        }

        .toolbar-arrow {
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 14px;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }

        .theme-toolbar.light .toolbar-arrow {
            color: black;
        }

        .theme-toolbar:hover .toolbar-slide {
            transform: translateX(0);
        }

        .theme-toolbar:hover .toolbar-arrow {
            opacity: 0;
        }

        .theme-toolbar.dark .toolbar-slide {
            background: rgba(0,0,0,0.85);
            color: white;
        }

        .theme-toolbar.ash .toolbar-slide {
            background: rgba(0,0,0,0.85);
            color: white;
        }
        
        .theme-toolbar.onyx .toolbar-slide {
            background: rgba(0,0,0,0.85);
            color: white;
        }

        .theme-toolbar.light .toolbar-slide {
            background: rgba(255,255,255,0.95);
            color: black;
        }

        .toolbar-content {
            display: flex;
            align-items: center;
            gap: 12px;
            white-space: nowrap;
        }

        .theme-help {
            font-size: 11px;
            opacity: 0.9;
            line-height: 1.2;
            max-width: 240px;
        }

        .theme-toggle {
            cursor: pointer;
            pointer-events: auto;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 14px;
            transition: all 0.2s ease;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            white-space: nowrap;
        }

        .theme-toggle.dark {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
        }

        .theme-toggle.light {
            background: rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.2);
            color: black;
        }

        .theme-toggle:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .theme-toggle.dark:hover {
            background: rgba(255,255,255,0.2);
        }

        .theme-toggle.light:hover {
            background: rgba(0,0,0,0.2);
        }

        .toolbar-footer {
            padding: 4px 8px;
            text-align: right;
            margin-top: 4px;
        }

        .theme-disclaimer {
            font-size: 8px;
            opacity: 0.7;
            line-height: 1.2;
            display: block;
        }
    </style>
    </style>
    <script type="module">
        const toolbar = document.getElementById('theme-toolbar');
        const toggle = document.getElementById('theme-toggle');
        const themeClassMap = JSON.parse('${JSON.stringify(themeClassMap)}');
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
    htmlContent = htmlContent.replace("</body>", `${toolbarHTML}</body>`);

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(htmlContent);
}

export default ErrorHandler(GET);