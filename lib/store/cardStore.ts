"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Cache for loaded archetypes - for performance
let archetypesCache: string[] | null = null;

// Fallback archetypes list if JSON loading fails
const FALLBACK_ARCHETYPES = [
  "Blue-Eyes",
  "Dark Magician",
  "Red-Eyes",
  "Cyber Dragon",
  "Elemental HERO",
  "Blackwing",
  "Six Samurai",
  "Lightsworn",
  "Ghostrick",
  "Burning Abyss",
  "Shaddoll",
  "Monarch",
  "Odd-Eyes",
];

// These are special types, not archetypes
const SPECIAL_TYPES = ["Fusion", "Synchro", "XYZ", "Link", "Pendulum"];

// Beispiel-Icons als String
export type IconName = "Dragon" | "Zap" | "Cog" | "Sword" | "Wand2";

// YgoProCard: die YGOPRODECK-Datenstruktur
export type YgoProCard = {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  atk: number;
  def: number;
  level: number;
  race: string;
  attribute: string;
  archetype?: string; // Added archetype field that might exist in the API data
  card_images: {
    id: number;
    image_url: string;
    image_url_small: string;
    image_url_cropped: string;
  }[];
  // ... ggf. mehr Felder
};

// DeckEntry: Jede Karte im Deck mit eigener ID
export type DeckEntry = {
  deckEntryId: string;
  card: YgoProCard;
};

// Deck: iconName und types optional als String-Felder
export type Deck = {
  id: string;
  name: string;
  mainCards: DeckEntry[];
  extraCards: DeckEntry[];
  sideCards: DeckEntry[];
  iconName?: IconName;
  archetypes?: string[]; // Renamed from types to archetypes for clarity
};

export type DeckType = "main" | "extra" | "side";

// Helper: check if a card is Extra-Deck type
export function isExtraDeckType(cardType: string) {
  return SPECIAL_TYPES.some((t) => cardType.includes(t));
}

// Async function to load archetypes with caching for performance
async function getArchetypes(): Promise<string[]> {
  if (archetypesCache) {
    return archetypesCache;
  }

  try {
    const response = await fetch("/archetypes.json");
    if (!response.ok) {
      console.error("Failed to load archetypes, using fallback list");
      archetypesCache = FALLBACK_ARCHETYPES;
      return FALLBACK_ARCHETYPES;
    }
    const archetypes = await response.json();
    archetypesCache = archetypes;
    return archetypes;
  } catch (error) {
    console.error("Error loading archetypes, using fallback list:", error);
    archetypesCache = FALLBACK_ARCHETYPES;
    return FALLBACK_ARCHETYPES;
  }
}

// Helper: determine the archetypes in a deck
export async function detectDeckArchetypes(
  allCards: YgoProCard[],
  mainCards: DeckEntry[],
  extraCards: DeckEntry[],
): Promise<string[]> {
  // Load archetypes list with fallback
  const archetypesList = await getArchetypes();

  // Create a combined array of all cards in the deck
  const allDeckCards = [...mainCards, ...extraCards];
  if (allDeckCards.length === 0) return ["New"];

  // Count archetypes
  const archetypeCount: Record<string, number> = {};

  // Process each card in the deck - optimize by caching lookups
  const cardCache = new Map<number, YgoProCard>();
  allDeckCards.forEach((entry) => {
    // Get the full card data from allCards if available
    const cardId = entry.card.id;

    // Use cached card data if available
    let fullCard: YgoProCard;
    if (cardCache.has(cardId)) {
      fullCard = cardCache.get(cardId)!;
    } else {
      fullCard = allCards.find((c) => c.id === cardId) || entry.card;
      cardCache.set(cardId, fullCard);
    }

    // Use explicit archetype if available
    if (fullCard.archetype) {
      archetypeCount[fullCard.archetype] =
        (archetypeCount[fullCard.archetype] || 0) + 1;
      return; // Skip further processing for this card
    }

    // Otherwise check if the card name contains any known archetype
    const cardName = fullCard.name || "";
    for (const archetype of archetypesList) {
      if (cardName.includes(archetype)) {
        archetypeCount[archetype] = (archetypeCount[archetype] || 0) + 1;
        break; // Stop at first match for performance
      }
    }
  });

  // Create the result array with the most prominent archetypes
  const result: string[] = [];

  // Add the most common archetypes
  const archetypes = Object.entries(archetypeCount).sort((a, b) => b[1] - a[1]);

  // Only include legitimate archetypes (not special types)
  for (const [archetype, count] of archetypes) {
    if (count >= 3 && !SPECIAL_TYPES.includes(archetype)) {
      result.push(archetype);

      // Limit to max 2 archetypes for clarity
      if (result.length >= 2) break;
    }
  }

  // If no archetypes were detected or the deck is empty
  if (result.length === 0) {
    result.push("Mixed");
  }

  return result;
}

