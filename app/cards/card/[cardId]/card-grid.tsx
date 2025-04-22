"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Info } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface YugiohCard {
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
  imageUrl: string | null
  atk: number | null
  defense: number | null
  level: number | null
  attribute: string | null
  // Optionale Effekt-Typen
  effect_search?: number
  effect_destroy?: number
  effect_negate?: number
  effect_draw?: number
  effect_special_summon?: number
  effect_banish?: number
  effect_send_gy?: number
  effect_recover_lp?: number
  effect_inflict_damage?: number
  effect_equip?: number
  effect_modify_stats?: number
  effect_protect?: number
  effect_discard?: number
  effect_change_position?: number
  effect_return?: number
  effect_shuffle?: number
  effect_copy?: number
  effect_counter?: number
  effect_token_summon?: number
  effect_deck_manipulation?: number
}

interface CardGridProps {
  searchQuery: string
  onSelectCard: (card: YugiohCard) => void
}

export function CardGrid({ searchQuery, onSelectCard }: CardGridProps) {
  const [cards, setCards] = useState<YugiohCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Import mock data
    import("@/lib/mock-data")
      .then(({ mockCards }) => {
        setCards(mockCards)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error loading mock data:", error)
        setLoading(false)
      })
  }, [])

  // Filter cards based on search query
  const filteredCards = cards.filter((card) => {
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="aspect-[3/4] w-full" />
              <div className="p-2">
                <Skeleton className="h-3 w-3/4 mb-1" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (filteredCards.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">No cards found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {filteredCards.map((card) => (
        <Card
          key={card.id}
          className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
          onClick={() => onSelectCard(card)}
        >
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] w-full bg-muted">
              {card.imageUrl ? (
                <Image src={card.imageUrl || "/placeholder.svg"} alt={card.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Info className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-2">
              <h3 className="font-medium text-xs truncate">{card.name}</h3>
              <p className="text-[10px] text-muted-foreground truncate">
                {card.type} • {card.race}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

