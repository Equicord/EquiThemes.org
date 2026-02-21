export function ErrorHandler(handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (error) {
            console.error(error);
            res.status(500).json({
                status: 500,
                message: "Internal Server Error",
                error: error
            });
        }
    };
}