type CardState = {
  allCards: YgoProCard[]; // Nur im RAM
  decks: Deck[]; // Persistiert

  // allCards nur einmalig beim Start in RAM setzen
  setAllCards: (cards: YgoProCard[]) => void;

  // Deck anlegen (optionale iconName, archetypes werden automatisch ermittelt)
  createDeck: (deckId: string, deckName: string, iconName?: IconName) => void;

  addCardToDeck: (deckId: string, card: YgoProCard, target: DeckType) => void;
  removeCardFromDeck: (
    deckId: string,
    deckEntryId: string,
    source: DeckType,
  ) => void;
  moveCardInDeck: (
    deckId: string,
    fromIndex: number,
    toIndex: number,
    fromType: DeckType,
    toType: DeckType,
  ) => void;

  updateDeckArchetypes: (deckId: string) => Promise<void>;
  fetchAllCards: () => Promise<void>;
};

function getDeckArray(deck: Deck, deckType: DeckType): DeckEntry[] {
  switch (deckType) {
    case "main":
      return deck.mainCards;
    case "extra":
      return deck.extraCards;
    case "side":
      return deck.sideCards;
  }
}

function setDeckArray(deck: Deck, deckType: DeckType, newArr: DeckEntry[]) {
  switch (deckType) {
    case "main":
      deck.mainCards = newArr;
      break;
    case "extra":
      deck.extraCards = newArr;
      break;
    case "side":
      deck.sideCards = newArr;
      break;
  }
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      allCards: [],
      decks: [],

      async fetchAllCards() {
        try {
          // Check if we already have cards for performance^^
          if (get().allCards.length > 0) return;

          const res = await fetch("/api/cards", { cache: "force-cache" });
          if (!res.ok) throw new Error("Error fetching cards");
          const data = await res.json();
          const rawCards: YgoProCard[] = data.data || [];

          // Remove duplicates if needed
          const map = new Map<number, YgoProCard>();
          for (const c of rawCards) {
            map.set(c.id, c);
          }
          const uniqueCards = Array.from(map.values());
          set({ allCards: uniqueCards });
        } catch (error) {
          console.error("Error fetching cards:", error);
          set({ allCards: [] });
        }
      },

      // Nur im RAM speichern
      setAllCards: (cards) => {
        set({ allCards: cards });
      },

      // Update deck archetypes based on its contents - now async
      updateDeckArchetypes: async (deckId) => {
        const { decks, allCards } = get();
        const deckIndex = decks.findIndex((d) => d.id === deckId);
        if (deckIndex < 0) return;

        const deck = decks[deckIndex];
        const newArchetypes = await detectDeckArchetypes(
          allCards,
          deck.mainCards,
          deck.extraCards,
        );

        const updatedDecks = [...decks];
        updatedDecks[deckIndex] = { ...deck, archetypes: newArchetypes };
        set({ decks: updatedDecks });
      },

      // Deck anlegen
      createDeck: (deckId, deckName, iconName) => {
        const { decks } = get();
        // Nur anlegen, wenn nicht vorhanden
        if (!decks.some((d) => d.id === deckId)) {
          // Initial archetypes are just "New" until cards are added
          const newArchetypes = ["New"];

          set({
            decks: [
              ...decks,
              {
                id: deckId,
                name: deckName,
                mainCards: [],
                extraCards: [],
                sideCards: [],
                iconName,
                archetypes: newArchetypes,
              },
            ],
          });
        }
      },

      addCardToDeck(deckId, card, target) {
        const { decks, allCards } = get();
        const deckIndex = decks.findIndex((d) => d.id === deckId);
        if (deckIndex < 0) return;

        const deck = decks[deckIndex];
        const isExtra = isExtraDeckType(card.type);

        let totalCopies = 0;
        if (isExtra) {
          totalCopies =
            deck.extraCards.filter((e) => e.card.id === card.id).length +
            deck.sideCards.filter((e) => e.card.id === card.id).length;
          if (totalCopies >= 1) {
            console.log("Extra deck card is already in deck!");
            return;
          }
          if (target === "main") {
            console.log("Cannot place extra deck card in main deck!");
            return;
          }
        } else {
          totalCopies =
            deck.mainCards.filter((e) => e.card.id === card.id).length +
            deck.sideCards.filter((e) => e.card.id === card.id).length;
          if (totalCopies >= 3) {
            console.log("Main deck card is already in deck 3x!");
            return;
          }
          if (target === "extra") {
            console.log("Cannot place main deck card in extra deck!");
            return;
          }
        }

        // DeckEntry anlegen
        const newEntry: DeckEntry = {
          deckEntryId: crypto.randomUUID(),
          card, // Der volle card-Objekt wird hier verwendet, aber...
        };

        const arr = [...getDeckArray(deck, target), newEntry];
        setDeckArray(deck, target, arr);

        const updatedDecks = [...decks];
        updatedDecks[deckIndex] = deck;
        set({ decks: updatedDecks });

        // Update the deck archetypes after adding a card
        setTimeout(() => get().updateDeckArchetypes(deckId), 0);
      },

      removeCardFromDeck(deckId, deckEntryId, source) {
        const { decks } = get();
        const deckIndex = decks.findIndex((d) => d.id === deckId);
        if (deckIndex < 0) return;

        const deck = decks[deckIndex];
        const oldArr = getDeckArray(deck, source);
        const newArr = oldArr.filter((e) => e.deckEntryId !== deckEntryId);
        setDeckArray(deck, source, newArr);

        const updatedDecks = [...decks];
        updatedDecks[deckIndex] = deck;
        set({ decks: updatedDecks });

        // Update the deck archetypes after removing a card
        setTimeout(() => get().updateDeckArchetypes(deckId), 0);
      },

      moveCardInDeck(deckId, fromIndex, toIndex, fromType, toType) {
        set((state) => {
          const deckIndex = state.decks.findIndex((d) => d.id === deckId);
          if (deckIndex < 0) return {};
          const deck = state.decks[deckIndex];

          const fromArr = getDeckArray(deck, fromType);
          if (fromIndex < 0 || fromIndex >= fromArr.length) return {};

          const [moved] = fromArr.splice(fromIndex, 1);

          if (fromType !== toType) {
            // Cross-deck move
            const toArr = getDeckArray(deck, toType);
            if (toIndex < 0) toIndex = 0;
            if (toIndex > toArr.length) toIndex = toArr.length;
            toArr.splice(toIndex, 0, moved);

            setDeckArray(deck, fromType, fromArr);
            setDeckArray(deck, toType, toArr);
          } else {
            // Reorder in the same deck array
            if (toIndex < 0) toIndex = 0;
            if (toIndex > fromArr.length) toIndex = fromArr.length;
            fromArr.splice(toIndex, 0, moved);
            setDeckArray(deck, fromType, fromArr);
          }

          const updatedDecks = [...state.decks];
          updatedDecks[deckIndex] = deck;

          // Schedule an update of the deck archetypes
          setTimeout(() => get().updateDeckArchetypes(deckId), 0);

          return { decks: updatedDecks };
        });
      },
    }),
    {
      name: "card-store", // Unique key for storage
      // Only persist the decks, and transform each deck entry to save only minimal info.
      partialize: (state) => ({
        decks: state.decks.map((deck) => ({
          ...deck,
          mainCards: deck.mainCards.map((entry) => ({
            deckEntryId: entry.deckEntryId,
            // Only store the card id (optionally, add more fields like name if needed)
            card: { id: entry.card.id },
          })),
          extraCards: deck.extraCards.map((entry) => ({
            deckEntryId: entry.deckEntryId,
            card: { id: entry.card.id },
          })),
          sideCards: deck.sideCards.map((entry) => ({
            deckEntryId: entry.deckEntryId,
            card: { id: entry.card.id },
          })),
        })),
      }),
    },
  ),
);
