import { readFileSync, writeFileSync } from "fs";
import postcss from "postcss";
import mime from "mime";

const encodeToBase64 = (arrayBuffer, mimeType) => {
    const buffer = Buffer.from(arrayBuffer);
    return `url("data:${mimeType};base64,${buffer.toString("base64")}")`;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let cssContent = readFileSync("./styles.css", "utf-8");

const processCSS = async () => {
    const root = postcss.parse(cssContent);

    const assetPromises = [];

    root.walkRules((rule) => {
        rule.walkDecls((decl) => {
            const urlMatch = decl.value.match(/url\(["']?([^"')]+)["']?\)/);
            if (urlMatch) {
                const assetUrl = urlMatch[1];
                if (assetUrl.endsWith(".woff2")) {
                    decl.value = 'url("/fonts/gg sans Normal.ttf")';
                    console.log(`Replaced .woff2 URL with /fonts/gg sans Normal.ttf`);
                } else if (assetUrl.startsWith("/assets/")) {
                    const fullUrl = `https://discord.com${assetUrl}`;

                    const promise = (async () => {
                        await delay(2500);
                        try {
                            const response = await fetch(fullUrl);
                            if (!response.ok) {
                                return;
                            }
                            const arrayBuffer = await response.arrayBuffer();
                            const mimeType = response.headers.get("content-type") || mime.getType(assetUrl);
                            decl.value = encodeToBase64(arrayBuffer, mimeType);
                            console.log(`Replaced: ${assetUrl.slice(0, 15)}`);
                        } catch (error) {
                            console.error(error);
                        }
                    })();

                    assetPromises.push(promise);
                } else {
                    console.log(`Skipping: ${assetUrl.slice(0, 15)}`);
                }
            }
        });
    });

    await Promise.all(assetPromises);

    writeFileSync("./new-styles.css", root.toString());
};

processCSS().catch((err) => console.error(err));
