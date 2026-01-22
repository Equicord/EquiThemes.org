"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@components/ui/carousel";
import { Card, CardContent } from "@components/ui/card";
import Autoplay from "embla-carousel-autoplay";
import { ThemeCard } from "./card";

interface Theme {
    id: string;
    name: string;
    release_date: string;
}

interface ThemeCarouselProps {
    themes?: Theme[];
}

export default function ThemeCarousel({ themes = [] }: ThemeCarouselProps) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const sortedThemes = useMemo(() => {
        return [...themes].sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()).slice(0, 10);
    }, [themes]);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className="w-full relative" ref={containerRef}>
            <Carousel
                plugins={isVisible ? [Autoplay({ delay: 5500 })] : []}
                opts={{
                    loop: true,
                    align: "start",
                    slidesToScroll: 1
                }}
                className="w-full"
            >
                <CarouselContent>
                    {sortedThemes.map((theme) => (
                        <CarouselItem key={theme.id} className="w-full sm:basis-full md:basis-1/2 md:pl-4">
                            <Card className="bg-transparent border border-muted">
                                <CardContent className="p-0">
                                    {/* @ts-ignore */}
                                    <ThemeCard theme={theme} noFooter diagonal lastUpdated />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
