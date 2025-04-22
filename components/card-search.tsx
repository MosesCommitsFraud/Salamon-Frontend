"use client";

import { useState, useRef, useEffect, useMemo } from "react";

import Image from "next/image";
import Fuse from "fuse.js"; // Import Fuse as a default import
import {
  useCardStore,
  isExtraDeckType,
  YgoProCard,
} from "@/lib/store/cardStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Portal } from "@/components/ui/portal";
import { Card } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Optimize the fuzzy search options to focus on most important fields
const fuseOptions = {
  keys: [
    { name: "name", weight: 2 }, // Prioritize name matches
    "type",
    "race",
    { name: "desc", weight: 0.5 }, // Reduce priority of description searches
  ],
  threshold: 0.3, // More strict matching
  ignoreLocation: true,
  distance: 50, // Reduce distance for better performance
  minMatchCharLength: 3, // Require more characters for a match
  includeScore: true,
  shouldSort: true,
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function CardSearch({ deckId }: { deckId: string }) {
  const { allCards, addCardToDeck, updateDeckArchetypes } = useCardStore();

  // Local state for the search input
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Dropdown open/close
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build the Fuse instance whenever allCards changes
  const fuseInstance = useMemo(() => {
    if (allCards.length > 0) {
      return new Fuse(allCards, fuseOptions);
    }
    return null;
  }, [allCards]); // Only recreate when allCards changes

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter results via Fuse or fallback - memoize to improve performance
  const [results, setResults] = useState<YgoProCard[]>([]);

  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      // Show a small set of cards when no search
      setResults(
          allCards.slice(0, 10).sort((a, b) => a.name.localeCompare(b.name)),
      );
      return;
    }

    // Only search if we have at least 2 characters to reduce unnecessary processing
    if (debouncedSearchQuery.length < 2) {
      return;
    }

    // Use requestAnimationFrame to avoid blocking the UI
    const searchTimeoutId = setTimeout(() => {
      if (fuseInstance) {
        // Limit to 10 results for performance
        const fuseResults = fuseInstance.search(debouncedSearchQuery, {
          limit: 10,
        });
        setResults(fuseResults.map((r) => r.item));
      }
    }, 0);

    return () => clearTimeout(searchTimeoutId);
  }, [debouncedSearchQuery, fuseInstance, allCards]);

  const handleAddCard = (
      card: YgoProCard,
      target: "main" | "extra" | "side",
  ) => {
    // Check if card type is valid for the target deck
    if (target === "main" && isExtraDeckType(card.type)) {
      toast.error(`Cannot add ${card.name} to Main Deck - it's an Extra Deck card`);
      return;
    }

    if (target === "extra" && !isExtraDeckType(card.type)) {
      toast.error(`Cannot add ${card.name} to Extra Deck - it's a Main Deck card`);
      return;
    }

    // Add the card to the deck
    addCardToDeck(deckId, card, target);

    // Show toast for adding a card
    toast.success(`Added ${card.name} to ${target} deck`);

    // Update archetypes after a short delay
    setTimeout(() => {
      updateDeckArchetypes(deckId);
    }, 100);
  };

  // Handle drag start for search results
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: YgoProCard) => {
    // Create a visual drag image
    const cardElement = e.currentTarget;
    const cardImage = cardElement.querySelector('img');

    if (cardImage) {
      // Create a clone of the image for drag feedback
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
      // Fallback if no image found
      const dragElement = document.createElement('div');
      dragElement.textContent = 'Card';
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
      cardId: card.id
    };

    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));

    // Visual feedback
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  // Check if a card can be added to the specified deck type
  const canAddToDeck = (card: YgoProCard, deckType: "main" | "extra" | "side") => {
    if (deckType === "main" && isExtraDeckType(card.type)) {
      return false;
    }
    if (deckType === "extra" && !isExtraDeckType(card.type)) {
      return false;
    }
    return true;
  };

  return (
      <div ref={containerRef} className="relative z-30">
        <Input
            placeholder="Search cards..."
            className="w-full bg-slate-900/50 border-blue-900/20 pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />

        {/* Dropdown of results */}
        {open && (
            <div className="absolute z-30 mt-1 w-[400px] bg-slate-900 border border-blue-900/20 rounded">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-2">
                  {results.map((card) => (
                      <TooltipProvider key={card.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Card
                                className="relative p-2 bg-slate-800/50 border-blue-900/20 hover:bg-blue-950/50 transition-all duration-300 cursor-pointer flex justify-between items-center"
                                draggable
                                onDragStart={(e) => handleDragStart(e, card)}
                                onDragEnd={handleDragEnd}
                            >
                              <div className="flex items-center gap-2">
                                {/* Card image thumbnail if available */}
                                {card.card_images && card.card_images[0] && (
                                    <div className="w-10 h-14 relative flex-shrink-0 rounded overflow-hidden">
                                      <Image
                                          src={card.card_images[0].image_url_small || card.card_images[0].image_url}
                                          alt={card.name}
                                          fill
                                          style={{ objectFit: "cover" }}
                                          unoptimized
                                      />
                                    </div>
                                )}

                                <div>
                                  <h4 className="font-medium text-blue-300 text-sm">
                                    {card.name}
                                  </h4>
                                  <p className="text-xs text-slate-400">
                                    {card.type} {card.race ? `• ${card.race}` : ""}
                                  </p>
                                </div>
                              </div>

                              {/* Buttons for deck types */}
                              <div className="flex space-x-1">
                                {/* Main deck button */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 ${
                                        !canAddToDeck(card, "main") ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    onClick={() => {
                                      if (canAddToDeck(card, "main")) {
                                        handleAddCard(card, "main");
                                      }
                                    }}
                                    disabled={!canAddToDeck(card, "main")}
                                >
                                  Main
                                </Button>

                                {/* Extra deck button */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-950/50 ${
                                        !canAddToDeck(card, "extra") ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    onClick={() => {
                                      if (canAddToDeck(card, "extra")) {
                                        handleAddCard(card, "extra");
                                      }
                                    }}
                                    disabled={!canAddToDeck(card, "extra")}
                                >
                                  Extra
                                </Button>

                                {/* Side deck button */}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-green-400 hover:text-green-300 hover:bg-green-950/50"
                                    onClick={() => handleAddCard(card, "side")}
                                >
                                  Side
                                </Button>
                              </div>
                            </Card>
                          </TooltipTrigger>
                          <Portal>
                            <TooltipContent
                                side="top"
                                sideOffset={8}
                                className="z-[100] max-w-[400px] p-2 bg-slate-900 border-blue-900/20 overflow-hidden"
                            >
                              {/* Match EditorPage tooltip style */}
                              <div className="flex space-x-2">
                                <div className="w-24 flex-shrink-0">
                                  {card.card_images && card.card_images[0] && (
                                      <Image
                                          src={card.card_images[0].image_url || card.card_images[0].image_url_small}
                                          alt={card.name}
                                          width={96}
                                          height={140}
                                          className="object-cover"
                                          unoptimized
                                      />
                                  )}
                                </div>
                                <div className="flex-grow text-xs text-slate-200 space-y-1">
                                  <div className="font-medium text-slate-100">
                                    {card.name}
                                  </div>
                                  <div>
                                    {card.type}{" "}
                                    {card.race && <>- {card.race}</>}
                                  </div>
                                  {card.archetype && (
                                      <div>Archetype: {card.archetype}</div>
                                  )}
                                  {(card.atk !== undefined || card.def !== undefined) && (
                                      <div>
                                        {card.atk !== undefined ? `ATK: ${card.atk}` : ""}
                                        {card.def !== undefined ? ` / DEF: ${card.def}` : ""}
                                      </div>
                                  )}
                                  {card.desc && (
                                      <p className="whitespace-pre-wrap line-clamp-5 overflow-hidden">
                                        {card.desc}
                                      </p>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Portal>
                        </Tooltip>
                      </TooltipProvider>
                  ))}

                  {/* No results */}
                  {results.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">
                        No cards found.
                      </p>
                  )}
                </div>
              </ScrollArea>
            </div>
        )}
      </div>
  );
}