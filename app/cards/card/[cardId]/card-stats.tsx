"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

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
  // Optional effect types
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

export function CardStats({ card }: { card: YugiohCard }) {
  // Ensure card object has all required properties with default values
  if (!card) {
    return <div className="text-center text-blue-300">No card data available</div>;
  }

  // Safely count the number of words in the card description
  const wordCount = card.desc ? card.desc.split(/\s+/).filter(Boolean).length : 0;

  // Safely count effect types
  const effectCount = Object.keys(card || {})
      .filter(key => key.startsWith("effect_") && card[key as keyof YugiohCard])
      .length;

  // Calculate a complexity score (simple algorithm) - with safety checks
  const complexityScore = Math.min(10, Math.round((wordCount / 20) + (effectCount * 1.5)));

  // Determine if the card is a staple
  const isStaple = card.is_staple === 1;

  // Determine versatility based on number of different effects
  const versatilityScore = Math.min(10, effectCount * 2);

  // Calculate power level safely
  const powerLevel = calculatePowerLevel(card);

  // Create data for the bar chart - explicitly set values
  const statsData = [
    {
      name: "Complexity",
      value: complexityScore,
      fill: "#3b82f6" // Blue color
    },
    {
      name: "Versatility",
      value: versatilityScore,
      fill: "#8b5cf6" // Purple color
    },
    {
      name: "Power",
      value: powerLevel,
      fill: "#ef4444" // Red color
    },
  ];

  // Simplified component with fixed values and proper error handling
  return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard title="Word Count" value={wordCount} description="Words in text" />
          <StatCard title="Effects" value={effectCount} description="Effect types" />
          <StatCard title="Staple" value={isStaple ? "Yes" : "No"} description="Meta relevance" />
        </div>

        <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20 py-2">
            <CardTitle className="text-sm text-blue-300">Card Metrics</CardTitle>
            <CardDescription className="text-xs text-blue-300/70">Analysis of card strength and utility</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={statsData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis domain={[0, 10]} stroke="#64748b" />
                  <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                              <div className="bg-slate-900 border border-blue-900/30 p-2 rounded-md shadow-lg">
                                <p className="text-blue-300 text-sm">{payload[0].name}: {payload[0].value}</p>
                              </div>
                          );
                        }
                        return null;
                      }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20 py-2">
            <CardTitle className="text-sm text-blue-300">Card Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ScrollArea className="h-[120px]">
              <div className="space-y-2 text-sm">
                <p>
                  <strong className="text-blue-300">Text Length:</strong>{" "}
                  <span className="text-blue-300/70">{getTextLengthDescription(wordCount)}</span>
                </p>
                <p>
                  <strong className="text-blue-300">Complexity:</strong>{" "}
                  <span className="text-blue-300/70">{getComplexityDescription(complexityScore)}</span>
                </p>
                <p>
                  <strong className="text-blue-300">Versatility:</strong>{" "}
                  <span className="text-blue-300/70">{getVersatilityDescription(versatilityScore)}</span>
                </p>
                <p>
                  <strong className="text-blue-300">Power Level:</strong>{" "}
                  <span className="text-blue-300/70">{getPowerDescription(powerLevel)}</span>
                </p>
                {effectCount > 0 && (
                    <div className="pt-2">
                      <strong className="text-blue-300">Key Effects:</strong>{" "}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.keys(card)
                            .filter(key => key.startsWith("effect_") && card[key as keyof YugiohCard])
                            .map(key => (
                                <Badge key={key} className="bg-blue-900/30 text-blue-200">
                                  {key.replace('effect_', '').replace('_', ' ')}
                                </Badge>
                            ))
                        }
                      </div>
                    </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
  )
}

function StatCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
      <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20 p-2">
          <CardTitle className="text-xs font-medium text-blue-300">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="text-lg font-bold text-blue-300">{value}</div>
          <p className="text-xs text-blue-300/70">{description}</p>
        </CardContent>
      </Card>
  )
}

// Helper functions with better error handling
function calculatePowerLevel(card: YugiohCard): number {
  if (!card) return 0;

  let score = 0;

  // Add points for monster stats - with null/undefined checks
  if (card.atk !== null && card.atk !== undefined) {
    score += Math.min(3, Math.floor(card.atk / 1000) || 0);
  }

  if (card.defense !== null && card.defense !== undefined) {
    score += Math.min(2, Math.floor(card.defense / 1000) || 0);
  }

  // Add points for powerful effects - with explicit null/undefined checks
  if (card.effect_negate) score += 2;
  if (card.effect_destroy) score += 1.5;
  if (card.effect_special_summon) score += 1.5;
  if (card.effect_banish) score += 1.5;
  if (card.effect_search) score += 1;

  // Staple cards are generally powerful
  if (card.is_staple === 1) score += 2;

  // Cap at 10 and ensure we return a valid number
  return Math.min(10, Math.round(score || 0));
}

function getTextLengthDescription(wordCount: number): string {
  if (wordCount < 20) return "Short text - easy to understand and apply.";
  if (wordCount < 50) return "Medium length text - contains moderate detail.";
  return "Long text - contains extensive effects and conditions.";
}

function getComplexityDescription(score: number): string {
  if (score <= 3) return "Simple card with straightforward effects.";
  if (score <= 6) return "Moderate complexity with some conditional effects.";
  return "Complex card with multiple effects and conditions.";
}

function getVersatilityDescription(score: number): string {
  if (score <= 3) return "Specialized card with focused utility.";
  if (score <= 6) return "Moderately versatile with a few different applications.";
  return "Highly versatile card that can be used in many situations.";
}

function getPowerDescription(score: number): string {
  if (score <= 3) return "Low impact card that may be situationally useful.";
  if (score <= 6) return "Solid card with good utility in the right deck.";
  return "Powerful card that can significantly impact the game state.";
}