"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@components/ui/carousel";
import { Card, CardContent } from "@components/ui/card";
import Autoplay from "embla-carousel-autoplay";
import { ThemeCard } from "./card";
import { type Theme } from "@types";

interface ThemeCarouselProps {
    themes?: Theme[];
}

export default function ThemeCarousel({ themes = [] }: ThemeCarouselProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [api, setApi] = useState<CarouselApi>();
    const containerRef = useRef<HTMLDivElement>(null);
    const autoplayRef = useRef<ReturnType<typeof Autoplay> | null>(null);
    const isVisibleRef = useRef(false);

    if (!autoplayRef.current) {
        autoplayRef.current = Autoplay({ delay: 5500, playOnInit: false });
    }

    const plugins = useMemo(() => [autoplayRef.current!], []);

    const sortedThemes = useMemo(() => {
        return [...themes].sort((a, b) => new Date(b.last_updated ?? b.release_date).getTime() - new Date(a.last_updated ?? a.release_date).getTime()).slice(0, 10);
    }, [themes]);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        isVisibleRef.current = isVisible;

        const autoplay = autoplayRef.current;
        if (!autoplay) return;

        if (isVisible) {
            autoplay.play();
        } else {
            autoplay.stop();
        }
    }, [isVisible]);

    useEffect(() => {
        if (!api) return;

        // embla re-creates plugin state on reInit (e.g. window resize), which
        // leaves autoplay stopped — re-assert the desired play state.
        const onReInit = () => {
            const autoplay = autoplayRef.current;
            if (!autoplay) return;

            if (isVisibleRef.current) {
                autoplay.play();
            } else {
                autoplay.stop();
            }
        };

        api.on("reInit", onReInit);
        return () => {
            api.off("reInit", onReInit);
        };
    }, [api]);

    return (
        <div className="w-full relative" ref={containerRef}>
            <Carousel
                setApi={setApi}
                plugins={plugins}
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
                                    <ThemeCard theme={theme} likedThemes={null} noFooter diagonal />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
