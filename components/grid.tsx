"use client";
import Image from "next/image";
import { useRef } from "react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import useLenis from "@/hooks/useLenis";
import { GlareCard } from "@/components/ui/glare-card";

// Array mit den Bild-URLs (Yu‑Gi‑Oh‑Karten, jede Karte erscheint nur einmal)
const images = [
    "https://images.ygoprodeck.com/images/cards/89631139.jpg", // Blue-Eyes White Dragon
    "https://images.ygoprodeck.com/images/cards/56532353.jpg",
    "https://images.ygoprodeck.com/images/cards/99940363.jpg",
    "https://images.ygoprodeck.com/images/cards/44508094.jpg",
    "https://images.ygoprodeck.com/images/cards/46986414.jpg", // Dark Magician
    "https://images.ygoprodeck.com/images/cards/74677422.jpg", // Red-Eyes Black Dragon
    "https://images.ygoprodeck.com/images/cards/70781052.jpg", // Summoned Skull
    "https://images.ygoprodeck.com/images/cards/33396948.jpg", // Exodia the Forbidden One
    "https://images.ygoprodeck.com/images/cards/74677422.jpg", // Red-Eyes Black Dragon
    "https://images.ygoprodeck.com/images/cards/70781052.jpg", // Summoned Skull
    "https://images.ygoprodeck.com/images/cards/33396948.jpg", // Exodia the Forbidden One
    "https://images.ygoprodeck.com/images/cards/38033121.jpg", // Dark Magician Girl
    "https://images.ygoprodeck.com/images/cards/86538054.jpg", // Buster Blader
    "https://images.ygoprodeck.com/images/cards/5318639.jpg",  // Celtic Guardian
    "https://images.ygoprodeck.com/images/cards/55144522.jpg", // Pot of Greed
    "https://images.ygoprodeck.com/images/cards/16012157.jpg"  // Dark Hole
];

// Komponente, die den animierten Hintergrund realisiert
const PerspectiveGrid = () => {
    const grid = useRef<HTMLDivElement | null>(null);
    const gridWrap = useRef<HTMLDivElement | null>(null);
    const { contextSafe } = useGSAP();

    const applyAnimation = contextSafe(() => {
        if (!grid.current || !gridWrap.current) return;

        // Timeline, die automatisch abläuft – mit einer Standard-Dauer von 3 Sekunden pro Tween.
        const timeline = gsap.timeline({
            defaults: { ease: "none", duration: 3 }
        });

        // Container-Stile anpassen: Perspektive und Größe
        Object.assign(grid.current.style, {
            perspective: "2000px",
            height: "150%",
            width: "115%"
        });
        Object.assign(gridWrap.current.style, {
            width: "105%",
            gridTemplateColumns: "repeat(4, minmax(4, 1fr))"
        });

        // GSAP-Animation – exakt wie zuvor:
        timeline
            .set(".grid_item", {
                transformOrigin: "50% 0%",
                z: () => gsap.utils.random(-4000, -2000),
                rotationX: () => gsap.utils.random(-45, -25),
                filter: "brightness(0%)"
            })
            .to(
                ".grid_item",
                {
                    xPercent: () => gsap.utils.random(-150, 150),
                    yPercent: () => gsap.utils.random(-300, 300),
                    rotationX: 0,
                    filter: "brightness(200%)"
                },
                0
            )
            // Gleichzeitig wird das Wrapper-Element animiert:
            .to(".grid_wrap", { z: 6500 }, "<")
            // Leichte Skalierung der inneren Karten (GlareCard) von 100% auf 95%
            .fromTo(".grid_item-inner", { scale: 1 }, { scale: 0.95 }, "<");
    });

    // Optionaler Lenis-Smooth-Scroll (falls weiterhin erwünscht)
    useLenis();

    // Animation startet automatisch beim Mounten
    useGSAP(() => {
        window.scrollTo({ top: 0 });
        applyAnimation();
    }, { scope: grid.current, dependencies: [] });

    return (
        // Absolut positionierter Container, der den gesamten Hintergrund einnimmt
        <div ref={grid} className="absolute inset-0 z-0">
            <div
                ref={gridWrap}
                className="grid_wrap grid h-full w-full grid-cols-4 gap-[2vw]"
                style={{ transformStyle: "preserve-3d" }}
            >
                {images.map((src, index) => (
                    <div key={index} className="grid_item relative">
                        <GlareCard className="grid_item-inner">
                            <Image
                                src={src}
                                alt="card image"
                                fill                  // Das Bild füllt den gesamten Raum der GlareCard aus
                                objectFit="cover"      // Bild passt sich dem Container an
                            />
                        </GlareCard>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Die Hero-Sektion mit animiertem Hintergrund und Overlay-Content
const HeroSection = () => {
    return (
        <section className="relative h-screen w-full overflow-hidden">
            {/* Animierter Hintergrund */}
            <PerspectiveGrid />
            {/* Überlagernder Content */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
                    Willkommen bei Yu-Gi-Oh!
                </h1>
                <p className="mt-4 text-lg md:text-2xl text-white drop-shadow-md">
                    Erlebe das ultimative Kartenspiel-Abenteuer.
                </p>
                <div className="mt-8 flex space-x-4">
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">
                        Jetzt Spielen
                    </button>
                    <button className="px-6 py-3 bg-gray-800 hover:bg-gray-900 rounded-md font-semibold">
                        Mehr Erfahren
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
