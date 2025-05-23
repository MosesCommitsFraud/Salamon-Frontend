"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCardStore, IconName } from "@/lib/store/cardStore";
import { BirdIcon as Dragon, Zap, Cog, Sword, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner"; // Import toast

const ICON_OPTIONS: IconName[] = ["Dragon", "Zap", "Cog", "Sword", "Wand2"];

export function NewDeckDialog() {
  const [open, setOpen] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [iconName, setIconName] = useState<IconName>("Dragon");

  const createDeck = useCardStore((state) => state.createDeck);
  const router = useRouter();

  function handleCreate() {
    if (!deckName.trim()) {
      toast.error("Please enter a deck name");
      return;
    }

    const deckId = crypto.randomUUID();

    // Create deck with only name and iconName; types will be determined automatically
    createDeck(deckId, deckName, iconName);

    // Show success notification
    toast.success(`Created new deck: ${deckName}`);

    setDeckName("");
    setIconName("Dragon");
    setOpen(false);

    // Navigate to the editor page
    router.push(`/editor/${deckId}`);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setDeckName("");
          setIconName("Dragon");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300">
          <Plus className="mr-2 size-4" /> New Deck
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Give your deck a name and choose an icon. Deck types will be
            determined automatically based on the cards you add.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Deck Name</Label>
            <Input
              id="name"
              placeholder="Enter deck name..."
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="bg-slate-800/50 border-slate-700"
            />
          </div>

          {/* Icon selection */}
          <div className="grid gap-2">
            <Label>Choose Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((iconOpt) => (
                <Button
                  key={iconOpt}
                  variant={iconOpt === iconName ? "default" : "outline"}
                  onClick={() => setIconName(iconOpt)}
                >
                  {iconOpt}
                </Button>
              ))}
            </div>
          </div>

          {/* Info about automatic type detection */}
          <div className="text-sm text-blue-400 mt-2 p-3 bg-blue-950/30 rounded-lg border border-blue-900/20">
            <p>
              Deck types will be automatically determined based on the cards you
              add to your deck.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreate}
            className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300"
          >
            Create Deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
