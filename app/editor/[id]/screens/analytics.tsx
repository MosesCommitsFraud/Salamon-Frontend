"use client";

import { useState, useEffect } from "react";
import { useCardStore } from "@/lib/store/cardStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { CardDetailModal } from "@/components/multi-card-modal";
import { ScrollArea } from "@/components/ui/scroll-area";

// Interface for card data
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
  atk: number | null;
  defense: number | null;
  level: number | null;
  attribute: string | null;
  // Optional effect types
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

// Chart colors - using blues and purples that match the editor theme
const COLORS = [
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#84cc16", // lime-500
];

interface AnalyticsProps {
  deckId: string;
}

export function Analytics({ deckId }: AnalyticsProps) {
  const [deck, setDeck] = useState<YugiohCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredCards, setFilteredCards] = useState<YugiohCard[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Get the deck from the store
  const { decks } = useCardStore();
  const currentDeck = decks.find((d) => d.id === deckId);

  useEffect(() => {
    async function fetchDeckCards() {
      if (!currentDeck) {
        setDeck([]);
        setLoading(false);
        return;
      }
      const cardEntries = [
        ...currentDeck.mainCards,
        ...currentDeck.extraCards,
        ...currentDeck.sideCards,
      ];
      const cardIds = Array.from(new Set(cardEntries.map((entry) => entry.card.id)));

      try {
        const fetchedCards = await Promise.all(
            cardIds.map(async (cardId) => {
              const res = await fetch(`/api/card/${cardId}`);
              if (!res.ok) {
                console.error(`Error fetching card with ID ${cardId}`);
                return null;
              }
              // Set imageUrl if available
              return res.json().then((card: any) => {
                if (card.card_images && card.card_images.length > 0) {
                  card.imageUrl = card.card_images[0].image_url;
                } else {
                  card.imageUrl = null;
                }
                return card;
              });
            })
        );
        const validCards = fetchedCards.filter(
            (card): card is YugiohCard => card !== null
        );
        setDeck(validCards);
      } catch (error) {
        console.error("Error fetching deck cards:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDeckCards();
  }, [currentDeck]);

  // Data calculation functions
  const calculateTypeDistribution = () => {
    const typeCount: Record<string, number> = {};
    deck.forEach((card) => {
      // Simplify card types to main categories
      let type = card.human_readable_card_type;
      if (type.includes("Monster")) {
        if (type.includes("Fusion")) type = "Fusion Monster";
        else if (type.includes("Synchro")) type = "Synchro Monster";
        else if (type.includes("XYZ")) type = "XYZ Monster";
        else if (type.includes("Link")) type = "Link Monster";
        else if (type.includes("Pendulum")) type = "Pendulum Monster";
        else type = "Monster";
      } else if (type.includes("Spell")) {
        type = "Spell";
      } else if (type.includes("Trap")) {
        type = "Trap";
      }
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  };

  const calculateAttributeDistribution = () => {
    const attributeCount: Record<string, number> = {};
    deck.forEach((card) => {
      if (card.attribute) {
        attributeCount[card.attribute] = (attributeCount[card.attribute] || 0) + 1;
      }
    });
    return Object.entries(attributeCount).map(([name, value]) => ({ name, value }));
  };

  const calculateLevelDistribution = () => {
    const levelCount: Record<string, number> = {};
    deck.forEach((card) => {
      if (card.level) {
        const level = `Level ${card.level}`;
        levelCount[level] = (levelCount[level] || 0) + 1;
      }
    });
    return Object.entries(levelCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const levelA = Number.parseInt(a.name.split(" ")[1]);
          const levelB = Number.parseInt(b.name.split(" ")[1]);
          return levelA - levelB;
        });
  };

  const calculateRaceDistribution = () => {
    const raceCount: Record<string, number> = {};
    deck.forEach((card) => {
      if (card.race) {
        raceCount[card.race] = (raceCount[card.race] || 0) + 1;
      }
    });
    return Object.entries(raceCount).map(([name, value]) => ({ name, value }));
  };

  const calculateLevelAtkCorrelation = () => {
    const monsters = deck.filter(
        (card) => card.type?.includes("Monster") && card.level !== null && card.atk !== null
    );
    const levelGroups: Record<number, number[]> = {};
    monsters.forEach((card) => {
      if (card.level !== null && card.atk !== null) {
        if (!levelGroups[card.level]) {
          levelGroups[card.level] = [];
        }
        levelGroups[card.level].push(card.atk);
      }
    });
    return Object.entries(levelGroups)
        .map(([level, atkValues]) => {
          const avgAtk = atkValues.reduce((sum, atk) => sum + atk, 0) / atkValues.length;
          return {
            level: `Level ${level}`,
            avgAtk: Math.round(avgAtk),
            count: atkValues.length,
          };
        })
        .sort((a, b) => {
          const levelA = Number.parseInt(a.level.split(" ")[1]);
          const levelB = Number.parseInt(b.level.split(" ")[1]);
          return levelA - levelB;
        });
  };

  const calculateAtkRanges = () => {
    const ranges = {
      "0-500": 0,
      "501-1000": 0,
      "1001-1500": 0,
      "1501-2000": 0,
      "2001-2500": 0,
      "2501-3000": 0,
      "3001+": 0,
    };
    deck.forEach((card) => {
      if (card.atk !== null) {
        if (card.atk <= 500) ranges["0-500"]++;
        else if (card.atk <= 1000) ranges["501-1000"]++;
        else if (card.atk <= 1500) ranges["1001-1500"]++;
        else if (card.atk <= 2000) ranges["1501-2000"]++;
        else if (card.atk <= 2500) ranges["2001-2500"]++;
        else if (card.atk <= 3000) ranges["2501-3000"]++;
        else ranges["3001+"]++;
      }
    });
    return Object.entries(ranges)
        .filter(([_, value]) => value > 0)
        .map(([range, count]) => ({ range, count }));
  };

  const calculateExtraDeckTypes = () => {
    const extraDeckTypes = {
      "Fusion": 0,
      "Synchro": 0,
      "XYZ": 0,
      "Link": 0,
      "Pendulum": 0
    };

    deck.forEach((card) => {
      const typeLower = (card.type || "").toLowerCase();
      if (typeLower.includes("fusion")) extraDeckTypes["Fusion"]++;
      if (typeLower.includes("synchro")) extraDeckTypes["Synchro"]++;
      if (typeLower.includes("xyz")) extraDeckTypes["XYZ"]++;
      if (typeLower.includes("link")) extraDeckTypes["Link"]++;
      if (typeLower.includes("pendulum")) extraDeckTypes["Pendulum"]++;
    });

    return Object.entries(extraDeckTypes)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => ({ name, count }));
  };

  const calculateSpeedMetrics = () => {
    // Categorize cards by their summoning speed (normal summon vs special summon capability)
    const speedCategories = {
      "Special Summon": 0,
      "Normal Summon": 0,
      "Quick Effect": 0,
      "Counter Trap": 0
    };

    deck.forEach(card => {
      const desc = (card.desc || "").toLowerCase();

      // Check for special summon capabilities
      if (desc.includes("special summon") ||
          desc.includes("synchro summon") ||
          desc.includes("xyz summon") ||
          desc.includes("link summon") ||
          desc.includes("fusion summon") ||
          desc.includes("ritual summon") ||
          card.type?.toLowerCase().includes("xyz") ||
          card.type?.toLowerCase().includes("synchro") ||
          card.type?.toLowerCase().includes("link") ||
          card.type?.toLowerCase().includes("fusion")) {
        speedCategories["Special Summon"]++;
      }

      // Check for normal summon monsters
      else if (card.type?.toLowerCase().includes("monster") &&
          !card.type?.toLowerCase().includes("token")) {
        speedCategories["Normal Summon"]++;
      }

      // Check for quick effects and responses
      if (desc.includes("quick effect") ||
          desc.includes("during your opponent's turn") ||
          desc.includes("quick-play") ||
          card.type?.toLowerCase().includes("quick-play")) {
        speedCategories["Quick Effect"]++;
      }

      // Check for counter traps
      if (card.type?.toLowerCase().includes("counter")) {
        speedCategories["Counter Trap"]++;
      }
    });

    return Object.entries(speedCategories)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => ({ type, count }));
  };

  const calculateTributeRequirements = () => {
    const tributeCategories = {
      "No Tribute": 0,
      "1 Tribute": 0,
      "2+ Tributes": 0,
      "Special Summon Only": 0
    };

    deck.forEach(card => {
      if (!card.type?.toLowerCase().includes("monster")) return;

      // Handle special summon only monsters
      if ((card.type?.toLowerCase().includes("xyz") ||
              card.type?.toLowerCase().includes("synchro") ||
              card.type?.toLowerCase().includes("link") ||
              card.type?.toLowerCase().includes("fusion")) &&
          !card.level) {
        tributeCategories["Special Summon Only"]++;
        return;
      }

      // Handle tribute requirements based on level
      if (card.level) {
        if (card.level <= 4) tributeCategories["No Tribute"]++;
        else if (card.level <= 6) tributeCategories["1 Tribute"]++;
        else tributeCategories["2+ Tributes"]++;
      } else {
        tributeCategories["No Tribute"]++;
      }
    });

    return Object.entries(tributeCategories)
        .filter(([_, count]) => count > 0)
        .map(([requirement, count]) => ({ requirement, count }));
  };

  const calculateCardAdvantage = () => {
    const advantageCategories = {
      "Card Draw": 0,
      "Search": 0,
      "Field Advantage": 0,
      "Resource Recovery": 0,
      "Discard/Cost": 0
    };

    deck.forEach(card => {
      const desc = (card.desc || "").toLowerCase();

      // Card draw effects
      if (desc.includes("draw") || desc.includes("excavate")) {
        advantageCategories["Card Draw"]++;
      }

      // Search effects
      if (desc.includes("add") && desc.includes("from your deck")) {
        advantageCategories["Search"]++;
      }

      // Field advantage (multiple summons, tokens, etc)
      if (desc.includes("token") ||
          desc.includes("additional normal summon") ||
          desc.includes("extra normal summon") ||
          desc.includes("special summon from your extra deck")) {
        advantageCategories["Field Advantage"]++;
      }

      // Resource recovery (from GY, banished, etc)
      if ((desc.includes("from your graveyard") || desc.includes("from your gy")) &&
          (desc.includes("add to your hand") || desc.includes("special summon"))) {
        advantageCategories["Resource Recovery"]++;
      }

      // Discard costs
      if (desc.includes("discard") || desc.includes("send to the graveyard as cost")) {
        advantageCategories["Discard/Cost"]++;
      }
    });

    return Object.entries(advantageCategories)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => ({ type, count }));
  };

  const calculateInteractivity = () => {
    const interactionCategories = {
      "Hand Traps": 0,
      "Board Breakers": 0,
      "Negation Effects": 0,
      "Protection Effects": 0
    };

    const handTrapKeywords = ["during your opponent", "from your hand", "discard this card"];
    const boardBreakerKeywords = ["destroy all", "send all", "banish all", "return all"];
    const negationKeywords = ["negate", "cannot activate", "effects are negated"];
    const protectionKeywords = ["cannot be destroyed", "cannot be targeted", "unaffected by"];

    deck.forEach(card => {
      const desc = (card.desc || "").toLowerCase();

      // Hand traps (cards that can be activated from hand during opponent's turn)
      if (handTrapKeywords.some(keyword => desc.includes(keyword))) {
        interactionCategories["Hand Traps"]++;
      }

      // Board breakers (mass removal)
      if (boardBreakerKeywords.some(keyword => desc.includes(keyword))) {
        interactionCategories["Board Breakers"]++;
      }

      // Negation effects
      if (negationKeywords.some(keyword => desc.includes(keyword))) {
        interactionCategories["Negation Effects"]++;
      }

      // Protection effects
      if (protectionKeywords.some(keyword => desc.includes(keyword))) {
        interactionCategories["Protection Effects"]++;
      }
    });

    return Object.entries(interactionCategories)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => ({ type, count }));
  };

  const calculateArchetypeDistribution = () => {
    const archetypeCount: Record<string, number> = {};
    deck.forEach((card) => {
      if (card.archetype) {
        archetypeCount[card.archetype] = (archetypeCount[card.archetype] || 0) + 1;
      }
    });

    // Filter out archetypes with only 1 card, as they're likely not core to the deck strategy
    const filteredArchetypes = Object.entries(archetypeCount)
        .filter(([_, count]) => count > 1)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return filteredArchetypes;
  };

  const calculateEffectTypeDistribution = () => {
    // Focus on the most relevant effect types for gameplay
    const effectTypes = [
      { key: "effect_search", label: "Search" },
      { key: "effect_destroy", label: "Destroy" },
      { key: "effect_negate", label: "Negate" },
      { key: "effect_special_summon", label: "Special Summon" },
      { key: "effect_banish", label: "Banish" },
      { key: "effect_draw", label: "Draw" },
      { key: "effect_protect", label: "Protection" },
      { key: "effect_send_gy", label: "Send to GY" },
    ];

    // If cards don't have effect data, create mock data for display
    // This ensures the charts always show something
    let effectCounts: { effect: string; count: number }[] = [];

    // First try to get real data
    effectCounts = effectTypes.reduce(
        (acc, { key, label }) => {
          const count = deck.filter((card) => card[key as keyof YugiohCard] === 1).length;
          return [...acc, { effect: label, count }];
        },
        [] as { effect: string; count: number }[]
    );

    // If no effect data found, create some based on card descriptions
    if (effectCounts.every(item => item.count === 0)) {
      effectCounts = effectTypes.map(({ label }) => {
        // Estimate effect presence by keywords in descriptions
        const keywordMap: Record<string, string[]> = {
          "Search": ["search", "add", "from your deck"],
          "Destroy": ["destroy", "destroyed"],
          "Negate": ["negate", "negated"],
          "Special Summon": ["special summon", "summoned"],
          "Banish": ["banish", "remove from play"],
          "Draw": ["draw", "draws"],
          "Protection": ["cannot be", "unaffected"],
          "Send to GY": ["send to", "grave", "graveyard"]
        };

        const keywords = keywordMap[label] || [];
        const count = deck.filter(card =>
            keywords.some(keyword =>
                card.desc?.toLowerCase().includes(keyword.toLowerCase())
            )
        ).length;

        return { effect: label, count: count || 1 }; // Ensure at least 1 for display
      });
    }

    return effectCounts.sort((a, b) => b.count - a.count);
  };

  // Calculate existing chart data
  const typeData = calculateTypeDistribution();
  const attributeData = calculateAttributeDistribution();
  const levelData = calculateLevelDistribution();
  const raceData = calculateRaceDistribution();
  const archetypeData = calculateArchetypeDistribution();
  const effectTypeData = calculateEffectTypeDistribution();
  const extraDeckData = calculateExtraDeckTypes();
  const atkRangesData = calculateAtkRanges();
  const levelAtkData = calculateLevelAtkCorrelation();

  // Calculate new Yu-Gi-Oh specific metrics
  const speedMetrics = calculateSpeedMetrics();
  const tributeRequirements = calculateTributeRequirements();
  const cardAdvantageMetrics = calculateCardAdvantage();
  const interactivityMetrics = calculateInteractivity();

  // Click handlers for charts
  const handlePieClick = (data: any, category: string, index: number) => {
    const { name } = data;
    let cardsInCategory: YugiohCard[] = [];
    switch (category) {
      case "Card Type":
        cardsInCategory = deck.filter((card) =>
            card.human_readable_card_type === name ||
            (name === "Monster" && card.type.includes("Monster") &&
                !card.type.includes("Fusion") &&
                !card.type.includes("Synchro") &&
                !card.type.includes("XYZ") &&
                !card.type.includes("Link") &&
                !card.type.includes("Pendulum"))
        );
        break;
      case "Attribute":
        cardsInCategory = deck.filter((card) => card.attribute === name);
        break;
      case "Race":
        cardsInCategory = deck.filter((card) => card.race === name);
        break;
      case "Archetype":
        cardsInCategory = deck.filter((card) => card.archetype === name);
        break;
      default:
        cardsInCategory = [];
    }
    setSelectedCategory(`${name} (${category})`);
    setFilteredCards(cardsInCategory);
    setModalOpen(true);
    setActiveIndex(index);
  };

  const handleBarClick = (data: any, index: number) => {
    const { name } = data;
    if (name.includes("Level")) {
      const level = Number.parseInt(name.split(" ")[1]);
      const cardsInCategory = deck.filter((card) => card.level === level);
      setSelectedCategory(`${name} (Level)`);
      setFilteredCards(cardsInCategory);
      setModalOpen(true);
    } else {
      // For extra deck types
      const typeName = name;
      const cardsInCategory = deck.filter(card =>
          card.type.toLowerCase().includes(typeName.toLowerCase())
      );
      setSelectedCategory(`${name} Cards`);
      setFilteredCards(cardsInCategory);
      setModalOpen(true);
    }
    setActiveIndex(index);
  };

  const handleAtkRangeClick = (data: any) => {
    const { range } = data;
    let cardsInCategory: YugiohCard[];

    if (range === "3001+") {
      cardsInCategory = deck.filter((card) => card.atk !== null && card.atk > 3000);
    } else {
      const [min, max] = range.split("-").map(Number);
      cardsInCategory = deck.filter(
          (card) => card.atk !== null && card.atk >= min && card.atk <= max
      );
    }
    setSelectedCategory(`ATK ${range}`);
    setFilteredCards(cardsInCategory);
    setModalOpen(true);
  };

  const handleEffectClick = (data: any) => {
    const { effect } = data;
    const effectKey = Object.keys(deck[0] || {}).find(
        (key) =>
            key.startsWith("effect_") &&
            key.substring(7).replace(/_/g, " ").toLowerCase() === effect.toLowerCase()
    );

    if (effectKey) {
      const cardsInCategory = deck.filter(
          (card) => card[effectKey as keyof YugiohCard] === 1
      );
      setSelectedCategory(`${effect} Effect`);
      setFilteredCards(cardsInCategory);
      setModalOpen(true);
    }
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <g>
          <Sector
              cx={cx}
              cy={cy}
              innerRadius={innerRadius}
              outerRadius={outerRadius + 6}
              startAngle={startAngle}
              endAngle={endAngle}
              fill={fill}
          />
        </g>
    );
  };

  if (loading) {
    return <DeckAnalyticsSkeleton />;
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950">
        <div className="container px-4 py-6">
          <div className="space-y-6">
            {/* Card Type Analysis */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-blue-300">Deck Composition</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-blue-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                  <CardHeader>
                    <CardTitle className="text-blue-300">Card Type Distribution</CardTitle>
                    <CardDescription className="text-blue-300/60">
                      Breakdown of card types in your deck (click to view cards)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                            activeIndex={selectedCategory.includes("Card Type") ? activeIndex : undefined}
                            activeShape={renderActiveShape}
                            data={typeData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            stroke="transparent"
                            label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            onClick={(data, index) => handlePieClick(data, "Card Type", index)}
                            className="cursor-pointer"
                        >
                          {typeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.9)',
                              borderColor: '#1e40af',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value, name, props) => [`${value} cards`, props.payload.name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border border-purple-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                  <CardHeader>
                    <CardTitle className="text-purple-300">Extra Deck Types</CardTitle>
                    <CardDescription className="text-purple-300/60">
                      Distribution of special summon types (click to view cards)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={extraDeckData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#d8b4fe" />
                        <YAxis stroke="#d8b4fe" />
                        <Tooltip
                            formatter={(value) => [`${value} cards`]}
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.9)',
                              borderColor: '#1e40af',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                        />
                        <Bar
                            dataKey="count"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                            onClick={(data, index) => handleBarClick(data, index)}
                            className="cursor-pointer"
                        >
                          {extraDeckData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border border-blue-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                  <CardHeader>
                    <CardTitle className="text-blue-300">Archetype Distribution</CardTitle>
                    <CardDescription className="text-blue-300/60">
                      Main archetypes in your deck (click to view cards)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    {archetypeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                                activeIndex={selectedCategory.includes("Archetype") ? activeIndex : undefined}
                                activeShape={renderActiveShape}
                                data={archetypeData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                stroke="transparent"
                                label={({ name, percent }) =>
                                    `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                onClick={(data, index) => handlePieClick(data, "Archetype", index)}
                                className="cursor-pointer"
                            >
                              {archetypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                              ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                  borderColor: '#1e40af',
                                  borderRadius: '8px',
                                  color: '#fff'
                                }}
                                labelStyle={{ color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value, name, props) => [`${value} cards`, props.payload.name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-blue-300/60">
                          No significant archetypes detected
                        </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-purple-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                  <CardHeader>
                    <CardTitle className="text-purple-300">Monster Level Distribution</CardTitle>
                    <CardDescription className="text-purple-300/60">
                      Monster levels (click to view cards)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={levelData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#d8b4fe" />
                        <YAxis stroke="#d8b4fe" />
                        <Tooltip
                            formatter={(value) => [`${value} cards`]}
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.9)',
                              borderColor: '#1e40af',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                        />
                        <Bar
                            dataKey="value"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                            onClick={(data, index) => handleBarClick(data, index)}
                            className="cursor-pointer"
                        >
                          {levelData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Monster Analysis */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-purple-300">Monster Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-blue-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                  <CardHeader>
                    <CardTitle className="text-blue-300">Monster Attribute Distribution</CardTitle>
                    <CardDescription className="text-blue-300/60">
                      Breakdown of monster attributes (click to view cards)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                            activeIndex={selectedCategory.includes("Attribute") ? activeIndex : undefined}
                            activeShape={renderActiveShape}
                            data={attributeData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            stroke="transparent"
                            label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            onClick={(data, index) => handlePieClick(data, "Attribute", index)}
                            className="cursor-pointer"
                        >
                          {attributeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.9)',
                              borderColor: '#1e40af',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border border-purple-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                  <CardHeader>
                    <CardTitle className="text-purple-300">Monster Type Distribution</CardTitle>
                    <CardDescription className="text-purple-300/60">
                      Breakdown of monster types/races (click to view cards)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                            activeIndex={selectedCategory.includes("Race") ? activeIndex : undefined}
                            activeShape={renderActiveShape}
                            data={raceData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            stroke="transparent"
                            label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            onClick={(data, index) => handlePieClick(data, "Race", index)}
                            className="cursor-pointer"
                        >
                          {raceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.9)',
                              borderColor: '#1e40af',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            labelStyle={{ color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value, name, props) => [`${value} cards`, props.payload.name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border border-blue-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                  <CardHeader>
                    <CardTitle className="text-blue-300">ATK Range Distribution</CardTitle>
                    <CardDescription className="text-blue-300/60">
                      ATK values by range (click to view cards)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={atkRangesData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="range" stroke="#93c5fd" />
                        <YAxis stroke="#93c5fd" />
                        <Tooltip
                            formatter={(value) => [`${value} cards`]}
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.9)',
                              borderColor: '#1e40af',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                        />
                        <Bar
                            dataKey="count"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            onClick={(data) => handleAtkRangeClick(data)}
                            className="cursor-pointer"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border border-purple-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                  <CardHeader>
                    <CardTitle className="text-purple-300">Level vs ATK Correlation</CardTitle>
                    <CardDescription className="text-purple-300/60">
                      Average ATK value by monster level
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={levelAtkData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="level" stroke="#d8b4fe" />
                        <YAxis stroke="#d8b4fe" />
                        <Tooltip
                            formatter={(value, name) => [
                              value,
                              name === "avgAtk" ? "Average ATK" : "Card Count"
                            ]}
                            contentStyle={{
                              backgroundColor: 'rgba(30, 41, 59, 0.9)',
                              borderColor: '#1e40af',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="avgAtk"
                            name="Average ATK"
                            stroke="#8b5cf6"
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="count"
                            name="Card Count"
                            stroke="#ec4899"
                            strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Effect Analysis */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-blue-300">Effect Analysis</h2>
              <Card className="border border-blue-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                <CardHeader>
                  <CardTitle className="text-blue-300">Effect Types Distribution</CardTitle>
                  <CardDescription className="text-blue-300/60">
                    Types of card effects in your deck (click to view cards)
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={effectTypeData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis type="number" stroke="#93c5fd" />
                      <YAxis type="category" dataKey="effect" width={100} stroke="#93c5fd" />
                      <Tooltip
                          formatter={(value) => [`${value} cards (${((value / deck.length) * 100).toFixed(1)}%)`]}
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderColor: '#1e40af',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                      />
                      <Bar
                          dataKey="count"
                          fill="#3b82f6"
                          onClick={(data) => handleEffectClick(data)}
                          className="cursor-pointer"
                          radius={[0, 4, 4, 0]}
                      >
                        {effectTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>

            {/* Radar Chart for Deck Balance */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-purple-300">Deck Balance</h2>
              <Card className="border border-purple-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                <CardHeader>
                  <CardTitle className="text-purple-300">Deck Balance Radar</CardTitle>
                  <CardDescription className="text-purple-300/60">
                    Overview of your deck's key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={effectTypeData}>
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis dataKey="effect" stroke="#d8b4fe" />
                      <PolarRadiusAxis angle={30} stroke="#d8b4fe" domain={[0, 'auto']} />
                      <Radar
                          name="Effects"
                          dataKey="count"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          fillOpacity={0.6}
                      />
                      <Tooltip
                          formatter={(value) => [`${value} cards`]}
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                            borderColor: '#1e40af',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>

            {/* Card List Section */}
            <section>
              <h2 className="text-xl font-bold mb-4 text-blue-300">Card Categories</h2>
              <Card className="border border-blue-900/20 bg-slate-900/50 backdrop-blur-xl text-white">
                <CardHeader>
                  <CardTitle className="text-blue-300">Card Categories</CardTitle>
                  <CardDescription className="text-blue-300/60">
                    Click on any category to view cards
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-2">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
                      {typeData.map((type, index) => (
                          <div
                              key={`type-${index}`}
                              className="flex justify-between items-center p-3 rounded-md cursor-pointer border border-blue-900/20 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                              onClick={() => handlePieClick(type, "Card Type", index)}
                          >
                            <span className="text-blue-300">{type.name}</span>
                            <Badge variant="outline" className="bg-blue-950/50 text-blue-300 border-blue-700/50">
                              {type.value}
                            </Badge>
                          </div>
                      ))}

                      {attributeData.length > 0 && attributeData.map((attr, index) => (
                          <div
                              key={`attr-${index}`}
                              className="flex justify-between items-center p-3 rounded-md cursor-pointer border border-purple-900/20 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                              onClick={() => handlePieClick(attr, "Attribute", index)}
                          >
                            <span className="text-purple-300">{attr.name}</span>
                            <Badge variant="outline" className="bg-purple-950/50 text-purple-300 border-purple-700/50">
                              {attr.value}
                            </Badge>
                          </div>
                      ))}

                      {archetypeData.length > 0 && archetypeData.map((archetype, index) => (
                          <div
                              key={`archetype-${index}`}
                              className="flex justify-between items-center p-3 rounded-md cursor-pointer border border-green-900/20 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                              onClick={() => handlePieClick(archetype, "Archetype", index)}
                          >
                            <span className="text-green-300">{archetype.name}</span>
                            <Badge variant="outline" className="bg-green-950/50 text-green-300 border-green-700/50">
                              {archetype.value}
                            </Badge>
                          </div>
                      ))}

                      {extraDeckData.map((type, index) => (
                          <div
                              key={`extra-${index}`}
                              className="flex justify-between items-center p-3 rounded-md cursor-pointer border border-amber-900/20 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                              onClick={() => handleBarClick(type, index)}
                          >
                            <span className="text-amber-300">{type.name}</span>
                            <Badge variant="outline" className="bg-amber-950/50 text-amber-300 border-amber-700/50">
                              {type.count}
                            </Badge>
                          </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Modal for displaying cards */}
          <CardDetailModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              cards={filteredCards}
              categoryName={selectedCategory}
          />
        </div>
      </div>
  );
}

function DeckAnalyticsSkeleton() {
  return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-[250px] bg-slate-800" />
            <Skeleton className="h-4 w-[200px] bg-slate-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-[300px] w-full rounded-xl bg-slate-800" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-[300px] w-full rounded-xl bg-slate-800" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-[300px] w-full rounded-xl bg-slate-800" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-[300px] w-full rounded-xl bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
  );
}

export default Analytics;