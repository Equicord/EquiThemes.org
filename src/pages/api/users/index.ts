import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@utils/db";
import { Collection } from "mongodb";
import { type Theme } from "@types";
import { ErrorHandler } from "@lib/errorHandler";

async function GET(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") {
		return res
			.status(405)
			.json({ message: "Method not allowed", wants: "GET" });
	}

	const { userString } = req.query;
	const { authorization } = req.headers;

	if (!authorization) {
		return res.status(400).json({
			message: "Cannot check authorization without unique token"
		});
	}

	const token = authorization.replace("Bearer ", "").trim();

	if (!token) {
		return res.status(400).json({
			message: "Cannot revoke authorization without unique token"
		});
	}

	if (!userString) {
		return res.status(400).json({
			message: "Cannot revoke authorization without user id"
		});
	}

	const client = await clientPromise;
	const db = client.db("themesDatabase");
	const users = db.collection("users");
	const themes: Collection<Theme> = db.collection("themes");

	const requester = await users.findOne({ "user.key": token });

	if (!requester) {
		return res
			.status(401)
			.json({ message: "Unauthorized - Invalid token" });
	}

	if (!requester.user.admin) {
		return res.status(403).json({
			message: "Unauthorized - Insufficient permissions"
		});
	}

	const user = await users.findOne({
		$or: [{ "user.id": userString }, { "user.username": userString }]
	});

	if (!user) {
		return res.status(404).json({ message: "User not found" });
	}

	let discordData = null;
	try {
		const discordResponse = await fetch(
			`https://discord.com/api/v10/users/${user.user.id}`,
			{
				headers: {
					Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
				}
			}
		);

		if (!discordResponse.ok) {
			console.error(
				"Failed to fetch Discord data:",
				discordResponse.statusText
			);
		} else {
			discordData = await discordResponse.json();
		}
	} catch (error) {
		console.error(error);
	}

	// remove key data
	delete user.key;
	delete user.keyVersion;

	return res.status(200).json({
		status: 200,
		authorized: false,
		user: user,
		discord: discordData
	});
}

export default ErrorHandler(GET);