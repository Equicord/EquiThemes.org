import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeCard } from "./card";
import { type LikesData, type Theme } from "@types";
import End from "@components/ui/end-of-page";

export function ThemeGrid({ themes = [], likedThemes = null, disableDownloads = false }: { themes?: Theme[]; likedThemes?: LikesData | null; disableDownloads?: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const gridRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const itemsPerPage = 12;

    useEffect(() => {
        setCurrentPage(1);
    }, [themes]);

    const displayedThemes = useMemo(() => themes.slice(0, currentPage * itemsPerPage), [themes, currentPage]);
    const hasMoreThemes = useMemo(() => displayedThemes.length < themes.length, [displayedThemes, themes]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMoreThemes) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setCurrentPage((prevPage) => prevPage + 1);
                }
            },
            { rootMargin: "500px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMoreThemes, currentPage]);

    return (
        <div className="space-y-6" ref={gridRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedThemes.map((theme) => (
                    <ThemeCard key={theme.id} theme={theme} likedThemes={likedThemes} disableDownloads={disableDownloads} />
                ))}
            </div>
            {hasMoreThemes && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}
            {!hasMoreThemes && <End />}
        </div>
    );
}
