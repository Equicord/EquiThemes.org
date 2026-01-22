import { useEffect, useRef, useState } from "react";
import { ThemeCard } from "./card";
import { type Theme } from "@types";
import End from "@components/ui/end-of-page";

export function ThemeGrid({ themes = [], likedThemes = [], disableDownloads = false }: { themes?: Theme[]; likedThemes?: []; disableDownloads?: boolean }) {
    const [currentPage, setCurrentPage] = useState(1);
    const gridRef = useRef<HTMLDivElement>(null);
    const itemsPerPage = 12;
    const [displayedThemes, setDisplayedThemes] = useState<Theme[]>([]);
    const [hasMoreThemes, setHasMoreThemes] = useState(true);

    useEffect(() => {
        if (currentPage > Math.ceil(themes.length / itemsPerPage)) {
            setCurrentPage(1);
        } else {
            const newThemes = themes.slice(0, currentPage * itemsPerPage);
            setDisplayedThemes(newThemes);
            setHasMoreThemes(newThemes.length < themes.length);
        }
    }, [themes, currentPage]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && hasMoreThemes) {
                setCurrentPage((prevPage) => prevPage + 1);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [hasMoreThemes]);

    return (
        <div className="space-y-6" ref={gridRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedThemes.map((theme) => (
                    <ThemeCard key={theme.id} theme={theme} likedThemes={likedThemes} disableDownloads={disableDownloads} />
                ))}
            </div>
            {!hasMoreThemes && <End />}
        </div>
    );
}
