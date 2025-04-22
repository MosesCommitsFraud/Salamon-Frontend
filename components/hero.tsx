"use client";
import Image from "next/image";
import { useState } from "react";
import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useTransform,
    wrap,
} from "framer-motion";

import { GlareCard } from "@/components/ui/glare-card";
import useLenis from "@/hooks/useLenis";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlipWords } from "@/components/ui/glitch-text";
import GlowingLogo from "@/components/logoSvg";

interface ScrollerProps {
    velocity?: number;
    clamp?: boolean;
}

export function GlareCardsScroller({ velocity = 5 }: ScrollerProps) {
    const baseX = useMotionValue(0);
    const [paused, setPaused] = useState(false);
    const x = useTransform(baseX, (v) => `${wrap(0, -50, v)}%`);

    useAnimationFrame((t, delta) => {
        if (!paused) {
            const moveBy = velocity * (delta / 1000);
            baseX.set(baseX.get() + moveBy);
        }
    });

    const images = [
        "https://images.ygoprodeck.com/images/cards/89631139.jpg",
        "https://images.ygoprodeck.com/images/cards/56532353.jpg",
        "https://images.ygoprodeck.com/images/cards/99940363.jpg",
        "https://images.ygoprodeck.com/images/cards/44508094.jpg",
        "https://images.ygoprodeck.com/images/cards/46986414.jpg",
        "https://images.ygoprodeck.com/images/cards/74677422.jpg",
        "https://images.ygoprodeck.com/images/cards/70781052.jpg",
        "https://images.ygoprodeck.com/images/cards/33396948.jpg",
        "https://images.ygoprodeck.com/images/cards/89631139.jpg",
        "https://images.ygoprodeck.com/images/cards/56532353.jpg",
        "https://images.ygoprodeck.com/images/cards/99940363.jpg",
        "https://images.ygoprodeck.com/images/cards/44508094.jpg",
        "https://images.ygoprodeck.com/images/cards/46986414.jpg",
        "https://images.ygoprodeck.com/images/cards/74677422.jpg",
        "https://images.ygoprodeck.com/images/cards/70781052.jpg",
        "https://images.ygoprodeck.com/images/cards/33396948.jpg",
    ];

    useLenis();

    return (
        <div
            className="relative flex flex-nowrap whitespace-nowrap"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <motion.div className="flex flex-nowrap" style={{ x }}>
                {images.map((src, index) => (
                    <div key={index} className="relative inline-block mr-6 flex-shrink-0">
                        <GlareCard className="inline-block">
                            <Image
                                src={src}
                                alt="card image"
                                width={320}
                                height={466}
                                style={{ objectFit: "cover" }}
                                quality={60}
                            />
                        </GlareCard>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

export default function HeroSection() {
    return (
        <section className=" w-full flex flex-col overflow-hidden">
            {/* Oberer Scroller */}

            {/* Textblock (in der Mitte der beiden Scroller) */}
            <div className="py-8 flex flex-col items-center justify-center text-center bg-black/20 mt-24">
                <div className="text-center space-y-6 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent text-white">
                        Build Better Decks with
                    </h1>
                    <h1 className="text-5xl md:text-7xl text-blue-300 font-bold">
                        <FlipWords words={["AI", "AutoComplete", "Analytics", "Suggestions"]}/>
                    </h1>
                    <p className="text-lg text-white">
                        Harness the power of artificial intelligence to create, optimize, and master your Yu-Gi-Oh!
                        decks.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/collection">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300"
                            >
                                Get Started
                            </Button>
                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-blue-600/50 text-blue-400 hover:bg-blue-950/50"
                        >
                            Learn More
                        </Button>
                    </div>
                </div>
            </div>

            {/* Unterer Scroller */}
            <div className="flex-1">
                <GlareCardsScroller velocity={-4}/>
            </div>

        </section>
    );
}
