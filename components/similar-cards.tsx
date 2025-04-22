"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCardStore, YgoProCard } from "@/lib/store/cardStore";
import { Sparkles, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

type SimilarCardType = {
    card_id: string;
    name: string;
    type?: string;
    archetype?: string;
    similarity: number;
    image_url?: string;
};

type SimilarCardsResponse = {
    selected_card: YgoProCard;
    similar_cards: SimilarCardType[];
    message?: string;
    error?: string;
    backend_connection_error?: boolean;
};

export function SimilarCards({
                                 deckId,
                                 selectedCardId,
                             }: {
    deckId: string;
    selectedCardId: string | null;
}) {
    const { addCardToDeck, allCards } = useCardStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [similarCards, setSimilarCards] = useState<SimilarCardType[]>([]);
    const [isDragging, setIsDragging] = useState<string | null>(null);
    const [usingFallbackCards, setUsingFallbackCards] = useState(false);

    // Generate fallback cards (30 random cards from allCards)
    const fallbackCards = useMemo(() => {
        if (!allCards || allCards.length === 0) return [];

        // Shuffle the cards and take 30
        const shuffled = [...allCards]
            .sort(() => 0.5 - Math.random())
            .slice(0, 30)
            .map(card => ({
                card_id: card.id.toString(),
                name: card.name,
                type: card.type,
                archetype: card.archetype,
                similarity: 0,
                image_url: card.card_images && card.card_images.length > 0
                    ? card.card_images[0].image_url || card.card_images[0].image_url_small
                    : undefined
            }));

        return shuffled;
    }, [allCards]);

    // Fetch similar cards when selectedCardId changes
    useEffect(() => {
        if (!selectedCardId) {
            setSimilarCards([]);
            setError(null);
            setUsingFallbackCards(false);
            return;
        }

        async function fetchSimilarCards() {
            setLoading(true);
            setError(null);
            setUsingFallbackCards(false);

            try {
                console.log(`Fetching similar cards for: ${selectedCardId}`);
                const response = await fetch(`/api/similar-cards/${selectedCardId}?limit=12`);

                const data: SimilarCardsResponse = await response.json();

                // Check for error messages in the response
                if (data.error) {
                    setError(data.error);
                    console.error("API returned error:", data.error);

                    // Special handling for backend connection errors
                    if (data.backend_connection_error) {
                        toast.error("Could not connect to similarity service. Showing random cards instead.");
                    } else {
                        toast.info("Using random card suggestions instead");
                    }

                    // Use fallback cards instead of empty state
                    setSimilarCards(fallbackCards);
                    setUsingFallbackCards(true);
                    setLoading(false);
                    return;
                }

                // Handle message for not found cards
                if (data.message && data.similar_cards.length === 0) {
                    setError(data.message);
                    console.log(data.message);

                    // Use fallback cards here too
                    setSimilarCards(fallbackCards);
                    setUsingFallbackCards(true);
                    setLoading(false);
                    return;
                }

                // Success case
                setSimilarCards(data.similar_cards || []);
                setError(null);
                setUsingFallbackCards(false);
            } catch (error) {
                console.error("Failed to fetch similar cards:", error);
                setError("Could not load similar cards");

                // Use fallback cards on any error
                setSimilarCards(fallbackCards);
                setUsingFallbackCards(true);
            } finally {
                setLoading(false);
            }
        }

        fetchSimilarCards();
    }, [selectedCardId, fallbackCards]);

    const handleAddCard = (card: SimilarCardType) => {
        // Determine if card goes to main or extra deck based on type
        const isExtraDeck = card.type &&
            ["Fusion", "Synchro", "XYZ", "Link", "Pendulum"].some(t =>
                card.type?.includes(t)
            );

        const target = isExtraDeck ? "extra" : "main";

        // Convert to YgoProCard format
        const cardToAdd: YgoProCard = {
            id: parseInt(card.card_id),
            name: card.name,
            type: card.type || "",
            frameType: "",
            desc: "",
            atk: 0,
            def: 0,
            level: 0,
            race: "",
            attribute: "",
            archetype: card.archetype,
            card_images: card.image_url ? [{
                id: parseInt(card.card_id),
                image_url: card.image_url,
                image_url_small: card.image_url,
                image_url_cropped: card.image_url
            }] : []
        };

        addCardToDeck(deckId, cardToAdd, target);
        toast.success(`Added ${card.name} to ${target} deck`);
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: SimilarCardType) => {
        // Create a visual drag image
        const cardElement = e.currentTarget;
        const cardImage = cardElement.querySelector('img');

        if (cardImage) {
            // Create a clone of the card for the drag image
            const dragImage = cardImage.cloneNode(true) as HTMLImageElement;
            dragImage.style.width = '50px';
            dragImage.style.height = '70px';
            dragImage.style.opacity = '0.7';
            document.body.appendChild(dragImage);

            e.dataTransfer.setDragImage(dragImage, 25, 35);

            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 100);
        } else {
            // Fallback if no image
            const dragElement = document.createElement('div');
            dragElement.textContent = card.name;
            dragElement.style.backgroundColor = '#1e293b';
            dragElement.style.color = 'white';
            dragElement.style.padding = '10px';
            dragElement.style.borderRadius = '4px';
            dragElement.style.position = 'absolute';
            dragElement.style.top = '-9999px';
            document.body.appendChild(dragElement);
            e.dataTransfer.setDragImage(dragElement, 20, 20);

            setTimeout(() => {
                document.body.removeChild(dragElement);
            }, 100);
        }

        // Set the dragged card data
        const payload = {
            fromSuggestions: true,
            cardId: card.card_id
        };

        // Use text/plain format for better compatibility
        e.dataTransfer.setData("text/plain", JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "copy";

        // Visual feedback
        setIsDragging(card.card_id);
    };

    const handleDragEnd = () => {
        setIsDragging(null);
    };

    return (
        <Card className="bg-slate-900/50 border-blue-900/20 p-4 relative z-10">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-blue-300 flex items-center">
                    <Sparkles className="mr-2 w-4 h-4" />
                    {selectedCardId ? "Similar Cards" : "Suggested Cards"}
                    {loading && (
                        <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                    )}
                </h3>

                {usingFallbackCards && (
                    <div className="text-xs text-amber-300 flex items-center">
                        <Info className="w-3 h-3 mr-1" />
                        Random suggestions
                    </div>
                )}
            </div>

            {error && !usingFallbackCards && (
                <div className="mb-4 p-2 rounded bg-slate-800/50 border border-amber-900/20 text-amber-300 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    {error === "Card not found in embeddings database"
                        ? "This card doesn't have similarity data"
                        : error}
                </div>
            )}

            <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="grid grid-cols-3 gap-4">
                    {similarCards.length > 0 ? (
                        similarCards.map((card) => (
                            <Card
                                key={card.card_id}
                                className={`relative w-full aspect-[0.7] bg-slate-800/50 border-blue-900/20 group hover:border-blue-500 transition-all duration-300 cursor-pointer overflow-hidden ${
                                    isDragging === card.card_id ? 'opacity-50 ring-2 ring-blue-500' : ''
                                }`}
                                onClick={() => handleAddCard(card)}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, card)}
                                onDragEnd={handleDragEnd}
                            >
                                {card.image_url ? (
                                    <Image
                                        src={card.image_url}
                                        alt={card.name}
                                        fill
                                        className="object-cover pointer-events-none"
                                        unoptimized
                                        quality={100}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                                        <span className="text-xs text-blue-300">{card.name}</span>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-1 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                                    <div className="truncate text-blue-300">{card.name}</div>
                                    {!usingFallbackCards && (
                                        <div className="text-blue-400/70 text-[10px]">
                                            Similarity: {(card.similarity * 100).toFixed(0)}%
                                        </div>
                                    )}
                                    {usingFallbackCards && card.type && (
                                        <div className="text-blue-400/70 text-[10px]">
                                            {card.type}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    ) : (
                        // Placeholder slots when no similar cards are loaded
                        Array.from({ length: 12 }).map((_, i) => (
                            <Card
                                key={i}
                                className="relative w-full aspect-[0.7] bg-slate-800/50 border-blue-900/20 group hover:border-blue-500/20 transition-all duration-300"
                            >
                                {/* Placeholder slot */}
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-5 w-5 animate-pulse bg-blue-900/20 rounded-full" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30 text-xs text-center p-2">
                                        {selectedCardId && !error ? "Loading..." : "Select a card to see suggestions"}
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}