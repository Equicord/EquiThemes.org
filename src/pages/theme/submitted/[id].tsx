"use client";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const CONFETTI_COLORS = ["#FFC700", "#FF0000", "#2BD115", "#2B86C5", "#FF00FF", "#FF7C00"];

const Confetti = () => {
    const pieces = useMemo(
        () =>
            [...Array(100)].map(() => ({
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                width: `${Math.random() * 8 + 5}px`,
                height: `${Math.random() * 8 + 5}px`,
                backgroundColor: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                opacity: Math.random() * 0.6 + 0.4,
                animationDelay: `${Math.random() * 2}s`
            })),
        []
    );

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {pieces.map((piece, i) => (
                <div
                    key={i}
                    className="absolute animate-confetti-fall"
                    style={{
                        top: "-10px",
                        ...piece
                    }}
                />
            ))}
        </div>
    );
};

export default function SuccessFullSubmitted() {
    const router = useRouter();
    const { id } = router.query;
    const [showConfetti, setShowConfetti] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const confettiTimer = setTimeout(() => {
            setShowConfetti(false);
            router.push("/");
        }, 5000);

        return () => {
            clearTimeout(confettiTimer);
        };
    }, [id, router]);

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto px-4 py-3 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold text-center">Submitted your Theme!</h1>
                <p className="text-lg mt-2 text-center max-w-2xl">Your theme has been successfully submitted to the Theme Library.</p>
                <p className="text-lg mt-2 text-center max-w-2xl">Review can take up to 12 hours! Check back later.</p>
            </main>

            <footer className="container mx-auto px-4 py-3 text-xs text-center text-muted-foreground">{id}</footer>

            {mounted && showConfetti && <Confetti />}
        </div>
    );
}
