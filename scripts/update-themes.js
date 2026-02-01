#!/usr/bin/env node
const fs = require('fs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_URL = "https://themes.equicord.org/api/themes";
const RATE_LIMIT_DELAY = 500;

async function generatePermanentGitHubLink(url) {
    try {
        let match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/(?:blob|raw)\/([^\/]+)\/(.+)/);
        if (!match) return null;

        const [, user, repo, ref, path] = match;
        const commitApiUrl = `https://api.github.com/repos/${user}/${repo}/commits/${ref}`;

        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));

        const response = await fetch(commitApiUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'Discord-Themes-Updater'
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        return `https://raw.githubusercontent.com/${user}/${repo}/${data.sha}/${path}`;
    } catch {
        return null;
    }
}

async function fetchThemes() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);

        const themes = await response.json();
        const updatedThemes = [];
        const logTable = [];

        for (const theme of themes) {
            if (!theme.source || !theme.content) {
                updatedThemes.push(theme);
                logTable.push({ Name: theme.name || "Unnamed", Status: "Skipped (Missing Data)" });
                continue;
            }

            if (!theme.source.includes("github.com")) {
                updatedThemes.push(theme);
                logTable.push({ Name: theme.name, Status: "Skipped (Non-GitHub URL)" });
                continue;
            }

            const permanentLink = await generatePermanentGitHubLink(theme.source);
            if (!permanentLink) {
                updatedThemes.push(theme);
                logTable.push({ Name: theme.name, Status: "Failed (Invalid GitHub URL)" });
                continue;
            }

            try {
                const themeResponse = await fetch(permanentLink, {
                    headers: GITHUB_TOKEN ? {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'User-Agent': 'Discord-Themes-Updater'
                    } : {}
                });

                if (!themeResponse.ok) throw new Error(`Theme fetch failed: ${themeResponse.status}`);

                const newContent = await themeResponse.text();
                const oldContentDecoded = Buffer.from(theme.content, 'base64').toString('utf-8');
                const contentChanged = newContent !== oldContentDecoded;

                const updatedTheme = {
                    ...theme,
                    source: permanentLink,
                    content: Buffer.from(newContent, 'utf-8').toString('base64'),
                };

                if (contentChanged) updatedTheme.last_updated = new Date();
                updatedThemes.push(updatedTheme);
                logTable.push({ Name: theme.name, Status: contentChanged ? "Updated" : "No Changes" });
            } catch {
                updatedThemes.push(theme);
                logTable.push({ Name: theme.name, Status: "Error (Fetch Failed)" });
            }
        }

        fs.writeFileSync('themes.json', JSON.stringify(updatedThemes, null, 2));
        console.table(logTable);
    } catch (error) {
        console.error("Fatal error:", error.message);
    }
}

fetchThemes();