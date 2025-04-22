"use client";

import { useState, useEffect } from "react";
import { useCardStore } from "@/lib/store/cardStore"; // passe den Pfad ggf. an
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
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CardDetailModal } from "@/components/multi-card-modal";
import { ScrollArea } from "@/components/ui/scroll-area";

// Interface für Karten-Daten (erwarte hier die von der API zurückgelieferte Struktur)
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
  // Optionale Effekt-Typen
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

// Chart Farben
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
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

  // Hole das gewünschte Deck aus dem Store anhand der deckId
  const { decks } = useCardStore();
  const currentDeck = decks.find((d) => d.id === deckId);

  // Hole die vollständigen Kartendaten über die API für alle im Deck enthaltenen Karten
  useEffect(() => {
    async function fetchDeckCards() {
      if (!currentDeck) {
        setDeck([]);
        setLoading(false);
        return;
      }
      // Kombiniere main, extra und side Karten
      const cardEntries = [
        ...currentDeck.mainCards,
        ...currentDeck.extraCards,
        ...currentDeck.sideCards,
      ];
      // Extrahiere eindeutige Card-IDs
      const cardIds = Array.from(new Set(cardEntries.map((entry) => entry.card.id)));

      try {
        // Führe parallele API-Abfragen für alle eindeutigen Card-IDs durch
        const fetchedCards = await Promise.all(
            cardIds.map(async (cardId) => {
              const res = await fetch(`/api/card/${cardId}`);
              if (!res.ok) {
                console.error(`Fehler beim Abrufen der Karte mit ID ${cardId}`);
                return null;
              }
              return await res.json();
            })
        );
        // Filtere alle fehlgeschlagenen Abfragen heraus
        const validCards = fetchedCards.filter(
            (card): card is YugiohCard => card !== null
        );
        setDeck(validCards);
      } catch (error) {
        console.error("Fehler beim Abrufen der Deck-Karten:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDeckCards();
  }, [currentDeck]);

  // Diverse Berechnungsfunktionen (Distributionen, Korrelationen etc.)
  const calculateTypeDistribution = () => {
    const typeCount: Record<string, number> = {};
    deck.forEach((card) => {
      const type = card.human_readable_card_type;
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

  const calculateAtkDefDistribution = () => {
    const monsters = deck.filter(
        (card) => card.type.includes("Monster") && card.atk !== null && card.defense !== null
    );
    return monsters.map((card) => ({
      name: card.name,
      atk: card.atk,
      def: card.defense,
      level: card.level,
    }));
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

  const calculateLevelAtkCorrelation = () => {
    const monsters = deck.filter(
        (card) => card.type.includes("Monster") && card.level !== null && card.atk !== null
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

  const calculateArchetypeRadarData = () => {
    const archetypes = Array.from(new Set(deck.map((card) => card.archetype).filter(Boolean)));
    if (archetypes.length === 0) return [];
    return archetypes.map((archetype) => {
      const archetypeCards = deck.filter((card) => card.archetype === archetype);
      const monsters = archetypeCards.filter((card) => card.type.includes("Monster"));
      const spells = archetypeCards.filter((card) => card.type.includes("Spell"));
      const traps = archetypeCards.filter((card) => card.type.includes("Trap"));
      const avgAtk =
          monsters.length > 0 ? monsters.reduce((sum, card) => sum + (card.atk || 0), 0) / monsters.length : 0;
      const avgDef =
          monsters.length > 0 ? monsters.reduce((sum, card) => sum + (card.defense || 0), 0) / monsters.length : 0;
      const avgLevel =
          monsters.length > 0 ? monsters.reduce((sum, card) => sum + (card.level || 0), 0) / monsters.length : 0;
      return {
        archetype,
        monsters: monsters.length,
        spells: spells.length,
        traps: traps.length,
        avgAtk: Math.round(avgAtk),
        avgDef: Math.round(avgDef),
        avgLevel: Math.round(avgLevel * 10) / 10,
      };
    });
  };

  const calculateEffectTypeDistribution = () => {
    const effectTypes = [
      { key: "effect_search", label: "Search" },
      { key: "effect_destroy", label: "Destroy" },
      { key: "effect_negate", label: "Negate" },
      { key: "effect_draw", label: "Draw" },
      { key: "effect_special_summon", label: "Special Summon" },
      { key: "effect_banish", label: "Banish" },
      { key: "effect_send_gy", label: "Send to GY" },
      { key: "effect_recover_lp", label: "Recover LP" },
      { key: "effect_inflict_damage", label: "Inflict Damage" },
      { key: "effect_equip", label: "Equip" },
      { key: "effect_modify_stats", label: "Modify Stats" },
      { key: "effect_protect", label: "Protect" },
      { key: "effect_discard", label: "Discard" },
      { key: "effect_change_position", label: "Change Position" },
      { key: "effect_return", label: "Return" },
      { key: "effect_shuffle", label: "Shuffle" },
      { key: "effect_copy", label: "Copy" },
      { key: "effect_counter", label: "Counter" },
      { key: "effect_token_summon", label: "Token Summon" },
      { key: "effect_deck_manipulation", label: "Deck Manipulation" },
    ];

    const effectCounts = effectTypes.reduce(
        (acc, { key, label }) => {
          const count = deck.filter((card) => card[key as keyof YugiohCard] === 1).length;
          return [...acc, { effect: label, count, fullMark: deck.length }];
        },
        [] as { effect: string; count: number; fullMark: number }[]
    );
    return effectCounts;
  };

  const typeData = calculateTypeDistribution();
  const attributeData = calculateAttributeDistribution();
  const levelData = calculateLevelDistribution();
  const raceData = calculateRaceDistribution();
  const atkDefData = calculateAtkDefDistribution();
  const atkRangesData = calculateAtkRanges();
  const levelAtkData = calculateLevelAtkCorrelation();
  const archetypeRadarData = calculateArchetypeRadarData();
  const effectTypeData = calculateEffectTypeDistribution();

  // Click-Handler für die Charts
  const handlePieClick = (data: any, category: string, index: number) => {
    const { name } = data;
    let cardsInCategory: YugiohCard[] = [];
    switch (category) {
      case "Card Type":
        cardsInCategory = deck.filter((card) => card.human_readable_card_type === name);
        break;
      case "Attribute":
        cardsInCategory = deck.filter((card) => card.attribute === name);
        break;
      case "Race":
        cardsInCategory = deck.filter((card) => card.race === name);
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
    const level = Number.parseInt(name.split(" ")[1]);
    const cardsInCategory = deck.filter((card) => card.level === level);
    setSelectedCategory(`${name} (Level)`);
    setFilteredCards(cardsInCategory);
    setModalOpen(true);
    setActiveIndex(index);
  };

  const handleAtkRangeClick = (data: any) => {
    const { range } = data;
    const [min, max] = range.split("-").map(Number);
    let cardsInCategory: YugiohCard[];
    if (range === "3001+") {
      cardsInCategory = deck.filter((card) => card.atk !== null && card.atk > 3000);
    } else {
      cardsInCategory = deck.filter(
          (card) => card.atk !== null && card.atk >= min && card.atk <= max
      );
    }
    setSelectedCategory(`ATK ${range}`);
    setFilteredCards(cardsInCategory);
    setModalOpen(true);
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
      <>
        <div className="mt-6 space-y-10">
          {/* Basic Charts Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Basic Charts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Type Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of card types in your deck (click to view cards)
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ChartContainer
                      config={typeData.reduce((acc, item, index) => {
                        acc[item.name] = {
                          label: item.name,
                          color: COLORS[index % COLORS.length],
                        };
                        return acc;
                      }, {} as Record<string, { label: string; color: string }>)}
                  >
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
                          label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          onClick={(data, index) => handlePieClick(data, "Card Type", index)}
                          className="cursor-pointer"
                      >
                        {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attribute Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of monster attributes (click to view cards)
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ChartContainer
                      config={attributeData.reduce((acc, item, index) => {
                        acc[item.name] = {
                          label: item.name,
                          color: COLORS[index % COLORS.length],
                        };
                        return acc;
                      }, {} as Record<string, { label: string; color: string }>)}
                  >
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
                          label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          onClick={(data, index) => handlePieClick(data, "Attribute", index)}
                          className="cursor-pointer"
                      >
                        {attributeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Level Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of monster levels (click to view cards)
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={levelData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                      <YAxis />
                      <Tooltip
                          formatter={(value, name) => [`${value} cards`, "Count"]}
                          labelFormatter={(label) => `${label}`}
                      />
                      <Bar
                          dataKey="value"
                          fill="hsl(var(--chart-1))"
                          radius={[4, 4, 0, 0]}
                          onClick={(data, index) => handleBarClick(data, index)}
                          className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Race Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of monster races/types (click to view cards)
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ChartContainer
                      config={raceData.reduce((acc, item, index) => {
                        acc[item.name] = {
                          label: item.name,
                          color: COLORS[index % COLORS.length],
                        };
                        return acc;
                      }, {} as Record<string, { label: string; color: string }>)}
                  >
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
                          label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          onClick={(data, index) => handlePieClick(data, "Race", index)}
                          className="cursor-pointer"
                      >
                        {raceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Advanced Charts Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Advanced Charts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ATK Range Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of monster ATK values by range (click to view cards)
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={atkRangesData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} interval={0} />
                      <YAxis />
                      <Tooltip
                          formatter={(value, name) => [`${value} cards`, "Count"]}
                          labelFormatter={(label) => `ATK ${label}`}
                      />
                      <Bar
                          dataKey="count"
                          fill="hsl(var(--chart-3))"
                          radius={[4, 4, 0, 0]}
                          onClick={(data) => handleAtkRangeClick(data)}
                          className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Level vs ATK Correlation</CardTitle>
                  <CardDescription>Average ATK value by monster level</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={levelAtkData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip
                          formatter={(value, name) =>
                              [value, name === "avgAtk" ? "Avg ATK" : "Card Count"]
                          }
                          labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="avgAtk" name="Avg ATK" stroke="hsl(var(--chart-2))" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="count" name="Card Count" stroke="hsl(var(--chart-4))" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ATK vs DEF Scatter Plot</CardTitle>
                  <CardDescription>
                    Relationship between monster ATK and DEF values
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="atk" name="ATK" domain={[0, "dataMax + 500"]} />
                      <YAxis type="number" dataKey="def" name="DEF" domain={[0, "dataMax + 500"]} />
                      <ZAxis type="number" dataKey="level" range={[50, 400]} name="Level" />
                      <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          formatter={(value, name) => [value, name]}
                          labelFormatter={(label) => `Card: ${atkDefData[label]?.name}`}
                      />
                      <Legend />
                      <Scatter name="Monsters" data={atkDefData} fill="hsl(var(--chart-5))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Archetype Radar Analysis</CardTitle>
                  <CardDescription>
                    Comparison of deck archetypes by key metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {archetypeRadarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={archetypeRadarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="archetype" />
                          <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
                          <Radar name="Monsters" dataKey="monsters" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                          <Radar name="Spells" dataKey="spells" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                          <Radar name="Traps" dataKey="traps" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} />
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No archetype data available
                      </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Effect Types Distribution</CardTitle>
                  <CardDescription>
                    Analysis of card effect types in your deck
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={effectTypeData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="effect" />
                      <PolarRadiusAxis angle={30} domain={[0, "auto"]} />
                      <Radar name="Cards with Effect" dataKey="count" stroke="hsl(var(--chart-7))" fill="hsl(var(--chart-7))" fillOpacity={0.6} />
                      <Tooltip formatter={(value, name) => [`${value} cards`, name]} labelFormatter={(label) => `${label} Effect`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Comparison Charts Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Comparison Charts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Archetype Comparison</CardTitle>
                  <CardDescription>
                    Detailed comparison of archetypes in your deck
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  {archetypeRadarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={archetypeRadarData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="archetype" />
                          <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" />
                          <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-4))" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="monsters" name="Monsters" fill="hsl(var(--chart-1))" />
                          <Bar yAxisId="left" dataKey="spells" name="Spells" fill="hsl(var(--chart-2))" />
                          <Bar yAxisId="left" dataKey="traps" name="Traps" fill="hsl(var(--chart-3))" />
                          <Bar yAxisId="right" dataKey="avgAtk" name="Avg ATK" fill="hsl(var(--chart-4))" />
                          <Bar yAxisId="right" dataKey="avgDef" name="Avg DEF" fill="hsl(var(--chart-5))" />
                        </BarChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No archetype data available
                      </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monster Level Distribution</CardTitle>
                  <CardDescription>Mana curve equivalent for Yu-Gi-Oh</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={levelData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" scale="point" padding={{ left: 20, right: 20 }} />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [`${value} cards`, "Count"]} labelFormatter={(label) => `${label}`} />
                      <Bar
                          dataKey="value"
                          fill="hsl(var(--chart-6))"
                          background={{ fill: "rgba(0, 0, 0, 0.05)" }}
                          onClick={(data, index) => handleBarClick(data, index)}
                          className="cursor-pointer"
                      >
                        {levelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 8) + 1}))`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Card Type Composition</CardTitle>
                  <CardDescription>
                    Proportional breakdown of card types
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          onClick={(data, index) => handlePieClick(data, "Card Type", index)}
                          className="cursor-pointer"
                      >
                        {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                          formatter={(value, name, props) => [
                            `${value} cards (${((value / deck.length) * 100).toFixed(1)}%)`,
                            props.payload.name,
                          ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Effect Types Comparison</CardTitle>
                  <CardDescription>
                    Detailed breakdown of card effects in your deck
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={effectTypeData} layout="vertical" margin={{ top: 20, right: 30, left: 150, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="effect" width={140} tick={{ fontSize: 12 }} />
                      <Tooltip
                          formatter={(value, name) => [
                            `${value} cards (${((value / deck.length) * 100).toFixed(1)}%)`,
                            "Cards",
                          ]}
                      />
                      <Legend />
                      <Bar dataKey="count" name="Cards with Effect" fill="hsl(var(--chart-7))" radius={[0, 4, 4, 0]}>
                        {effectTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 8) + 1}))`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Detailed Statistics Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Detailed Statistics</h2>
            <Card>
              <CardHeader>
                <CardTitle>Detailed Statistics</CardTitle>
                <CardDescription>Advanced metrics about your deck</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Card Type Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {typeData.map((type) => (
                            <div
                                key={type.name}
                                className="flex justify-between cursor-pointer hover:bg-muted p-2 rounded-md"
                                onClick={() => {
                                  const cardsInCategory = deck.filter(
                                      (card) => card.human_readable_card_type === type.name
                                  );
                                  setSelectedCategory(`${type.name} (Card Type)`);
                                  setFilteredCards(cardsInCategory);
                                  setModalOpen(true);
                                }}
                            >
                              <span>{type.name}:</span>
                              <span className="font-medium">{type.value}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Attribute Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {attributeData.map((attr) => (
                            <div
                                key={attr.name}
                                className="flex justify-between cursor-pointer hover:bg-muted p-2 rounded-md"
                                onClick={() => {
                                  const cardsInCategory = deck.filter(
                                      (card) => card.attribute === attr.name
                                  );
                                  setSelectedCategory(`${attr.name} (Attribute)`);
                                  setFilteredCards(cardsInCategory);
                                  setModalOpen(true);
                                }}
                            >
                              <span>{attr.name}:</span>
                              <span className="font-medium">{attr.value}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Level Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {levelData.map((level) => (
                            <div
                                key={level.name}
                                className="flex justify-between cursor-pointer hover:bg-muted p-2 rounded-md"
                                onClick={() => {
                                  const levelNum = Number.parseInt(level.name.split(" ")[1]);
                                  const cardsInCategory = deck.filter((card) => card.level === levelNum);
                                  setSelectedCategory(`${level.name} (Level)`);
                                  setFilteredCards(cardsInCategory);
                                  setModalOpen(true);
                                }}
                            >
                              <span>{level.name}:</span>
                              <span className="font-medium">{level.value}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Race/Type Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {raceData.map((race) => (
                            <div
                                key={race.name}
                                className="flex justify-between cursor-pointer hover:bg-muted p-2 rounded-md"
                                onClick={() => {
                                  const cardsInCategory = deck.filter((card) => card.race === race.name);
                                  setSelectedCategory(`${race.name} (Race)`);
                                  setFilteredCards(cardsInCategory);
                                  setModalOpen(true);
                                }}
                            >
                              <span>{race.name}:</span>
                              <span className="font-medium">{race.value}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Archetype Analysis</h3>
                      <div>
                        {Array.from(new Set(deck.map((card) => card.archetype).filter(Boolean))).map(
                            (archetype) => (
                                <div
                                    key={archetype}
                                    className="flex justify-between mb-2 cursor-pointer hover:bg-muted p-2 rounded-md"
                                    onClick={() => {
                                      const cardsInCategory = deck.filter(
                                          (card) => card.archetype === archetype
                                      );
                                      setSelectedCategory(`${archetype} (Archetype)`);
                                      setFilteredCards(cardsInCategory);
                                      setModalOpen(true);
                                    }}
                                >
                                  <span>{archetype}:</span>
                                  <span className="font-medium">
                              {deck.filter((card) => card.archetype === archetype).length} cards
                            </span>
                                </div>
                            )
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Effect Types Analysis</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {effectTypeData
                            .filter((effect) => effect.count > 0)
                            .map((effect) => (
                                <div
                                    key={effect.effect}
                                    className="flex justify-between cursor-pointer hover:bg-muted p-2 rounded-md"
                                    onClick={() => {
                                      const effectKey = Object.keys(deck[0] || {}).find(
                                          (key) =>
                                              key.startsWith("effect_") &&
                                              key.substring(7).replace(/_/g, " ").toLowerCase() === effect.effect.toLowerCase()
                                      );
                                      if (effectKey) {
                                        const cardsInCategory = deck.filter(
                                            (card) => card[effectKey as keyof YugiohCard] === 1
                                        );
                                        setSelectedCategory(`${effect.effect} Effect`);
                                        setFilteredCards(cardsInCategory);
                                        setModalOpen(true);
                                      }
                                    }}
                                >
                                  <span>{effect.effect}:</span>
                                  <span className="font-medium">{effect.count}</span>
                                </div>
                            ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>
        </div>

        <CardDetailModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            cards={filteredCards}
            categoryName={selectedCategory}
        />
      </>
  );
}

function DeckAnalyticsSkeleton() {
  return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        </div>
      </div>
  );
}

export default Analytics;
