"use client";

import { useEffect, useState, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Fuse from "fuse.js"
import {
  ArrowLeft,
  Info,
  Search,
  Filter,
  X,
  GripVertical,
  Shield,
  Sword,
  Sparkles,
  Wand2,
  BookOpen
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadarChart } from "./radar-chart"
import { CardStats } from "./card-stats"
import { ComparisonMode } from "./comparison-mode"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { GlareCard } from "@/components/ui/glare-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { CardWrapper } from "@/components/card-wrapper"

// Import card store
import { useCardStore } from "@/lib/store/cardStore"

interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

interface YugiohCard {
  id: number;
  name: string;
  type: string;
  human_readable_card_type: string;
  frame_type: string;
  desc: string;
  race: string;
  archetype: string;
  ygoprodeck_url: string;
  ban_goat: string | null;
  ban_ocg: string | null;
  ban_tcg: string | null;
  is_staple: number;
  imageUrl: string | null;
  images?: CardImage[];
  card_images?: CardImage[];
  atk: number | null;
  defense: number | null;
  level: number | null;
  attribute: string | null;
  // Effect properties
  effect_search?: number;
  effect_destroy?: number;
  effect_negate?: number;
  effect_draw?: number;
  effect_special_summon?: number;
  effect_banish?: number;
  effect_send_gy?: number;
  effect_recover_lp?: number;
  effect_inflict_damage?: number;
  effect_equip?: number;
  effect_modify_stats?: number;
  effect_protect?: number;
  effect_discard?: number;
  effect_change_position?: number;
  effect_return?: number;
  effect_shuffle?: number;
  effect_copy?: number;
  effect_counter?: number;
  effect_token_summon?: number;
  effect_deck_manipulation?: number;
}

// Helper function to get card image URL
const getCardImageUrl = (card: YugiohCard): string | null => {
  if (card.imageUrl) return card.imageUrl;
  if (card.images && card.images.length > 0) return card.images[0].image_url;
  if (card.card_images && card.card_images.length > 0) return card.card_images[0].image_url;
  return null;
};

// For the API image proxy: Build the URL through which the image is loaded
const getImageProxyUrl = (url: string | null) => {
  if (!url) return "/placeholder.svg";
  // Use relative URL for proxy to work in any environment
  return `/api/card-image?url=${encodeURIComponent(url)}`;
};

export default function CardDetailPage({ params }: { params: { cardId: string } }) {
  const router = useRouter();
  const [card, setCard] = useState<YugiohCard | null>(null);

  // Use the card store instead of local state for all cards
  const { allCards, fetchAllCards } = useCardStore();

  const [loading, setLoading] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonCard, setComparisonCard] = useState<YugiohCard | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [splitPosition, setSplitPosition] = useState(50); // Default split at 50%
  const [isDragging, setIsDragging] = useState(false);
  const [isVerticalDragging, setIsVerticalDragging] = useState(false);
  const [verticalSplitPosition, setVerticalSplitPosition] = useState(60); // Default vertical split at 60%
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [activeFilters, setActiveFilters] = useState<{
    types: string[];
    attributes: string[];
    levels: number[];
    archetypes: string[];
    effects: string[];
  }>({
    types: [],
    attributes: [],
    levels: [],
    archetypes: [],
    effects: [],
  });
  const [sortBy, setSortBy] = useState<string>("name");

  // Add pagination for better performance
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    async function fetchCardData() {
      try {
        // Get the detail data for the current card via API
        const res = await fetch(`/api/card/${params.cardId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch card data");
        }
        const cardData: YugiohCard = await res.json();
        setCard(cardData);

        // Use the card store to load all cards
        await fetchAllCards();

        setLoading(false);
      } catch (error) {
        console.error("Error fetching card data:", error);
        setLoading(false);
      }
    }
    fetchCardData();
  }, [params.cardId, fetchAllCards]);

  // Handle mouse events for resizable split
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && splitContainerRef.current) {
        const containerRect = splitContainerRef.current.getBoundingClientRect();
        const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        const limitedPosition = Math.max(30, Math.min(70, newPosition));
        setSplitPosition(limitedPosition);
      } else if (isVerticalDragging) {
        // Handle vertical dragging
        const windowHeight = window.innerHeight;
        const newPosition = (e.clientY / windowHeight) * 100;
        const limitedPosition = Math.max(30, Math.min(70, newPosition));
        setVerticalSplitPosition(limitedPosition);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsVerticalDragging(false);
    };

    if (isDragging || isVerticalDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isVerticalDragging]);

  const handleBack = () => {
    router.back();
  };

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    if (!comparisonMode) {
      // Reset comparison state when entering comparison mode
      setComparisonCard(null);
      setSearchQuery("");
      setCurrentPage(1);
      toast.info("Select a card to compare");
    } else {
      // Reset when exiting comparison mode
      setComparisonCard(null);
    }
  };

  // Memoize and optimize search results with debouncing
  const searchedCards = useMemo(() => {
    if (!searchQuery.trim()) return allCards;

    const fuse = new Fuse(allCards, {
      keys: ["name"],
      threshold: 0.3,
      ignoreLocation: true
    });

    return fuse.search(searchQuery.trim()).map(result => result.item);
  }, [allCards, searchQuery]);

  // Filter and sort for comparison cards - optimized and memoized
  const filteredCards = useMemo(() => {
    // Then apply the filters
    return searchedCards
        .filter((c) => {
          if (c.id === card?.id) return false; // Don't show the current card

          if (activeFilters.types.length > 0 && !activeFilters.types.includes(c.type)) {
            return false;
          }
          if (activeFilters.attributes.length > 0 && c.attribute && !activeFilters.attributes.includes(c.attribute)) {
            return false;
          }
          if (activeFilters.levels.length > 0 && c.level && !activeFilters.levels.includes(c.level)) {
            return false;
          }
          if (activeFilters.archetypes.length > 0 && c.archetype && !activeFilters.archetypes.includes(c.archetype)) {
            return false;
          }
          if (activeFilters.effects.length > 0) {
            const hasEffect = activeFilters.effects.some((effect) => {
              const effectKey = `effect_${effect}` as keyof YugiohCard;
              return c[effectKey] && c[effectKey] !== 0;
            });
            if (!hasEffect) return false;
          }
          return true;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "name":
              return a.name.localeCompare(b.name);
            case "atk":
              return (b.atk || 0) - (a.atk || 0);
            case "def":
              return (b.defense || 0) - (a.defense || 0);
            case "level":
              return (b.level || 0) - (a.level || 0);
            default:
              return 0;
          }
        });
  }, [searchedCards, activeFilters, sortBy, card?.id]);

  // Calculate paginated results
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredCards.slice(start, end);
  }, [filteredCards, currentPage, pageSize]);

  // Total pages for pagination
  const totalPages = Math.ceil(filteredCards.length / pageSize);

  // Extract unique filter values - memoized to prevent recalculation
  const filterOptions = useMemo(() => ({
    uniqueTypes: [...new Set(allCards.map((c) => c.type))].filter(Boolean),
    uniqueAttributes: [...new Set(allCards.map((c) => c.attribute))].filter(Boolean) as string[],
    uniqueLevels: [...new Set(allCards.map((c) => c.level))].filter(Boolean) as number[],
    uniqueArchetypes: [...new Set(allCards.map((c) => c.archetype))].filter(Boolean) as string[],
  }), [allCards]);

  const effectTypes = [
    { key: "search", label: "Search" },
    { key: "destroy", label: "Destroy" },
    { key: "negate", label: "Negate" },
    { key: "draw", label: "Draw" },
    { key: "special_summon", label: "Special Summon" },
    { key: "banish", label: "Banish" },
  ];

  const toggleFilter = (filterType: keyof typeof activeFilters, value: string | number) => {
    setActiveFilters((prev) => {
      const currentValues = [...prev[filterType]];
      const valueIndex = currentValues.indexOf(value as never);
      if (valueIndex === -1) {
        currentValues.push(value as never);
      } else {
        currentValues.splice(valueIndex, 1);
      }
      return { ...prev, [filterType]: currentValues };
    });
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({
      types: [],
      attributes: [],
      levels: [],
      archetypes: [],
      effects: [],
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const activeFilterCount =
      activeFilters.types.length +
      activeFilters.attributes.length +
      activeFilters.levels.length +
      activeFilters.archetypes.length +
      activeFilters.effects.length;

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 flex items-center justify-center">
          <div className="animate-pulse text-xl text-blue-300">Loading card details...</div>
        </div>
    );
  }

  if (!card) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 py-6 px-4">
          <div className="container mx-auto">
            <Button
                variant="outline"
                onClick={handleBack}
                className="mb-4 border-blue-900/30 bg-slate-900/50 hover:bg-blue-950/50 text-blue-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Card className="bg-slate-900/50 border-blue-900/20">
              <CardContent className="py-10 text-center">
                <p className="text-xl text-blue-300">Card not found</p>
              </CardContent>
            </Card>
          </div>
        </div>
    );
  }

  // Determine the URL of the image using our helper function
  const cardImageUrl = getCardImageUrl(card);
  const comparisonCardImageUrl = comparisonCard ? getCardImageUrl(comparisonCard) : null;

  // Card status indicators
  const isStaple = card.is_staple === 1;
  const hasBanStatus = card.ban_tcg || card.ban_ocg || card.ban_goat;
  const hasMonsterStats = card.atk !== null || card.defense !== null || card.level !== null || card.attribute !== null;

  if (comparisonMode) {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-black via-slate-950 to-blue-950">
          <div className="container mx-auto py-4 px-4">
            <div className="flex justify-between items-center mb-4">
              <Button
                  variant="outline"
                  onClick={handleBack}
                  className="border-blue-900/50 bg-slate-900/50 hover:bg-blue-950/50 text-blue-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                  variant="outline"
                  onClick={toggleComparisonMode}
                  className="border-purple-900/50 bg-slate-900/50 hover:bg-purple-950/50 text-purple-300"
              >
                Exit Comparison Mode
              </Button>
            </div>
          </div>
          <div
              ref={splitContainerRef}
              className="flex-1 flex relative border-t border-b"
              style={{ cursor: isDragging ? "col-resize" : "auto" }}
          >
            {/* Left Side - Current Card */}
            <div className="overflow-auto" style={{ width: `${splitPosition}%` }}>
              <Card className="m-4 bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden flex flex-col h-[750px]">
                <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20 p-4">
                  <CardTitle className="text-xl text-blue-300">{card.name}</CardTitle>
                  <CardDescription className="text-blue-300/70">
                    {card.human_readable_card_type} • {card.race}
                    {card.attribute && ` • ${card.attribute}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-4 overflow-y-auto">
                  {cardImageUrl ? (
                      <div className="h-[350px] relative aspect-[3/4] w-[250px] mx-auto mb-4">
                        <Image
                            src={getImageProxyUrl(cardImageUrl)}
                            alt={card.name}
                            fill
                            className="object-contain rounded-lg"
                            priority
                        />
                      </div>
                  ) : (
                      <div className="h-[350px] w-[250px] mx-auto bg-slate-800/50 flex items-center justify-center mb-4 rounded-lg border border-blue-900/30">
                        <Info className="h-12 w-12 text-blue-300/50" />
                      </div>
                  )}
                  <div className="w-full">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
                      {card.level !== null && (
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-300/70 mr-2">Level:</span>
                            <span className="text-blue-300 flex items-center">
                              {card.level} <Sparkles className="h-4 w-4 ml-1 text-yellow-400" />
                            </span>
                          </div>
                      )}
                      {card.attribute && (
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-300/70 mr-2">Attribute:</span>
                            <span className="text-blue-300">{card.attribute}</span>
                          </div>
                      )}
                      {card.atk !== null && (
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-300/70 mr-2">ATK:</span>
                            <span className="text-blue-300 flex items-center">
                              {card.atk} <Sword className="h-4 w-4 ml-1 text-red-400" />
                            </span>
                          </div>
                      )}
                      {card.defense !== null && (
                          <div className="flex items-center">
                            <span className="font-semibold text-blue-300/70 mr-2">DEF:</span>
                            <span className="text-blue-300 flex items-center">
                              {card.defense} <Shield className="h-4 w-4 ml-1 text-blue-400" />
                            </span>
                          </div>
                      )}
                      {card.archetype && (
                          <div className="col-span-2 flex justify-between items-center">
                            <span className="font-semibold text-blue-300/70">Archetype:</span>
                            <Badge className="bg-blue-900/30 text-blue-200 hover:bg-blue-800/50">
                              {card.archetype}
                            </Badge>
                          </div>
                      )}
                    </div>

                    <Separator className="bg-blue-900/30 mb-6" />

                    {/* Ban Status section */}
                    <div>
                      <h4 className="font-semibold mb-4 text-blue-300/70 text-base">Ban Status:</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-blue-300/70 mb-2">TCG</span>
                          <CardBadge status={card.ban_tcg} />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-blue-300/70 mb-2">OCG</span>
                          <CardBadge status={card.ban_ocg} />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-blue-300/70 mb-2">GOAT</span>
                          <CardBadge status={card.ban_goat} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-blue-950/50 to-blue-900/20 py-3 px-4 mt-auto">
                  {isStaple && (
                      <Badge className="mr-2 bg-purple-900/50 text-purple-200 hover:bg-purple-800/50">
                        Staple Card
                      </Badge>
                  )}
                  <a
                      href={card.ygoprodeck_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm ml-auto flex items-center"
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    YGOProDeck
                  </a>
                </CardFooter>
              </Card>
            </div>
            <div
                className="absolute top-0 bottom-0 w-4 bg-transparent cursor-col-resize flex items-center justify-center hover:bg-blue-800/20 z-10"
                style={{ left: `calc(${splitPosition}% - 8px)` }}
                onMouseDown={handleMouseDown}
            >
              <GripVertical className="h-6 w-6 text-blue-400" />
            </div>
            <div className="overflow-auto" style={{ width: `${100 - splitPosition}%` }}>
              {comparisonCard ? (
                  <Card className="m-4 bg-slate-900/70 border-purple-900/20 backdrop-blur-xl overflow-hidden flex flex-col h-[750px]">
                    <CardHeader className="bg-gradient-to-r from-purple-950/50 to-purple-900/20 p-4 flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="text-xl text-purple-300">{comparisonCard.name}</CardTitle>
                        <CardDescription className="text-purple-300/70">
                          {comparisonCard.human_readable_card_type} • {comparisonCard.race}
                          {comparisonCard.attribute && ` • ${comparisonCard.attribute}`}
                        </CardDescription>
                      </div>
                      <Button
                          variant="outline"
                          onClick={() => setComparisonCard(null)}
                          className="border-purple-900/50 bg-slate-900/50 hover:bg-purple-950/50 text-purple-300 h-8"
                      >
                        Change
                      </Button>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center p-4 overflow-y-auto">
                      {comparisonCardImageUrl ? (
                          <div className="h-[350px] relative aspect-[3/4] w-[250px] mx-auto mb-4">
                            <Image
                                src={getImageProxyUrl(comparisonCardImageUrl)}
                                alt={comparisonCard.name}
                                fill
                                className="object-contain rounded-lg"
                                priority
                            />
                          </div>
                      ) : (
                          <div className="h-[350px] w-[250px] mx-auto bg-slate-800/50 flex items-center justify-center mb-4 rounded-lg border border-purple-900/30">
                            <Info className="h-12 w-12 text-purple-300/50" />
                          </div>
                      )}
                      <div className="w-full">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
                          {comparisonCard.level !== null && (
                              <div className="flex items-center">
                                <span className="font-semibold text-purple-300/70 mr-2">Level:</span>
                                <span className="text-purple-300 flex items-center">
                                  {comparisonCard.level} <Sparkles className="h-4 w-4 ml-1 text-yellow-400" />
                                </span>
                              </div>
                          )}
                          {comparisonCard.attribute && (
                              <div className="flex items-center">
                                <span className="font-semibold text-purple-300/70 mr-2">Attribute:</span>
                                <span className="text-purple-300">{comparisonCard.attribute}</span>
                              </div>
                          )}
                          {comparisonCard.atk !== null && (
                              <div className="flex items-center">
                                <span className="font-semibold text-purple-300/70 mr-2">ATK:</span>
                                <span className="text-purple-300 flex items-center">
                                  {comparisonCard.atk} <Sword className="h-4 w-4 ml-1 text-red-400" />
                                </span>
                              </div>
                          )}
                          {comparisonCard.defense !== null && (
                              <div className="flex items-center">
                                <span className="font-semibold text-purple-300/70 mr-2">DEF:</span>
                                <span className="text-purple-300 flex items-center">
                                  {comparisonCard.defense} <Shield className="h-4 w-4 ml-1 text-blue-400" />
                                </span>
                              </div>
                          )}
                          {comparisonCard.archetype && (
                              <div className="col-span-2 flex justify-between items-center">
                                <span className="font-semibold text-purple-300/70">Archetype:</span>
                                <Badge className="bg-purple-900/30 text-purple-200 hover:bg-purple-800/50">
                                  {comparisonCard.archetype}
                                </Badge>
                              </div>
                          )}
                        </div>

                        <Separator className="bg-purple-900/30 mb-6" />

                        {/* Ban Status section */}
                        <div>
                          <h4 className="font-semibold mb-4 text-purple-300/70 text-base">Ban Status:</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center">
                              <span className="text-purple-300/70 mb-2">TCG</span>
                              <CardBadge status={comparisonCard.ban_tcg} />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-purple-300/70 mb-2">OCG</span>
                              <CardBadge status={comparisonCard.ban_ocg} />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-purple-300/70 mb-2">GOAT</span>
                              <CardBadge status={comparisonCard.ban_goat} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gradient-to-r from-purple-950/50 to-purple-900/20 py-3 px-4 mt-auto">
                      {comparisonCard.is_staple === 1 && (
                          <Badge className="mr-2 bg-purple-900/50 text-purple-200 hover:bg-purple-800/50">
                            Staple Card
                          </Badge>
                      )}
                      <a
                          href={comparisonCard.ygoprodeck_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm ml-auto flex items-center"
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        YGOProDeck
                      </a>
                    </CardFooter>
                  </Card>
              ) : (
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-4 text-purple-300">Select Card to Compare</h2>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/50" />
                        <Input
                            placeholder="Search cards by name..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1); // Reset to first page on search
                            }}
                            className="pl-10 bg-slate-900/50 border-blue-900/30 text-blue-200 placeholder:text-blue-300/40"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-blue-300"
                                onClick={() => {
                                  setSearchQuery("");
                                  setCurrentPage(1);
                                }}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Clear search</span>
                            </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex gap-2 border-blue-900/30 bg-slate-900/50 hover:bg-blue-950/50 text-blue-300"
                            >
                              <Filter className="h-4 w-4" />
                              Filters
                              {activeFilterCount > 0 && (
                                  <Badge variant="secondary" className="ml-1 bg-blue-600/30">
                                    {activeFilterCount}
                                  </Badge>
                              )}
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="border-blue-900/30 bg-slate-900/95 backdrop-blur-xl">
                            <SheetHeader>
                              <SheetTitle className="text-blue-300">Filter Cards</SheetTitle>
                              <SheetDescription className="text-blue-300/70">
                                Narrow down your search with specific filters
                              </SheetDescription>
                            </SheetHeader>
                            <div className="flex justify-between items-center mt-4">
                              <h3 className="text-sm font-medium text-blue-300">
                                Active Filters: {activeFilterCount}
                              </h3>
                              {activeFilterCount > 0 && (
                                  <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={clearFilters}
                                      className="text-blue-300 hover:text-blue-100 hover:bg-blue-950/50"
                                  >
                                    Clear All
                                  </Button>
                              )}
                            </div>
                            <Separator className="my-4 bg-blue-900/30" />
                            <ScrollArea className="h-[calc(100vh-200px)]">
                              <div className="space-y-6 pr-4">
                                {/* Card Type Filter */}
                                <div>
                                  <h3 className="font-medium mb-3 text-blue-300">Card Type</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    {filterOptions.uniqueTypes.map((type) => (
                                        <div key={type} className="flex items-center space-x-2">
                                          <Checkbox
                                              id={`type-${type}`}
                                              checked={activeFilters.types.includes(type)}
                                              onCheckedChange={() => toggleFilter("types", type)}
                                              className="border-blue-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                          />
                                          <Label htmlFor={`type-${type}`} className="text-blue-200">{type}</Label>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-blue-900/30" />
                                {/* Attribute Filter */}
                                <div>
                                  <h3 className="font-medium mb-3 text-blue-300">Attribute</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    {filterOptions.uniqueAttributes.map((attribute) => (
                                        <div key={attribute} className="flex items-center space-x-2">
                                          <Checkbox
                                              id={`attribute-${attribute}`}
                                              checked={activeFilters.attributes.includes(attribute)}
                                              onCheckedChange={() => toggleFilter("attributes", attribute)}
                                              className="border-blue-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                          />
                                          <Label htmlFor={`attribute-${attribute}`} className="text-blue-200">{attribute}</Label>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-blue-900/30" />
                                {/* Level Filter */}
                                <div>
                                  <h3 className="font-medium mb-3 text-blue-300">Level/Rank</h3>
                                  <div className="grid grid-cols-4 gap-2">
                                    {filterOptions.uniqueLevels.sort((a, b) => a - b).map((level) => (
                                        <div key={level} className="flex items-center space-x-2">
                                          <Checkbox
                                              id={`level-${level}`}
                                              checked={activeFilters.levels.includes(level)}
                                              onCheckedChange={() => toggleFilter("levels", level)}
                                              className="border-blue-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                          />
                                          <Label htmlFor={`level-${level}`} className="text-blue-200">{level}</Label>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-blue-900/30" />
                                {/* Effect Filter */}
                                <div>
                                  <h3 className="font-medium mb-3 text-blue-300">Card Effects</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    {effectTypes.map((effect) => (
                                        <div key={effect.key} className="flex items-center space-x-2">
                                          <Checkbox
                                              id={`effect-${effect.key}`}
                                              checked={activeFilters.effects.includes(effect.key)}
                                              onCheckedChange={() => toggleFilter("effects", effect.key)}
                                              className="border-blue-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                          />
                                          <Label htmlFor={`effect-${effect.key}`} className="text-blue-200">{effect.label}</Label>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-blue-900/30" />
                                {/* Archetype Filter */}
                                <div>
                                  <h3 className="font-medium mb-3 text-blue-300">Archetype</h3>
                                  <div className="grid grid-cols-2 gap-2">
                                    {filterOptions.uniqueArchetypes.slice(0, 10).map((archetype) => (
                                        <div key={archetype} className="flex items-center space-x-2">
                                          <Checkbox
                                              id={`archetype-${archetype}`}
                                              checked={activeFilters.archetypes.includes(archetype)}
                                              onCheckedChange={() => toggleFilter("archetypes", archetype)}
                                              className="border-blue-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                          />
                                          <Label htmlFor={`archetype-${archetype}`} className="text-blue-200">{archetype}</Label>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </ScrollArea>
                          </SheetContent>
                        </Sheet>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger
                              className="w-[180px] border-blue-900/30 bg-slate-900/50 text-blue-300"
                          >
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent className="border-blue-900/30 bg-slate-900/95 text-blue-300">
                            <SelectItem value="name">Name (A-Z)</SelectItem>
                            <SelectItem value="atk">ATK (High-Low)</SelectItem>
                            <SelectItem value="def">DEF (High-Low)</SelectItem>
                            <SelectItem value="level">Level (High-Low)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mb-4 flex justify-between items-center">
                      <p className="text-sm text-blue-300/70">
                        Showing {paginatedCards.length} of {filteredCards.length} cards
                      </p>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="border-blue-900/30 bg-slate-900/50 text-blue-300 h-8 px-2"
                            >
                              Previous
                            </Button>
                            <span className="text-blue-300 text-sm">
                            Page {currentPage} of {totalPages}
                          </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="border-blue-900/30 bg-slate-900/50 text-blue-300 h-8 px-2"
                            >
                              Next
                            </Button>
                          </div>
                      )}
                    </div>
                    <ScrollArea className="h-[calc(100vh-240px)]">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pr-4">
                        {filteredCards.length === 0 ? (
                            <div className="col-span-full text-center py-6">
                              <p className="text-blue-300/70 mb-2">No matching cards found</p>
                              <Button
                                  variant="outline"
                                  onClick={clearFilters}
                                  className="border-blue-900/30 bg-slate-900/50 hover:bg-blue-950/50 text-blue-300"
                              >
                                Clear Filters
                              </Button>
                            </div>
                        ) : (
                            paginatedCards.map((searchCard) => (
                                <Card
                                    key={searchCard.id}
                                    className={`overflow-hidden transition-all hover:shadow-md cursor-pointer border-blue-900/20 bg-slate-900/50 hover:bg-slate-800/50 hover:border-blue-600/50 ${
                                        comparisonCard?.id === searchCard.id ? "ring-2 ring-purple-500" : ""
                                    }`}
                                    onClick={() => setComparisonCard(searchCard)}
                                >
                                  <CardContent className="p-0">
                                    <div className="relative aspect-[3/4] w-full bg-slate-800/50">
                                      {getCardImageUrl(searchCard) ? (
                                          <CardWrapper>
                                            <Image
                                                src={getImageProxyUrl(getCardImageUrl(searchCard))}
                                                alt={searchCard.name}
                                                fill
                                                className="object-cover"
                                            />
                                          </CardWrapper>
                                      ) : (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <Info className="h-6 w-6 text-blue-300/50" />
                                          </div>
                                      )}
                                    </div>
                                    <div className="p-3">
                                      <h3 className="font-medium text-sm truncate text-blue-300">{searchCard.name}</h3>
                                      <p className="text-xs text-blue-300/70 truncate">
                                        {searchCard.type} • {searchCard.race}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                            ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
              )}
            </div>
          </div>
          {comparisonCard && (
              <div className="p-4 border-t border-blue-900/20 bg-gradient-to-r from-slate-950 to-slate-900 mt-4">
                <Tabs defaultValue="radar" className="w-full">
                  <TabsList className="mb-6 w-full justify-start bg-slate-900/50 border border-blue-900/20">
                    <TabsTrigger
                        value="radar"
                        className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-100"
                    >
                      Effects Comparison
                    </TabsTrigger>
                    <TabsTrigger
                        value="stats"
                        className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-100"
                    >
                      Stats Comparison
                    </TabsTrigger>
                    <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-100"
                    >
                      Card Details
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="radar">
                    <ComparisonMode card={card} comparisonCard={comparisonCard} />
                  </TabsContent>
                  <TabsContent value="stats">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2 text-blue-300">{card.name}</h3>
                        <CardStats card={card} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2 text-purple-300">{comparisonCard.name}</h3>
                        <CardStats card={comparisonCard} />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-2 text-blue-300">{card.name}</h3>
                        <div className="bg-slate-900/50 border border-blue-900/20 p-4 rounded-lg whitespace-pre-line text-blue-200 max-h-[300px] overflow-y-auto">
                          {card.desc}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2 text-purple-300">{comparisonCard.name}</h3>
                        <div className="bg-slate-900/50 border border-purple-900/20 p-4 rounded-lg whitespace-pre-line text-purple-200 max-h-[300px] overflow-y-auto">
                          {comparisonCard.desc}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
          )}
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 py-6 px-4">
        <div className="container mx-auto">
          <Button
              variant="outline"
              onClick={handleBack}
              className="mb-4 border-blue-900/30 bg-slate-900/50 hover:bg-blue-950/50 text-blue-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden h-fit">
              <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20 p-4">
                <CardTitle className="text-xl text-blue-300">{card.name}</CardTitle>
                <CardDescription className="text-blue-300/70">
                  {card.human_readable_card_type} • {card.race}
                  {card.attribute && ` • ${card.attribute}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center p-4">
                {cardImageUrl ? (
                    <CardWrapper>
                      <Image
                          src={getImageProxyUrl(cardImageUrl)}
                          alt={card.name}
                          fill
                          className="object-contain rounded-lg"
                          priority
                      />
                    </CardWrapper>
                ) : (
                    <div className="w-full max-w-[250px] h-[320px] mx-auto bg-slate-800/50 flex items-center justify-center mb-4 rounded-lg border border-blue-900/30">
                      <Info className="h-12 w-12 text-blue-300/50" />
                    </div>
                )}
                <div className="w-full space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {card.level !== null && (
                        <div className="flex items-center">
                          <span className="font-semibold text-blue-300/70 mr-2">Level:</span>
                          <span className="text-blue-300 flex items-center">
                        {card.level} <Sparkles className="h-4 w-4 ml-1 text-yellow-400" />
                      </span>
                        </div>
                    )}
                    {card.attribute && (
                        <div className="flex items-center">
                          <span className="font-semibold text-blue-300/70 mr-2">Attribute:</span>
                          <span className="text-blue-300">{card.attribute}</span>
                        </div>
                    )}
                    {card.atk !== null && (
                        <div className="flex items-center">
                          <span className="font-semibold text-blue-300/70 mr-2">ATK:</span>
                          <span className="text-blue-300 flex items-center">
                        {card.atk} <Sword className="h-4 w-4 ml-1 text-red-400" />
                      </span>
                        </div>
                    )}
                    {card.defense !== null && (
                        <div className="flex items-center">
                          <span className="font-semibold text-blue-300/70 mr-2">DEF:</span>
                          <span className="text-blue-300 flex items-center">
                        {card.defense} <Shield className="h-4 w-4 ml-1 text-blue-400" />
                      </span>
                        </div>
                    )}
                  </div>
                  {card.archetype && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-blue-300/70">Archetype:</span>
                        <Badge className="bg-blue-900/30 text-blue-200 hover:bg-blue-800/50">
                          {card.archetype}
                        </Badge>
                      </div>
                  )}
                  <Separator className="bg-blue-900/30" />
                  <div className="pt-2">
                    <h4 className="font-semibold mb-2 text-blue-300/70">Ban Status:</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-blue-300/70">TCG</span>
                        <CardBadge status={card.ban_tcg} />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-blue-300/70">OCG</span>
                        <CardBadge status={card.ban_ocg} />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-blue-300/70">GOAT</span>
                        <CardBadge status={card.ban_goat} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-blue-950/50 to-blue-900/20 py-3 px-4">
                {isStaple && (
                    <Badge className="mr-2 bg-purple-900/50 text-purple-200 hover:bg-purple-800/50">
                      Staple Card
                    </Badge>
                )}
                <a
                    href={card.ygoprodeck_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm ml-auto flex items-center"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  YGOProDeck
                </a>
              </CardFooter>
            </Card>
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20 p-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl text-blue-300">Card Details</CardTitle>
                    <Button
                        variant="outline"
                        onClick={toggleComparisonMode}
                        className="border-purple-900/50 bg-slate-900/50 hover:bg-purple-950/50 text-purple-300"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Compare Cards
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Tabs defaultValue="description">
                    <TabsList className="mb-4 bg-slate-900/50 border border-blue-900/20">
                      <TabsTrigger
                          value="description"
                          className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-100"
                      >
                        Description
                      </TabsTrigger>
                      <TabsTrigger
                          value="effects"
                          className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-100"
                      >
                        Effects Radar
                      </TabsTrigger>
                      <TabsTrigger
                          value="stats"
                          className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-100"
                      >
                        Statistics
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="description">
                      <ScrollArea className="h-[300px] rounded-md border border-blue-900/30 bg-slate-950/50 p-4">
                        <p className="text-blue-200 whitespace-pre-line">{card.desc}</p>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="effects">
                      <div className="bg-slate-950/50 rounded-md border border-blue-900/30 p-2">
                        <RadarChart card={card} />
                      </div>
                    </TabsContent>
                    <TabsContent value="stats">
                      <CardStats card={card} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  );
}

function CardBadge({ status }: { status: string | null }) {
  if (!status)
    return <span className="px-2 py-1 rounded bg-slate-800/70 text-slate-400">-</span>;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "banned":
        return "bg-red-900/70 text-red-200";
      case "limited":
        return "bg-amber-900/70 text-amber-200";
      case "semi-limited":
        return "bg-yellow-900/70 text-yellow-200";
      default:
        return "bg-green-900/70 text-green-200";
    }
  };

  return <span className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>{status}</span>;
}