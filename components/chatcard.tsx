"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
// Importiere den Zustand-Store
import {useCardStore, YgoProCard} from "@/lib/store/cardStore";
// Importiere die Multi Card Modal-Komponente
import { CardDetailModal, YugiohCard} from "@/components/multi-card-modal";

interface YugiohCardGalleryProps {
    cardIds: string[];
    title?: string;
    description?: string;
}

export function YugiohCardGallery({
                                      cardIds,
                                      title = "Found Cards",
                                      description = "Cards matching your search criteria",
                                  }: YugiohCardGalleryProps) {
    const [open, setOpen] = useState(false);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const { allCards } = useCardStore();

    // Wandle die cardIds in vollständige Kartendaten um
    console.log(cardIds)
    const cardsData = cardIds
        .map((id) => allCards.find((card) => card.id === Number(id)))
        .filter((card): card is YgoProCard=> card !== undefined);
    console.log(cardsData);

    const handleCardClick = (index: number) => {
        setActiveCardIndex(index);
        setOpen(true);
    };

    return (
        <div className="w-full">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {cardIds.length} {cardIds.length === 1 ? "card" : "cards"}
          </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setOpen(true)}
                >
                    <Expand className="h-4 w-4" />
                    <span className="sr-only">Expand view</span>
                </Button>
            </div>

            <div className="relative border rounded-md p-2">
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
                    {cardIds.map((cardId, index) => (
                        <button
                            key={cardId}
                            className="flex-shrink-0 rounded-md border border-border overflow-hidden transition-all hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                            onClick={() => handleCardClick(index)}
                        >
                            <Image
                                src={`https://images.ygoprodeck.com/images/cards/${cardId}.jpg`}
                                alt={`Yu-Gi-Oh card ${cardId}`}
                                width={80}
                                height={117}
                                className="h-[117px] w-[80px] object-cover"
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Öffne den Multi Card Modal, wenn Karten vorhanden sind */}

                <CardDetailModal
                    isOpen={open}
                    onClose={() => setOpen(false)}
                    cards={cardsData}
                    categoryName={title}
                    selectedCardId={cardsData[activeCardIndex]?.id}
                />

        </div>
    );
}
