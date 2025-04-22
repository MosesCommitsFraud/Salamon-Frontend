"use client";
import Image from "next/image";
import { useRef } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Optionaler Hook für smooth scrolling
import useLenis from "@/hooks/useLenis";

// Importiere die GlareCard-Komponente
import { GlareCard } from "@/components/ui/glare-card";

// Array mit den Bild-URLs (Yu‑Gi‑Oh‑Karten, jede Karte kommt nur einmal vor)
const images = [
    "https://images.ygoprodeck.com/images/cards/89631139.jpg", // Blue-Eyes White Dragon
    "https://images.ygoprodeck.com/images/cards/56532353.jpg",
    "https://images.ygoprodeck.com/images/cards/99940363.jpg",
    "https://images.ygoprodeck.com/images/cards/44508094.jpg",
    "https://images.ygoprodeck.com/images/cards/46986414.jpg", // Dark Magician
    "https://images.ygoprodeck.com/images/cards/74677422.jpg", // Red-Eyes Black Dragon
    "https://images.ygoprodeck.com/images/cards/70781052.jpg", // Summoned Skull
    "https://images.ygoprodeck.com/images/cards/33396948.jpg",  // Exodia the Forbidden One
    "https://images.ygoprodeck.com/images/cards/74677422.jpg", // Red-Eyes Black Dragon
    "https://images.ygoprodeck.com/images/cards/70781052.jpg", // Summoned Skull
    "https://images.ygoprodeck.com/images/cards/33396948.jpg", // Exodia the Forbidden One
    "https://images.ygoprodeck.com/images/cards/38033121.jpg", // Dark Magician Girl
    "https://images.ygoprodeck.com/images/cards/86538054.jpg", // Buster Blader
    "https://images.ygoprodeck.com/images/cards/5318639.jpg",  // Celtic Guardian
    "https://images.ygoprodeck.com/images/cards/55144522.jpg", // Pot of Greed
    "https://images.ygoprodeck.com/images/cards/16012157.jpg"  // Dark Hole

];

const PerspectiveGrid = () => {
    const grid = useRef<HTMLDivElement | null>(null);
    const gridWrap = useRef<HTMLDivElement | null>(null);

    const { contextSafe } = useGSAP();

    const applyAnimation = contextSafe(() => {
        if (!grid.current || !gridWrap.current) return;

        const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: ".grid_wrap",
                start: "top bottom+=5%",
                end: "bottom top-=5%",
                scrub: true,
                // markers: true, // Optional: zum Debuggen
            },
        });

        // Weniger extreme Perspektiven und Höhe, damit die Karten nicht zu lang erscheinen
        Object.assign(grid.current.style, {
            perspective: "2000px",
            height: "150%",
            width: "115%",
        });

        // Passe die Spaltenanzahl an die Anzahl der Karten an (hier 4 Spalten)
        Object.assign(gridWrap.current.style, {
            width: "105%",
            gridTemplateColumns: "repeat(4, minmax(4, 1fr))",
        });

        timeline
            .set(".grid_item", {
                transformOrigin: "50% 0%",
                z: () => gsap.utils.random(-4000, -2000),
                rotationX: () => gsap.utils.random(-45, -25),
                filter: "brightness(0%)",
            })
            .to(
                ".grid_item",
                {
                    xPercent: () => gsap.utils.random(-150, 150),
                    yPercent: () => gsap.utils.random(-300, 300),
                    rotationX: 0,
                    filter: "brightness(200%)",
                },
                0
            )
            .to(
                ".grid_wrap",
                {
                    z: 6500,
                },
                0
            )
            .fromTo(
                ".grid_item-inner",
                { scale: 1 },
                { scale: 0.95 },
                0
            );
    });

    // Aktiviere den Lenis Smooth-Scroll
    useLenis();

    useGSAP(
        () => {
            gsap.registerPlugin(ScrollTrigger);
            window.scrollTo({ top: 0 });
            applyAnimation();
        },
        { scope: grid.current!, dependencies: [] }
    );

    return (
        <div className="z-10 w-full">
            <div className="relative w-full py-[20vh]">
                <div
                    ref={grid}
                    className="grid w-full place-items-center"
                    style={{ perspective: "1200px" }} // wird in applyAnimation überschrieben
                >
                    <div
                        ref={gridWrap}
                        style={{ transformStyle: "preserve-3d" }}
                        className="grid_wrap grid h-auto w-full grid-cols-4 gap-[2vw]"
                    >
                        {images.map((src, index) => (
                            <div key={index} className="grid_item relative">
                                {/*
                  Die GlareCard besitzt bereits feste Dimensionen und das korrekte
                  Seitenverhältnis (z.B. per Tailwind-Klassen wie w-[320px] und [aspect-ratio:59/86]).
                  Die Klasse "grid_item-inner" wird von GSAP für die Skalierung genutzt.
                  Hier wird das Next‑Image direkt eingesetzt, sodass das Bild stets den
                  gesamten Kartenbereich ausfüllt und im gleichen Maßstab wie die Karte skaliert.
                */}
                                <GlareCard className="grid_item-inner">
                                    <Image
                                        src={src}
                                        alt="card image"
                                        fill                // Das Bild füllt den gesamten Raum der GlareCard aus
                                        objectFit="cover"    // Bild deckt den Container vollständig ab
                                    />
                                </GlareCard>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerspectiveGrid;
