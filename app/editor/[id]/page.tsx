"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Brain,
  Swords,
  Wand2,
  Layers,
  Boxes,
  SlidersHorizontal,
  Plus,
  Edit3,
  MessageSquare
} from "lucide-react";

// ShadCN Tabs-Komponenten
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  useCardStore,
  DeckEntry,
  DeckType,
  YgoProCard,
  isExtraDeckType,
} from "@/lib/store/cardStore";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardSearch } from "@/components/card-search";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Portal } from "@/components/ui/portal";
import { toast } from "sonner";
import { SimilarCards } from "@/components/similar-cards";
import Link from "next/link";

// Die beiden Screens aus der merge-with-main-Version
import { Graph } from "@/app/editor/[id]/screens/graph";
import { Analytics } from "@/app/editor/[id]/screens/analytics";

export default function EditorPage() {
  const params = useParams();
  const deckId = params.id as string;

  const {
    decks,
    createDeck,
    allCards,
    fetchAllCards,
    updateDeckArchetypes,
    removeCardFromDeck,
    addCardToDeck
  } = useCardStore();

  const [isEditing, setIsEditing] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoCompletingDeck, setIsAutoCompletingDeck] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [lastShownArchetype, setLastShownArchetype] = useState<string | null>(
      null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wir behalten "selectedCardId" aus der master-Version (z.B. für SimilarCards)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    const existingDeck = decks.find((d) => d.id === deckId);
    if (!existingDeck) {
      createDeck(deckId, "New Deck");
      toast.success("New deck created");
    }
  }, [deckId, decks, createDeck]);

  const foundDeck = decks.find((d) => d.id === deckId);

  useEffect(() => {
    if (foundDeck) {
      setNewDeckName(foundDeck.name);
    }
  }, [foundDeck]);

  // Wenn sich am Deck etwas ändert, aktualisieren wir die Archetypes
  useEffect(() => {
    if (foundDeck) {
      updateDeckArchetypes(deckId);
    }
  }, [
    deckId,
    foundDeck?.mainCards.length,
    foundDeck?.extraCards.length,
    updateDeckArchetypes,
  ]);

  // FIXED: Function to prevent middle-click scrolling, but ONLY on card elements
  useEffect(() => {
    // Function to prevent middle-click scrolling ONLY on card elements
    const preventMiddleClickScroll = (e: MouseEvent) => {
      // Only prevent middle clicks on card elements, not on scroll areas
      if (e.button === 1 && (e.target as HTMLElement).closest('.card-element')) {
        e.preventDefault();
        return false;
      }
      return true;
    };

    // Add event listeners to document for capturing all mouse events
    document.addEventListener('mousedown', preventMiddleClickScroll);
    document.addEventListener('auxclick', preventMiddleClickScroll); // auxclick handles middle-click specifically

    // Clean up event listeners on component unmount
    return () => {
      document.removeEventListener('mousedown', preventMiddleClickScroll);
      document.removeEventListener('auxclick', preventMiddleClickScroll);
    };
  }, []);

  // Disable browser's default drag image
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [draggable=true] {
        -webkit-user-drag: element;
        user-drag: element;
      }
    `;
    document.head.append(style);
    return () => style.remove();
  }, []);

  // Alle Karten laden, falls noch nicht vorhanden
  useEffect(() => {
    if (allCards.length === 0 && fetchAllCards && !isLoadingCards) {
      setIsLoadingCards(true);
      fetchAllCards()
          .then(() => {
            setIsLoadingCards(false);
          })
          .catch((error) => {
            console.error("Error fetching cards:", error);
            toast.error("Failed to load card database");
            setIsLoadingCards(false);
          });
    }
  }, [allCards.length, fetchAllCards, isLoadingCards]);

  if (!foundDeck) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 flex items-center justify-center text-white">
          Loading deck {deckId}...
        </div>
    );
  }

  const currentDeck = foundDeck;

  // Deckname bearbeiten
  const updateDeckName = (deckId: string, newName: string) => {
    useCardStore.setState((state) => {
      const updatedDecks = state.decks.map((deck) =>
          deck.id === deckId ? { ...deck, name: newName } : deck
      );
      return { decks: updatedDecks };
    });
    toast.success(`Deck renamed to "${newName}"`);
  };

  const handleNameSave = () => {
    updateDeckName(deckId, newDeckName);
    setIsEditing(false);
  };

  // Komplettes Leeren des Decks
  const handleEmptyDeck = () => {
    const totalCards =
        currentDeck.mainCards.length +
        currentDeck.extraCards.length +
        currentDeck.sideCards.length;

    if (totalCards === 0) {
      toast.info("Deck is already empty");
      return;
    }

    useCardStore.setState((state) => ({
      decks: state.decks.map((deck) =>
          deck.id === deckId
              ? { ...deck, mainCards: [], extraCards: [], sideCards: [] }
              : deck
      ),
    }));

    toast.success(`Removed ${totalCards} cards from deck`);
    setLastShownArchetype(null);

    setTimeout(() => {
      updateDeckArchetypes(deckId);
    }, 100);
  };

  // Deck exportieren (YDK)
  function handleExport() {
    const mainIds = currentDeck.mainCards.map((entry) => entry.card.id);
    const extraIds = currentDeck.extraCards.map((entry) => entry.card.id);
    const sideIds = currentDeck.sideCards.map((entry) => entry.card.id);

    const ydkLines = [
      "#created by Salamon Client",
      "#main",
      ...mainIds.map(String),
      "#extra",
      ...extraIds.map(String),
      "!side",
      ...sideIds.map(String),
    ];

    const ydkContent = ydkLines.join("\n");
    const blob = new Blob([ydkContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const fileName = `${currentDeck.name.replace(/\s+/g, "_")}.ydk`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Deck exported as "${fileName}"`);
  }

  // Deck importieren (YDK)
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const importDeckFromYDK = (content: string) => {
    const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");
    let currentSection: "main" | "extra" | "side" | null = null;
    const mainIds: number[] = [];
    const extraIds: number[] = [];
    const sideIds: number[] = [];

    for (const line of lines) {
      if (line.toLowerCase().startsWith("#main")) {
        currentSection = "main";
      } else if (line.toLowerCase().startsWith("#extra")) {
        currentSection = "extra";
      } else if (line.toLowerCase().startsWith("!side")) {
        currentSection = "side";
      } else if (!line.startsWith("#") && !line.startsWith("!")) {
        const id = parseInt(line);
        if (!isNaN(id) && currentSection) {
          if (currentSection === "main") mainIds.push(id);
          else if (currentSection === "extra") extraIds.push(id);
          else if (currentSection === "side") sideIds.push(id);
        }
      }
    }

    const createDeckEntry = (id: number): DeckEntry => ({
      deckEntryId: crypto.randomUUID(),
      card: { id } as YgoProCard,
    });

    const newMainCards = mainIds.map(createDeckEntry);
    const newExtraCards = extraIds.map(createDeckEntry);
    const newSideCards = sideIds.map(createDeckEntry);

    const prevArchetypes = currentDeck.archetypes || [];
    useCardStore.setState((state) => ({
      decks: state.decks.map((deck) =>
          deck.id === deckId
              ? {
                ...deck,
                mainCards: newMainCards,
                extraCards: newExtraCards,
                sideCards: newSideCards,
              }
              : deck
      ),
    }));

    const totalCards = mainIds.length + extraIds.length + sideIds.length;
    toast.success(`Imported ${totalCards} cards`);

    setTimeout(() => {
      updateDeckArchetypes(deckId);

      const newArchetypes =
          useCardStore.getState().decks.find((d) => d.id === deckId)
              ?.archetypes || [];
      const primaryArchetype =
          newArchetypes[0] !== "New"
              ? newArchetypes[0]
              : newArchetypes.length > 1
                  ? newArchetypes[1]
                  : null;

      if (
          primaryArchetype &&
          primaryArchetype !== lastShownArchetype &&
          (!prevArchetypes.includes(primaryArchetype) ||
              prevArchetypes.includes("New"))
      ) {
        toast.success(`Deck archetype detected: ${primaryArchetype}`);
        setLastShownArchetype(primaryArchetype);
      }
    }, 200);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.info(`Reading file: ${file.name}`);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === "string") {
        importDeckFromYDK(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Auto-Complete-Funktion (aus merge-with-main übernommen)
  function handleAutoCompleteDeck() {
    if (isAutoCompletingDeck) {
      console.log("Already processing, ignoring click");
      return;
    }

    console.log("Starting auto-complete process");
    setIsAutoCompletingDeck(true);

    const currentDeckData = {
      mainCards: currentDeck.mainCards,
      extraCards: currentDeck.extraCards,
      sideCards: currentDeck.sideCards,
    };
    const prevArchetypes = currentDeck.archetypes || [];

    toast.loading("Analyzing deck and generating recommendations...", {
      id: "auto-complete-loading",
    });

    fetch("/api/generate-deck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(currentDeckData),
    })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(data.error || "Failed to auto-complete deck");
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Successfully received data from API");
          toast.dismiss("auto-complete-loading");

          useCardStore.setState((state) => ({
            decks: state.decks.map((deck) =>
                deck.id === deckId
                    ? {
                      ...deck,
                      mainCards: data.mainCards,
                      extraCards: data.extraCards,
                      sideCards: data.sideCards,
                    }
                    : deck
            ),
          }));

          toast.success("Deck auto-completed successfully!");

          setTimeout(() => {
            updateDeckArchetypes(deckId);

            const newArchetypes =
                useCardStore.getState().decks.find((d) => d.id === deckId)
                    ?.archetypes || [];

            const primaryArchetype =
                newArchetypes[0] !== "New"
                    ? newArchetypes[0]
                    : newArchetypes.length > 1
                        ? newArchetypes[1]
                        : null;

            if (
                primaryArchetype &&
                primaryArchetype !== lastShownArchetype &&
                (!prevArchetypes.includes(primaryArchetype) ||
                    prevArchetypes.includes("New"))
            ) {
              toast.success(`Deck archetype updated: ${primaryArchetype}`);
              setLastShownArchetype(primaryArchetype);
            }
          }, 200);

          setIsAutoCompletingDeck(false);
        })
        .catch((error) => {
          console.error("Error in auto-complete:", error);
          toast.dismiss("auto-complete-loading");
          toast.error(`Error: ${error.message}`);
          setIsAutoCompletingDeck(false);
        });
  }

  // Check if a card can have another copy added
  function canAddCopy(card: YgoProCard) {
    if (!currentDeck) return false;

    if (isExtraDeckType(card.type)) {
      const current =
          currentDeck.extraCards.filter((e) => e.card.id === card.id).length +
          currentDeck.sideCards.filter((e) => e.card.id === card.id).length;
      // Extra-Deck cards max 1, including Side
      return current < 1;
    } else {
      const current =
          currentDeck.mainCards.filter((e) => e.card.id === card.id).length +
          currentDeck.sideCards.filter((e) => e.card.id === card.id).length;
      // Main-Deck cards max 3, including Side
      return current < 3;
    }
  }

  // FIXED Drag & Drop
  function onDragStart(
      e: React.DragEvent<HTMLDivElement>,
      fromIndex: number,
      fromDeckType: DeckType
  ) {
    setIsDragging(true);

    // FIX: Use a visual drag image to show what's being dragged
    // Try to get the image element within the dragged card
    const cardElement = e.currentTarget;
    const cardImage = cardElement.querySelector('img');

    if (cardImage) {
      // Create a clone of the card for the drag image
      const dragImage = cardImage.cloneNode(true) as HTMLImageElement;
      dragImage.style.width = '50px'; // Make it smaller while dragging
      dragImage.style.height = '70px';
      dragImage.style.opacity = '0.7';
      document.body.appendChild(dragImage);

      // Set the drag image to this clone
      e.dataTransfer.setDragImage(dragImage, 25, 35);

      // Remove the temporary element after a short delay
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

    e.dataTransfer.effectAllowed = "move";

    // Serialize the data with stringified JSON
    const payload = JSON.stringify({ fromIndex, fromDeckType });
    e.dataTransfer.setData("text/plain", payload);

    // Apply a visual effect to the dragged element
    e.currentTarget.classList.add("opacity-50");
    e.currentTarget.classList.add("ring-2");
    e.currentTarget.classList.add("ring-blue-500");
  }

  function onDragEnd(e: React.DragEvent<HTMLDivElement>) {
    setIsDragging(false);
    e.currentTarget.classList.remove("opacity-50");
    e.currentTarget.classList.remove("ring-2");
    e.currentTarget.classList.remove("ring-blue-500");
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  // FIXED: Drag and Drop functionality
  function onDrop(
      e: React.DragEvent<HTMLDivElement>,
      toIndex: number,
      toDeckType: DeckType
  ) {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Get the data from the drag operation
      const dataText = e.dataTransfer.getData("text/plain");
      if (!dataText) {
        console.error("No data in drop event");
        return;
      }

      // Parse the data
      const data = JSON.parse(dataText);

      // Handle drop from suggested cards
      if (data.fromSuggestions) {
        const cardId = data.cardId;
        const card = allCards.find(c => c.id.toString() === cardId.toString());
        if (card) {
          addCardToDeck(deckId, card, toDeckType);
          toast.success(`Added ${card.name || 'card'} to ${toDeckType} deck`);
          return;
        }
        return;
      }

      // Regular drag and drop - get source info
      const { fromIndex, fromDeckType } = data;
      if (fromIndex === undefined || !fromDeckType) {
        console.error("Invalid drop data", data);
        return;
      }

      // Get source card
      let sourceEntry: DeckEntry | undefined;
      if (fromDeckType === "main") sourceEntry = currentDeck.mainCards[fromIndex];
      else if (fromDeckType === "extra") sourceEntry = currentDeck.extraCards[fromIndex];
      else if (fromDeckType === "side") sourceEntry = currentDeck.sideCards[fromIndex];

      if (!sourceEntry) {
        console.error("Source entry not found", fromIndex, fromDeckType);
        return;
      }

      // Validate move (extra deck restrictions)
      const card = allCards.find((c) => c.id === sourceEntry?.card.id) || sourceEntry.card;
      if (toDeckType === "main" && isExtraDeckType(card.type)) {
        toast.error("Cannot move extra deck card into the main deck");
        return;
      }
      if (toDeckType === "extra" && !isExtraDeckType(card.type)) {
        toast.error("Cannot move main deck card into the extra deck");
        return;
      }

      // Perform the move - directly update the state
      const prevArchetypes = currentDeck.archetypes || [];

      useCardStore.setState((state) => {
        // Create a copy of the current decks
        const updatedDecks = [...state.decks];
        const deckIndex = updatedDecks.findIndex(d => d.id === deckId);

        if (deckIndex === -1) return state;

        const deck = { ...updatedDecks[deckIndex] };

        // ---------- FIX: Special handling for same deck type ----------
        if (fromDeckType === toDeckType) {
          let array;
          if (fromDeckType === 'main') array = [...deck.mainCards];
          else if (fromDeckType === 'extra') array = [...deck.extraCards];
          else array = [...deck.sideCards];

          // Remove the card from the source position
          const [movedCard] = array.splice(fromIndex, 1);

          // Insert the card at the target position
          if (toIndex >= array.length) {
            array.push(movedCard);
          } else {
            // If moving to a later position, we need to adjust the index
            // because we removed an item earlier in the array
            const adjustedIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
            array.splice(adjustedIndex, 0, movedCard);
          }

          // Update the deck with the modified array
          if (fromDeckType === 'main') deck.mainCards = array;
          else if (fromDeckType === 'extra') deck.extraCards = array;
          else deck.sideCards = array;
        } else {
          // Different source and target decks
          let sourceArray, targetArray;
          if (fromDeckType === 'main') sourceArray = [...deck.mainCards];
          else if (fromDeckType === 'extra') sourceArray = [...deck.extraCards];
          else sourceArray = [...deck.sideCards];

          if (toDeckType === 'main') targetArray = [...deck.mainCards];
          else if (toDeckType === 'extra') targetArray = [...deck.extraCards];
          else targetArray = [...deck.sideCards];

          // Get the card and remove it from source
          const [movedCard] = sourceArray.splice(fromIndex, 1);

          // Insert the card at the target position
          if (toIndex >= targetArray.length) {
            targetArray.push(movedCard);
          } else {
            targetArray.splice(toIndex, 0, movedCard);
          }

          // Update the deck with the new arrays
          if (fromDeckType === 'main') deck.mainCards = sourceArray;
          else if (fromDeckType === 'extra') deck.extraCards = sourceArray;
          else deck.sideCards = sourceArray;

          if (toDeckType === 'main') deck.mainCards = targetArray;
          else if (toDeckType === 'extra') deck.extraCards = targetArray;
          else deck.sideCards = targetArray;
        }

        updatedDecks[deckIndex] = deck;
        return { decks: updatedDecks };
      });

      if (fromDeckType !== toDeckType) {
        toast.success(`Card moved to ${toDeckType} deck`);
      }

      setTimeout(() => {
        updateDeckArchetypes(deckId);
        const newArchetypes =
            useCardStore.getState().decks.find((d) => d.id === deckId)?.archetypes ||
            [];

        if (
            JSON.stringify(prevArchetypes) !== JSON.stringify(newArchetypes) &&
            newArchetypes.length > 0
        ) {
          const primaryArchetype =
              newArchetypes[0] !== "New"
                  ? newArchetypes[0]
                  : newArchetypes.length > 1
                      ? newArchetypes[1]
                      : null;

          if (
              primaryArchetype &&
              primaryArchetype !== lastShownArchetype &&
              !prevArchetypes.includes(primaryArchetype)
          ) {
            toast.success(`Deck archetype updated: ${primaryArchetype}`);
            setLastShownArchetype(primaryArchetype);
          }
        }
      }, 200);

    } catch (error) {
      console.error("Error in drop handler:", error);
      toast.error("Failed to move card. Try again.");
    }
  }

  // Handle middle mouse click to add copy and right click to remove
  function handleCardMouseDown(e: React.MouseEvent, entry: DeckEntry, deckType: DeckType) {
    // Middle button click (button === 1) to add copy
    if (e.button === 1) {
      e.preventDefault();

      const card = allCards.find((c) => c.id === entry.card.id) || entry.card;

      // Check if we can add another copy according to the deck rules
      if (canAddCopy(card)) {
        addCardToDeck(deckId, card, deckType);
        toast.success(`Added copy of ${card.name || "card"} to ${deckType} deck`);

        const prevArchetypes = currentDeck.archetypes || [];
        setTimeout(() => {
          updateDeckArchetypes(deckId);
          const newArchetypes =
              useCardStore.getState().decks.find((d) => d.id === deckId)?.archetypes || [];

          const primaryArchetype =
              newArchetypes[0] !== "New"
                  ? newArchetypes[0]
                  : newArchetypes.length > 1
                      ? newArchetypes[1]
                      : null;

          const prevPrimaryArchetype =
              prevArchetypes[0] !== "New"
                  ? prevArchetypes[0]
                  : prevArchetypes.length > 1
                      ? prevArchetypes[1]
                      : null;

          if (
              primaryArchetype &&
              primaryArchetype !== prevPrimaryArchetype &&
              primaryArchetype !== lastShownArchetype
          ) {
            toast.success(`Deck archetype updated: ${primaryArchetype}`);
            setLastShownArchetype(primaryArchetype);
          }
        }, 200);
      } else {
        toast.error(`Maximum copies of ${card.name || "this card"} already in deck`);
      }
    }
  }

  // Handle right-click to remove card
  function handleContextMenu(e: React.MouseEvent, entry: DeckEntry, deckType: DeckType) {
    e.preventDefault(); // Prevent default browser context menu

    const card = allCards.find((c) => c.id === entry.card.id) || entry.card;
    removeCardFromDeck(deckId, entry.deckEntryId, deckType);
    toast.success(`Removed ${card.name || "card"} from ${deckType} deck`);

    const prevArchetypes = currentDeck.archetypes || [];
    setTimeout(() => {
      updateDeckArchetypes(deckId);
      const newArchetypes =
          useCardStore.getState().decks.find((d) => d.id === deckId)?.archetypes || [];

      const primaryArchetype =
          newArchetypes[0] !== "New"
              ? newArchetypes[0]
              : newArchetypes.length > 1
                  ? newArchetypes[1]
                  : null;

      const prevPrimaryArchetype =
          prevArchetypes[0] !== "New"
              ? prevArchetypes[0]
              : prevArchetypes.length > 1
                  ? prevArchetypes[1]
                  : null;

      if (
          primaryArchetype &&
          primaryArchetype !== prevPrimaryArchetype &&
          primaryArchetype !== lastShownArchetype
      ) {
        toast.info(`Deck archetype updated: ${primaryArchetype}`);
        setLastShownArchetype(primaryArchetype);
      }
    }, 200);
  }

  // Aus master: wir nutzen "selectedCardId" beim Klick auf eine Karte
  const handleCardSelection = (cardId: string) => {
    // Toggle oder einfach setzen
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  };

  return (
      <Tabs
          defaultValue="editor"
          className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950"
      >
        {/* Sticky Navbar mit Tabs */}
        <div className="sticky top-0 z-50 backdrop-blur-xl border-b border-blue-900/20">
          <div className="container py-4 flex items-center justify-between text-white">
            {/* TabsList */}
            <TabsList>
              <TabsTrigger value="editor">
                <Swords className="w-4 h-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="alc">
                <Swords className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                  value="analytics"
              >
                <Brain className="w-4 h-4 mr-2" />
                Graph
              </TabsTrigger>
            </TabsList>

            {/* Empty div to maintain layout */}
            <div></div>
          </div>
        </div>

        {/* Tab: Editor */}
        <TabsContent value="editor">
          <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950">
            {/* Decorative background pattern */}
            <div
                className="fixed inset-0 opacity-5"
                aria-hidden="true"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' ...")`,
                }}
            />
            <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-blue-900/20">
              <div className="container py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="size-12 rounded bg-gradient-to-br from-blue-600 via-blue-400 to-purple-500 p-0.5">
                    <div className="size-full rounded bg-slate-950/90 flex items-center justify-center">
                      <Swords className="w-6 h-6 text-blue-400"/>
                    </div>
                  </div>
                  <div>
                    {isEditing ? (
                        <input
                            type="text"
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleNameSave();
                            }}
                            className="text-2xl font-bold bg-transparent border-b border-blue-400 text-blue-300 focus:outline-none"
                            autoFocus
                        />
                    ) : (
                        <div className="flex items-center">
                          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            {currentDeck.name}
                          </h1>
                          <Edit3
                              className="w-4 h-4 ml-2 cursor-pointer text-blue-300"
                              onClick={() => {
                                setNewDeckName(currentDeck.name);
                                setIsEditing(true);
                              }}
                          />
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-blue-300/60">
                        {currentDeck.mainCards.length +
                            currentDeck.extraCards.length +
                            currentDeck.sideCards.length}{" "}
                        cards
                      </p>

                      {/* Display deck archetypes as badges */}
                      {currentDeck.archetypes &&
                          currentDeck.archetypes
                              .filter((a) => a !== "New")
                              .map((archetype) => (
                                  <Badge
                                      key={archetype}
                                      variant="outline"
                                      className="text-xs border-blue-600/30 text-blue-300"
                                  >
                                    {archetype}
                                  </Badge>
                              ))}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                      variant="outline"
                      className="border-red-900/50 bg-slate-900/50 hover:bg-red-950/50 text-red-300"
                      onClick={handleEmptyDeck}
                  >
                    Empty Deck
                  </Button>
                  <Button
                      variant="outline"
                      className="border-blue-900/50 bg-slate-900/50 hover:bg-blue-950/50"
                      onClick={handleImportClick}
                  >
                    Import
                  </Button>
                  <Button
                      className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white"
                      onClick={handleExport}
                  >
                    Export
                  </Button>
                  <input
                      type="file"
                      accept=".ydk,text/plain"
                      ref={fileInputRef}
                      onChange={handleFileImport}
                      style={{display: "none"}}
                  />
                </div>
              </div>
            </div>
            <div className="container py-6 grid grid-cols-[1fr,400px] gap-6">
              <div className="space-y-6">
                <DeckSection
                    deckId={deckId}
                    title="Main Deck"
                    colorClass="blue"
                    deckArray={currentDeck.mainCards}
                    deckType="main"
                    totalSlots={
                      currentDeck.mainCards.length < 40
                          ? 40
                          : currentDeck.mainCards.length
                    }
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onMouseDown={handleCardMouseDown}
                    onContextMenu={handleContextMenu}
                    isDragging={isDragging}
                    allCards={allCards}
                    lastShownArchetype={lastShownArchetype}
                    setLastShownArchetype={setLastShownArchetype}
                    selectedCardId={selectedCardId}
                    onCardSelect={handleCardSelection}
                />

                {/* Extra Deck - Show actual number of cards if more than 15 */}
                <DeckSection
                    deckId={deckId}
                    title="Extra Deck"
                    colorClass="purple"
                    deckArray={currentDeck.extraCards}
                    deckType="extra"
                    totalSlots={
                      currentDeck.extraCards.length < 15
                          ? 15
                          : currentDeck.extraCards.length
                    }
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onMouseDown={handleCardMouseDown}
                    onContextMenu={handleContextMenu}
                    isDragging={isDragging}
                    allCards={allCards}
                    lastShownArchetype={lastShownArchetype}
                    setLastShownArchetype={setLastShownArchetype}
                    selectedCardId={selectedCardId}
                    onCardSelect={handleCardSelection}
                />

                {/* Side Deck - Show actual number of cards if more than 15 */}
                <DeckSection
                    deckId={deckId}
                    title="Side Deck"
                    colorClass="green"
                    deckArray={currentDeck.sideCards}
                    deckType="side"
                    totalSlots={
                      currentDeck.sideCards.length < 15
                          ? 15
                          : currentDeck.sideCards.length
                    }
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onMouseDown={handleCardMouseDown}
                    onContextMenu={handleContextMenu}
                    isDragging={isDragging}
                    allCards={allCards}
                    lastShownArchetype={lastShownArchetype}
                    setLastShownArchetype={setLastShownArchetype}
                    selectedCardId={selectedCardId}
                    onCardSelect={handleCardSelection}
                />
              </div>
              <div className="space-y-4">
                <div className="relative z-30">
                  <CardSearch deckId={deckId}/>
                </div>

                {/* Styled buttons with fixed z-index */}
                <div className="grid gap-4 relative z-20">
                  {/* Auto-Complete Deck button */}
                  <button
                      className="w-full py-2 px-4 rounded-md font-medium flex items-center justify-center cursor-pointer relative border border-purple-900/20 bg-slate-900/50 hover:bg-purple-950/50 hover:border-purple-500 text-purple-300"
                      onClick={handleAutoCompleteDeck}
                      disabled={isAutoCompletingDeck}
                  >
                    {isAutoCompletingDeck ? (
                        <>
                          <div
                              className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent"/>
                          Auto-Completing...
                        </>
                    ) : (
                        <>
                          <Wand2 className="mr-2 w-4 h-4"/>
                          Auto-Complete Deck
                        </>
                    )}
                  </button>

                  {/* Chat button (repurposed from AI Recommendations) */}
                  <Link href="/chat">
                    <button
                        className="w-full py-2 px-4 rounded-md font-medium flex items-center justify-center cursor-pointer relative border border-blue-900/20 bg-slate-900/50 hover:bg-blue-950/50 hover:border-blue-500 text-blue-300"
                    >
                      <MessageSquare className="mr-2 w-4 h-4"/>
                      Chat with AI
                    </button>
                  </Link>
                </div>
                <SimilarCards
                    deckId={deckId}
                    selectedCardId={selectedCardId}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: ALC (Analytics) */}
        <TabsContent value="alc">
          <Analytics deckId={deckId}/>
        </TabsContent>

        {/* Tab: Analytics (Graph) */}
        <TabsContent value="analytics">
          <Graph deckId={deckId}/>
        </TabsContent>
      </Tabs>
  );
}

