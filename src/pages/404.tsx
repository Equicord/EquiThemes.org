import { Button } from "@components/ui/button";
import { useEffect } from "react";

const ScreamsOfTheDoomed = () => {
    useEffect(() => {
        const favicon = document.getElementById("favicon");
        let x = 0;
        let y = 0;
        let dx = 2;
        let dy = 2;
        const faviconSize = 100;
        favicon.classList.remove("hidden");
        const moveFavicon = () => {
            x += dx;
            y += dy;
            if (x + faviconSize > window.innerWidth) {
                x = window.innerWidth - faviconSize;
                dx = -dx;
            } else if (x < 0) {
                x = 0;
                dx = -dx;
            }
            if (y + faviconSize > window.innerHeight) {
                y = window.innerHeight - faviconSize;
                dy = -dy;
            } else if (y < 0) {
                y = 0;
                dy = -dy;
            }
            favicon.style.transform = `translate(${x}px, ${y}px)`;
            requestAnimationFrame(moveFavicon);
        };
        moveFavicon();
    }, []);

    return (
        <>
            <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
                <div className="max-w-lg w-full text-center space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight">404</h1>
                        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">Page Not Found</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
                            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => {
                                window.location.href = "/";
                            }}
                            className="px-8"
                        >
                            Go Home
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="px-8"
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            </main>
        </>
    );
};

export default ScreamsOfTheDoomed;
