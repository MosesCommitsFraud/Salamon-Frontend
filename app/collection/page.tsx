"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useCardStore, IconName, YgoProCard } from "@/lib/store/cardStore";
import { NewDeckDialog } from "@/components/new-deck-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Import Sonner
// Icons
import {
  BirdIcon as Dragon,
  Zap,
  Cog,
  Sword,
  Wand2,
  Trash2,
} from "lucide-react";

const IconMap: Record<IconName, React.ElementType> = {
  Dragon,
  Zap,
  Cog,
  Sword,
  Wand2,
};

export default function CollectionPage() {
  const { decks, allCards, setAllCards } = useCardStore();
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Load cards only once
  useEffect(() => {
    if (allCards.length === 0 && !isLoadingCards) {
      setIsLoadingCards(true);

      fetch("/api/cards", { cache: "force-cache" })
        .then((res) => {
          if (!res.ok) throw new Error("Fehler beim Karten-Fetch");
          return res.json();
        })
        .then((data) => {
          const rawCards = data.data || [];
          const map = new Map<number, YgoProCard>();
          for (const c of rawCards) {
            map.set(c.id, c);
          }
          const uniqueCards = Array.from(map.values());
          setAllCards(uniqueCards);
          setIsLoadingCards(false);
        })
        .catch((err) => {
          console.error("Fehler beim Laden der Karten:", err);
          toast.error("Failed to load card database");
          setIsLoadingCards(false);
        });
    }
  }, [allCards, setAllCards, isLoadingCards]);

  // Delete deck handler
  const handleDeleteDeck = useCallback(
    (deckId: string, event?: React.MouseEvent) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Get the deck name for the toast message
      const deckName = decks.find((d) => d.id === deckId)?.name || "Deck";

      // Update the store to remove the deck
      useCardStore.setState((state) => ({
        decks: state.decks.filter((deck) => deck.id !== deckId),
      }));

      toast.success(`Deleted "${deckName}"`);
    },
    [decks],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950">
      {/* Circuit Pattern Overlay */}
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' ...")`,
        }}
      />

      <div className="container py-8 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Your Collection
          </h1>
          <div className="flex items-center gap-4">
            {/* Dialog zum Anlegen eines neuen Decks */}
            <NewDeckDialog />
          </div>
        </div>

        {decks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">
              You haven&#39;t created any decks yet.
            </p>
            <NewDeckDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => {
              const cardCount =
                deck.mainCards.length +
                deck.extraCards.length +
                deck.sideCards.length;

              // iconName → React-Component
              let IconComponent: React.ElementType = Dragon;
              if (deck.iconName && IconMap[deck.iconName]) {
                IconComponent = IconMap[deck.iconName];
              }

              const types = deck.archetypes || [];

              return (
                <div key={deck.id} className="relative group">
                  <Link href={`/editor/${deck.id}`}>
                    <Card className="p-6 bg-slate-900/50 border-blue-900/20 hover:bg-slate-800/50 transition-colors cursor-pointer backdrop-blur-sm">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="size-16 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 p-0.5">
                          <div className="size-full rounded-lg bg-slate-950/90 flex items-center justify-center">
                            <IconComponent className="size-8 text-blue-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-xl text-slate-100">
                            {deck.name}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {cardCount} cards
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {types
                          .filter((t) => t !== "New")
                          .map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="border-blue-600/50 text-blue-400"
                            >
                              {type}
                            </Badge>
                          ))}
                      </div>
                    </Card>
                  </Link>
                  {/* Delete button - appears on hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-900/50 bg-slate-900/50 hover:bg-red-950/50 text-red-300"
                      onClick={(e) => handleDeleteDeck(deck.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
