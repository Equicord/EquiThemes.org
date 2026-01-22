const DISCORD_API = "https://discord.com/api/v10";

interface GuildInfo {
    name: string;
    snowflake: string;
    invite_link: string;
    avatar_hash: string;
}

export async function validateInvite(inviteCode: string): Promise<GuildInfo | null> {
    const code = inviteCode.replace(/^(https?:\/\/)?(discord\.gg\/|discord\.com\/invite\/)/i, "");

    try {
        const response = await fetch(`${DISCORD_API}/invites/${code}?with_counts=false&with_expiration=false`, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return {
            name: data.guild.name,
            snowflake: data.guild.id,
            invite_link: `https://discord.gg/${code}`,
            avatar_hash: data.guild.icon
        };
    } catch (error) {
        console.error("Failed to validate Discord invite:", error);
        return null;
    }
}
