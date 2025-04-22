"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Filter, Info, Search, X, BookOpen } from "lucide-react";
import Fuse from "fuse.js";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Use the card store to get cards data
import { useCardStore } from "@/lib/store/cardStore";

export default function CardListPage() {
  const { allCards, fetchAllCards } = useCardStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24; // Show more cards per page

  // Load cards from the store
  useEffect(() => {
    async function loadCards() {
      await fetchAllCards();
      setLoading(false);
    }
    loadCards();
  }, [fetchAllCards]);

  // Fuzzy search with Fuse.js
  const searchedCards = useMemo(() => {
    if (!searchQuery.trim()) return allCards;
    const fuse = new Fuse(allCards, {
      keys: ["name"],
      threshold: 0.3, // Adjust for desired accuracy
      ignoreLocation: true,
    });
    return fuse.search(searchQuery.trim()).map((result) => result.item);
  }, [allCards, searchQuery]);

  // Filter and sort cards based on search and active filters
  const filteredCards = useMemo(() => {
    const filtered = searchedCards.filter((card) => {
      // Type filter
      if (activeFilters.types.length > 0 && !activeFilters.types.includes(card.type))
        return false;
      // Attribute filter
      if (
          activeFilters.attributes.length > 0 &&
          card.attribute &&
          !activeFilters.attributes.includes(card.attribute)
      )
        return false;
      // Level filter
      if (activeFilters.levels.length > 0 && card.level && !activeFilters.levels.includes(card.level))
        return false;
      // Archetype filter
      if (activeFilters.archetypes.length > 0 && card.archetype && !activeFilters.archetypes.includes(card.archetype))
        return false;
      // Effect filter
      if (activeFilters.effects.length > 0) {
        const hasEffect = activeFilters.effects.some((effect) => {
          const effectKey = `effect_${effect}` as keyof typeof card;
          return card[effectKey] && card[effectKey] !== 0;
        });
        if (!hasEffect) return false;
      }
      return true;
    }).sort((a, b) => {
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
    // Reset to page 1 when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    return filtered;
  }, [searchedCards, activeFilters, sortBy, currentPage]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCards.length / pageSize);
  const paginatedCards = filteredCards.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
  );

  // Extract unique filter values - memoized to prevent recalculation
  const filterOptions = useMemo(() => ({
    uniqueTypes: [...new Set(allCards.map((card) => card.type))].filter(Boolean),
    uniqueAttributes: [...new Set(allCards.map((card) => card.attribute))].filter(Boolean) as string[],
    uniqueLevels: [...new Set(allCards.map((card) => card.level))].filter(Boolean) as number[],
    uniqueArchetypes: [...new Set(allCards.map((card) => card.archetype))].filter(Boolean) as string[],
  }), [allCards]);

  // Effect types for the filter
  const effectTypes = [
    { key: "search", label: "Search" },
    { key: "destroy", label: "Destroy" },
    { key: "negate", label: "Negate" },
    { key: "draw", label: "Draw" },
    { key: "special_summon", label: "Special Summon" },
    { key: "banish", label: "Banish" },
  ];

  // Toggle function for a filter value
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
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      types: [],
      attributes: [],
      levels: [],
      archetypes: [],
      effects: [],
    });
    setSearchQuery("");
  };

  // Count active filters
  const activeFilterCount =
      activeFilters.types.length +
      activeFilters.attributes.length +
      activeFilters.levels.length +
      activeFilters.archetypes.length +
      activeFilters.effects.length;

  // Helper function to get card image URL
  const getCardImageUrl = (card: any) => {
    if (card.imageUrl) return card.imageUrl;
    if (card.images && card.images.length > 0) return card.images[0].image_url;
    if (card.card_images && card.card_images.length > 0) return card.card_images[0].image_url;
    return null;
  };

  // For the API image proxy
  const getImageProxyUrl = (url: string | null) => {
    if (!url) return "/placeholder.svg";
    return `/api/card-image?url=${encodeURIComponent(url)}`;
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1 text-blue-300">Yugioh Card Database</h1>
              <p className="text-blue-300/70 mb-4 md:mb-0">
                Browse and search through the collection of Yugioh cards
              </p>
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
                          {filterOptions.uniqueLevels.sort((a, b) => a - b).slice(0, 12).map((level) => (
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
                <SelectTrigger className="w-[180px] border-blue-900/30 bg-slate-900/50 text-blue-300">
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

          <div className="relative flex-1 mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/50" />
            <Input
                placeholder="Search cards by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-blue-900/30 text-blue-200 placeholder:text-blue-300/40"
            />
            {searchQuery && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-blue-300"
                    onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
            )}
          </div>

          {/* Results count and pagination */}
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

          {/* Card Grid */}
          {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 24 }).map((_, index) => (
                    <Card key={index} className="overflow-hidden bg-slate-900/50 border-blue-900/20">
                      <CardContent className="p-0">
                        <Skeleton className="aspect-[3/4] w-full bg-slate-800/70" />
                        <div className="p-3">
                          <Skeleton className="h-4 w-3/4 mb-2 bg-slate-800/70" />
                          <Skeleton className="h-3 w-1/2 bg-slate-800/70" />
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
          ) : filteredCards.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/30 border border-blue-900/20 rounded-lg">
                <p className="text-xl text-blue-300/70 mb-4">No cards found</p>
                <Button
                    onClick={clearFilters}
                    className="border-blue-900/30 bg-slate-900/50 hover:bg-blue-950/50 text-blue-300"
                >
                  Clear Filters
                </Button>
              </div>
          ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {paginatedCards.map((card) => (
                      <Link href={`/cards/card/${card.id}`} key={card.id}>
                        <Card className="overflow-hidden transition-all hover:shadow-md border-blue-900/20 bg-slate-900/50 hover:bg-slate-800/50 hover:border-blue-600/50">
                          <CardContent className="p-0">
                            <div className="relative aspect-[3/4] w-full bg-slate-800/50">
                              {getCardImageUrl(card) ? (
                                  <Image
                                      src={getImageProxyUrl(getCardImageUrl(card))}
                                      alt={card.name}
                                      fill
                                      className="object-cover"
                                  />
                              ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Info className="h-6 w-6 text-blue-300/50" />
                                  </div>
                              )}
                            </div>
                            <div className="p-3">
                              <h3 className="font-medium text-sm truncate text-blue-300">{card.name}</h3>
                              <p className="text-xs text-blue-300/70 truncate">
                                {card.type} • {card.race}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                  ))}
                </div>

                {/* Bottom Pagination for better UX */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 mb-4">
                      <Button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="mx-1 border-blue-900/30 bg-slate-900/50 hover:bg-blue-950/50 text-blue-300"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center mx-4">
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                          // Calculate page numbers to show
                          let pageNum = i + 1;
                          if (totalPages > 5) {
                            if (currentPage > 3) {
                              pageNum = currentPage - 3 + i;
                            }
                            if (currentPage > totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            }
                          }
                          if (pageNum <= totalPages) {
                            return (
                                <Button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    className={`mx-1 h-8 w-8 p-0 ${
                                        currentPage === pageNum
                                            ? "bg-blue-700 text-white"
                                            : "border-blue-900/30 bg-slate-900/50 text-blue-300"
                                    }`}
                                >
                                  {pageNum}
                                </Button>
                            );
                          }
                          return null;
                        })}
                      </div>
                      <Button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="mx-1 border-blue-900/30 bg-slate-900/50 hover:bg-blue-950/50 text-blue-300"
                      >
                        Next
                      </Button>
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  );
}