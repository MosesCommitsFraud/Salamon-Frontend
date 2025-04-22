"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Sword, Shield, Star } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { GlareCard } from "@/components/ui/glare-card"
import { YgoProCard } from "@/lib/store/cardStore"

export interface YugiohCard {
    id: number
    name: string
    type: string
    human_readable_card_type: string
    frame_type: string
    desc: string
    race: string
    archetype: string
    ygoprodeck_url: string
    ban_goat: string | null
    ban_ocg: string | null
    ban_tcg: string | null
    is_staple: number
    atk: number | null
    defense: number | null
    level: number | null
    attribute: string | null
    imageUrl?: string // Neues Feld für die tatsächliche Bild-URL
}

interface CardDetailModalProps {
    isOpen: boolean
    onClose: () => void
    cards: YgoProCard[]
    categoryName: string
    // Optional: Falls vorhanden, wird diese Card als ausgewählt initial gesetzt
    selectedCardId?: number
}

export function CardDetailModal({
                                    isOpen,
                                    onClose,
                                    cards,
                                    categoryName,
                                    selectedCardId,
                                }: CardDetailModalProps) {
    const [selectedCardIndex, setSelectedCardIndex] = useState(0)
    const galleryRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])

    // Funktion, um die Bild-URL zu ermitteln
    const getCardImageUrl = (card: YgoProCard | null | undefined) => {
        if (!card) {
            return "/placeholder.svg?height=200&width=140&text=No%20Card&bg=444444"
        }
        if (card.card_images[0].image_url) {
            return `/api/card-image?url=${encodeURIComponent(card.card_images[0].image_url)}`
        }
        let color = "444444"
        if (card.type && card.type.includes("Monster")) {
            if (card.attribute === "DARK") color = "53397A"
            else if (card.attribute === "LIGHT") color = "FFDD00"
            else if (card.attribute === "FIRE") color = "C73A32"
            else if (card.attribute === "WATER") color = "2D8BC9"
            else if (card.attribute === "EARTH") color = "976D39"
            else if (card.attribute === "WIND") color = "7EAF58"
            else color = "9D6AD5"
        } else if (card.type && card.type.includes("Spell")) {
            color = "1D9E74"
        } else if (card.type && card.type.includes("Trap")) {
            color = "BC5A84"
        }
        return `/placeholder.svg?height=200&width=140&text=${encodeURIComponent(
            card.name || "Card"
        )}&bg=${color}`
    }

    // Setze die Refs für jede Karte
    useEffect(() => {
        cardRefs.current = cardRefs.current.slice(0, cards.length)
    }, [cards.length])

    // Wenn sich die Karten oder die optional übergebene selectedCardId ändern,
    // setze den Index entsprechend (Standard: 0)
    useEffect(() => {
        if (selectedCardId !== undefined) {
            const index = cards.findIndex(card => card.id === selectedCardId)
            setSelectedCardIndex(index !== -1 ? index : 0)
        } else {
            setSelectedCardIndex(0)
        }
    }, [cards, selectedCardId])

    // Zentriere die ausgewählte Karte mit scrollIntoView
    useEffect(() => {
        const card = cardRefs.current[selectedCardIndex]
        if (card) {
            card.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            })
        }
    }, [selectedCardIndex])

    const handlePrevCard = () => {
        if (cards.length === 0) return
        setSelectedCardIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1))
    }

    const handleNextCard = () => {
        if (cards.length === 0) return
        setSelectedCardIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1))
    }

    const handleCardSelect = (index: number) => {
        setSelectedCardIndex(index)
    }

    if (cards.length === 0) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{categoryName}</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-center text-muted-foreground">
                        No cards found in this category.
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const selectedCard = cards[selectedCardIndex]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl">
                        {categoryName} ({cards.length} cards)
                    </DialogTitle>
                    <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              {selectedCardIndex + 1} of {cards.length}
            </span>
                        <Button variant="outline" size="icon" onClick={handlePrevCard} className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextCard} className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 flex-grow overflow-hidden mt-4">
                    <div className="flex flex-col">
                        <div className="relative">
                            <div
                                ref={galleryRef}
                                className="overflow-x-auto pb-4 pt-2 px-4 flex gap-4 snap-x snap-mandatory custom-scrollbar"
                            >
                                {cards.map((card, index) => (
                                    <div
                                        key={card.id}
                                        ref={(el) => (cardRefs.current[index] = el)}
                                        className={`relative cursor-pointer transition-all flex-shrink-0 snap-center ${
                                            index === selectedCardIndex
                                                ? "scale-110 z-10"
                                                : "scale-90 opacity-70 hover:opacity-100 hover:scale-100"
                                        }`}
                                        onClick={() => handleCardSelect(index)}
                                    >
                                        <div className="w-[100px] h-[145px] relative">
                                            <Image
                                                src={getCardImageUrl(card) || "/placeholder.svg"}
                                                alt={card.name}
                                                fill
                                                className="object-cover rounded-md"
                                            />
                                            {index === selectedCardIndex && (
                                                <div className="absolute inset-0 border-2 border-primary rounded-md ring-4 ring-primary/20" />
                                            )}
                                        </div>
                                        <div className="mt-1 text-xs font-medium truncate text-center w-[100px]">
                                            {card.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Card className="mt-6 flex-grow overflow-hidden">
                            <CardContent className="p-4">
                                {selectedCard && (
                                    <ScrollArea className="h-[250px] pr-2">
                                        <div className="space-y-4">
                                            <div>
                                                <h2 className="text-xl font-bold">{selectedCard.name}</h2>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <Badge variant="outline">{selectedCard.type}</Badge>
                                                    {selectedCard.race && (
                                                        <Badge variant="outline">{selectedCard.race}</Badge>
                                                    )}
                                                    {selectedCard.archetype && (
                                                        <Badge variant="secondary">{selectedCard.archetype}</Badge>
                                                    )}
                                                    {selectedCard.attribute && <Badge>{selectedCard.attribute}</Badge>}
                                                </div>
                                            </div>
                                            {selectedCard.level !== null && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                                                        {Array.from({ length: selectedCard.level }).map((_, i) => (
                                                            <Star key={i} className="h-4 w-4 text-yellow-500 -mr-1" />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm">Level {selectedCard.level}</span>
                                                </div>
                                            )}
                                            <div className="flex gap-6">
                                                {selectedCard.atk !== null && (
                                                    <div className="flex items-center gap-1">
                                                        <Sword className="h-5 w-5 text-red-500" />
                                                        <span className="text-lg font-medium">{selectedCard.atk}</span>
                                                    </div>
                                                )}
                                                {selectedCard.defense !== null && (
                                                    <div className="flex items-center gap-1">
                                                        <Shield className="h-5 w-5 text-blue-500" />
                                                        <span className="text-lg font-medium">{selectedCard.defense}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-2 border-t">
                                                <h3 className="text-sm text-muted-foreground mb-1">Card Text</h3>
                                                <p className="text-sm whitespace-pre-line">{selectedCard.desc}</p>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Card ID: {selectedCard.id}
                                            </div>
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex items-center justify-center m-4">
                        <div className="relative transition-all duration-300">
                            <GlareCard className="rounded-sm">
                                <Image
                                    src={getCardImageUrl(selectedCard)}
                                    alt="Card image"
                                    fill
                                    className="center"
                                    unoptimized
                                />
                            </GlareCard>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
