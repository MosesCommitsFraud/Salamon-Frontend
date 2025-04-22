"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { GlareCard } from "@/components/ui/glare-card"
import Image from "next/image";

export function CardModal({ isOpen, onClose, card }) {
  if (!card) return null

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">{card.name}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row p-6 gap-6">
            {/* Left side - Card details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                  <p>{card.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Attribute</h3>
                  <Badge variant="outline">{card.attribute}</Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Level</h3>
                  <p>★{card.level}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">ATK/DEF</h3>
                  <p>
                    {card.atk} / {card.def}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <div className="bg-muted p-4 rounded-md">
                  <p>{card.description}</p>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Card Rulings</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>This card cannot be Special Summoned except by its own effect.</li>
                  <li>When this card is Normal Summoned, you can activate its effect.</li>
                  <li>This card is affected by cards that target Normal Monsters.</li>
                </ul>
              </div>
            </div>

            {/* Right side - Card image using GlareCard */}
            <div className="md:w-[280px] m-12 flex-shrink-0">

              <GlareCard className="rounded-sm" >

                <Image
                    src={`/api/card-image?url=${encodeURIComponent(card.card_images[0].image_url)}`}
                    alt="Card image"
                    fill
                    className=" center"
                    unoptimized
                />

              </GlareCard>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  )
}