/** DeckSection: aus master übernommen, jedoch leicht angepasst, um onCardSelect anstelle von onCardClick zu nutzen **/
interface DeckSectionProps {
  deckId: string;
  title: string;
  colorClass: "blue" | "purple" | "green";
  deckArray: DeckEntry[];
  deckType: DeckType;
  totalSlots: number;
  onDragStart: (
      e: React.DragEvent<HTMLDivElement>,
      fromIndex: number,
      fromDeckType: DeckType
  ) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (
      e: React.DragEvent<HTMLDivElement>,
      toIndex: number,
      toDeckType: DeckType
  ) => void;
  onMouseDown: (
      e: React.MouseEvent<HTMLDivElement>,
      entry: DeckEntry,
      deckType: DeckType
  ) => void;
  onContextMenu: (
      e: React.MouseEvent<HTMLDivElement>,
      entry: DeckEntry,
      deckType: DeckType
  ) => void;
  isDragging: boolean;
  allCards: YgoProCard[];
  lastShownArchetype: string | null;
  setLastShownArchetype: (archetype: string | null) => void;

  // Master-spezifisch
  onCardSelect: (cardId: string) => void;
  selectedCardId: string | null;
}

function DeckSection({
                       title,
                       colorClass,
                       deckArray,
                       deckType,
                       totalSlots,
                       onDragStart,
                       onDragEnd,
                       onDragOver,
                       onDrop,
                       onMouseDown,
                       onContextMenu,
                       isDragging,
                       allCards,
                       onCardSelect,
                       selectedCardId,
                     }: DeckSectionProps) {
  const IconMap = {
    main: Layers,
    extra: Boxes,
    side: SlidersHorizontal,
  };
  const Icon = IconMap[deckType];

  const colorVariants: Record<string, string> = {
    blue: "border-blue-900/20 hover:border-blue-500 text-blue-400",
    purple: "border-purple-900/20 hover:border-purple-500 text-purple-400",
    green: "border-green-900/20 hover:border-green-500 text-green-400",
  };
  const appliedVariant = colorVariants[colorClass] || "";
  const textColor = colorTextClass(colorClass);

  function fullCardFromEntry(entry: DeckEntry): YgoProCard | null {
    return (
        allCards.find((card) => card.id === entry.card.id) || entry.card || null
    );
  }

  // Count pro Kategorie
  const actualEntries = deckArray.filter((entry) => entry);
  const counts: Record<string, number> = {};
  if (deckType === "extra") {
    actualEntries.forEach((entry) => {
      const card = fullCardFromEntry(entry);
      if (!card) return;
      const typeLower = (card.type || "").toLowerCase();
      if (typeLower.includes("fusion")) {
        counts["Fusion"] = (counts["Fusion"] || 0) + 1;
      }
      if (typeLower.includes("synchro")) {
        counts["Synchro"] = (counts["Synchro"] || 0) + 1;
      }
      if (typeLower.includes("xyz")) {
        counts["XYZ"] = (counts["XYZ"] || 0) + 1;
      }
      if (typeLower.includes("link")) {
        counts["Link"] = (counts["Link"] || 0) + 1;
      }
      if (typeLower.includes("pendulum")) {
        counts["Pendulum"] = (counts["Pendulum"] || 0) + 1;
      }
    });
  } else {
    actualEntries.forEach((entry) => {
      const card = fullCardFromEntry(entry);
      if (!card) return;
      const typeLower = (card.type || "").toLowerCase();
      let category: string;
      if (typeLower.includes("spell")) category = "Spell";
      else if (typeLower.includes("trap")) category = "Trap";
      else category = "Monster";
      counts[category] = (counts[category] || 0) + 1;
    });
  }

  return (
      <div className="relative">
        <div className={`flex items-center justify-between mb-2 ${textColor}`}>
          <h2 className="text-xl font-semibold flex items-center">
            <Icon className="mr-2 w-5 h-5"/>
            {title} ({deckArray.length})
          </h2>
          <div className="flex space-x-2">
            {Object.entries(counts).map(([category, count]) => (
                <Badge key={category} variant="outline" className="text-sm">
                  {category}: {count}
                </Badge>
            ))}
          </div>
        </div>

        {deckType === "main" && (deckArray.length < 40 || deckArray.length > 60) && (
            <div className="text-sm text-red-500 mb-2">
              Warning: Main deck should contain between 40 and 60 cards. (Current:{" "}
              {deckArray.length})
            </div>
        )}

        {/* FIXED: Scroll Area with proper scrollbar */}
        <ScrollArea
            className="h-[calc(33vh-2rem)] rounded-lg border border-neutral-200 bg-slate-900/50 backdrop-blur-xl p-1 dark:border-neutral-800 overflow-y-auto"
            type="always"
        >
          <div
              className="grid grid-cols-8 gap-4"
              onDragOver={onDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                onDrop(e, actualEntries.length, deckType);
              }}
          >
            <TooltipProvider delayDuration={1000}>
              {Array.from({ length: totalSlots }).map((_, i) => {
                const entry = deckArray[i];
                let imageSrc = "/fallback.png";
                if (entry) {
                  const fullCard = fullCardFromEntry(entry);
                  if (
                      fullCard?.card_images &&
                      fullCard.card_images.length > 0 &&
                      (fullCard.card_images[0].image_url ||
                          fullCard.card_images[0].image_url_small)
                  ) {
                    imageSrc =
                        fullCard.card_images[0].image_url ||
                        fullCard.card_images[0].image_url_small;
                  }
                }

                const fullCard = entry && fullCardFromEntry(entry);

                // Prüfen, ob diese Karte im Master-Code "selected" ist
                const isSelected =
                    entry && fullCard
                        ? fullCard.id.toString() === selectedCardId
                        : false;

                return (
                    <Tooltip key={entry ? entry.deckEntryId : i}>
                      <TooltipTrigger asChild>
                        <Card
                            className={`relative w-full aspect-[0.7] overflow-visible bg-slate-800/50 border ${appliedVariant} ${
                                isSelected ? "ring-2 ring-blue-400" : ""
                            } transition-all duration-300 group cursor-pointer card-element`}
                            draggable={!!entry}
                            onDragStart={(e) => entry && onDragStart(e, i, deckType)}
                            onDragEnd={onDragEnd}
                            onDragOver={onDragOver}
                            onMouseDown={(e) => entry && onMouseDown(e, entry, deckType)}
                            onContextMenu={(e) => entry && onContextMenu(e, entry, deckType)}
                            onDrop={(e) => {
                              e.stopPropagation();
                              onDrop(e, i, deckType);
                            }}
                            onClick={() => {
                              if (fullCard) {
                                onCardSelect(fullCard.id.toString());
                              }
                            }}
                        >
                          {entry && fullCard ? (
                              <Image
                                  src={imageSrc}
                                  alt={`Image of ${fullCard.name}`}
                                  width={245}
                                  height={342}
                                  unoptimized
                                  quality={100}
                                  className="object-cover rounded pointer-events-none select-none"
                              />
                          ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Plus className="w-4 h-4" />
                                </div>
                              </div>
                          )}
                        </Card>
                      </TooltipTrigger>
                      {entry && !isDragging && fullCard && (
                          <Portal>
                            <TooltipContent
                                side="top"
                                sideOffset={8}
                                className="z-50 max-w-[400px] p-2 bg-slate-900 border-blue-900/20 overflow-hidden"
                            >
                              <div className="flex space-x-2">
                                <div className="w-24 flex-shrink-0">
                                  <Image
                                      src={imageSrc}
                                      alt={fullCard.name}
                                      width={96}
                                      height={140}
                                      className="object-cover"
                                      unoptimized
                                  />
                                </div>
                                <div className="flex-grow text-xs text-slate-200 space-y-1">
                                  <div className="font-medium text-slate-100">
                                    {fullCard.name}
                                  </div>
                                  <div>
                                    {fullCard.type}{" "}
                                    {fullCard.race && <>- {fullCard.race}</>}
                                  </div>
                                  {fullCard.archetype && (
                                      <div>Archetype: {fullCard.archetype}</div>
                                  )}
                                  {(fullCard.atk !== undefined ||
                                      fullCard.def !== undefined) && (
                                      <div>
                                        {fullCard.atk !== undefined
                                            ? `ATK: ${fullCard.atk}`
                                            : ""}
                                        {fullCard.def !== undefined
                                            ? ` / DEF: ${fullCard.def}`
                                            : ""}
                                      </div>
                                  )}
                                  {fullCard.desc && (
                                      <p className="whitespace-pre-wrap line-clamp-5 overflow-hidden">
                                        {fullCard.desc}
                                      </p>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Portal>
                      )}
                    </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </ScrollArea>
      </div>
  );
}

/** Hilfsfunktionen zum stylen: **/
function colorTextClass(colorClass: "blue" | "purple" | "green"): string {
  switch (colorClass) {
    case "blue":
      return "text-blue-300";
    case "purple":
      return "text-purple-300";
    case "green":
      return "text-green-300";
    default:
      return "";
  }
}