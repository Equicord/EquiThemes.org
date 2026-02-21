export default function handler(req, res) {
    if (req.method === "POST") {
        const { message, stack, info } = req.body;

        console.error("Client Error Logged via API:", message);
        if (stack) console.error(stack);
        if (info) console.error(info);

        res.status(200).json({ status: "ok" });
    } else {
        res.status(405).end();
    }
}