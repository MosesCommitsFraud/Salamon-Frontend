"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Sword, Sparkles } from "lucide-react"

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
  // Effect properties...
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

interface ComparisonModeProps {
  card: YugiohCard
  comparisonCard: YugiohCard
}

export function ComparisonMode({ card, comparisonCard }: ComparisonModeProps) {
  // Map card effects to radar data
  const effectsMap = [
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
  ]

  // Combine effects from both cards
  const allEffects = new Set<string>()

  effectsMap.forEach((effect) => {
    const key = effect.key as keyof YugiohCard
    if (
        (card[key] !== undefined && card[key] !== 0) ||
        (comparisonCard[key] !== undefined && comparisonCard[key] !== 0)
    ) {
      allEffects.add(effect.key)
    }
  })

  // Create comparison data
  const comparisonData = Array.from(allEffects).map((effectKey) => {
    const effect = effectsMap.find((e) => e.key === effectKey)
    return {
      effect: effect?.label || effectKey.replace("effect_", "").replace("_", " "),
      [card.name]: Number(card[effectKey as keyof YugiohCard]) || 0,
      [comparisonCard.name]: Number(comparisonCard[effectKey as keyof YugiohCard]) || 0,
    }
  })

  // Calculate similarity score based on matching effects
  const calculateSimilarityScore = () => {
    const card1Effects = effectsMap
        .filter(effect => card[effect.key as keyof YugiohCard] && card[effect.key as keyof YugiohCard] !== 0)
        .map(effect => effect.key)

    const card2Effects = effectsMap
        .filter(effect => comparisonCard[effect.key as keyof YugiohCard] && comparisonCard[effect.key as keyof YugiohCard] !== 0)
        .map(effect => effect.key)

    // Calculate Jaccard similarity: intersection / union
    const intersection = card1Effects.filter(effect => card2Effects.includes(effect)).length
    const union = new Set([...card1Effects, ...card2Effects]).size

    return union === 0 ? 0 : Math.round((intersection / union) * 100)
  }

  // If no effects are present, show a placeholder
  if (comparisonData.length === 0) {
    return (
        <div className="space-y-6">
          <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20">
              <CardTitle className="text-lg text-blue-300">Effect Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-blue-300/70 text-center">
                  Neither card has effect data to display in the comparison chart.
                </p>
              </div>
            </CardContent>
          </Card>

          <StatComparison card={card} comparisonCard={comparisonCard} />
        </div>
    )
  }

  const similarityScore = calculateSimilarityScore()

  // Define color for similarity score
  const getSimilarityColor = () => {
    if (similarityScore >= 70) return "text-green-400";
    if (similarityScore >= 40) return "text-yellow-400";
    return "text-red-400";
  }

  return (
      <div className="space-y-6">
        <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-blue-300">Effect Comparison</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-blue-300/70 text-sm">Similarity:</span>
                <Badge className={`${getSimilarityColor()} bg-slate-800/70`}>
                  {similarityScore}%
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={comparisonData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="effect" stroke="#94a3b8" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#64748b" />
                  <Radar
                      name={card.name}
                      dataKey={card.name}
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                  />
                  <Radar
                      name={comparisonCard.name}
                      dataKey={comparisonCard.name}
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.6}
                  />
                  <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e40af",
                        color: "#e2e8f0"
                      }}
                  />
                  <Legend
                      wrapperStyle={{ paddingTop: "10px" }}
                      formatter={(value) => <span style={{ color: "#e2e8f0" }}>{value}</span>}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <StatComparison card={card} comparisonCard={comparisonCard} />
      </div>
  )
}

function StatComparison({ card, comparisonCard }: { card: YugiohCard, comparisonCard: YugiohCard }) {
  // Helper to get style for comparison
  const getComparisonStyle = (val1: number | null, val2: number | null) => {
    if (val1 === null || val2 === null) return "";
    if (val1 > val2) return "text-green-400";
    if (val1 < val2) return "text-red-400";
    return "text-blue-300"; // Equal
  }

  return (
      <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20">
          <CardTitle className="text-lg text-blue-300">Card Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
              <tr>
                <th className="p-2 text-left text-blue-300/70 border-b border-blue-900/30">Stat</th>
                <th className="p-2 text-left text-blue-300 border-b border-blue-900/30">{card.name}</th>
                <th className="p-2 text-left text-purple-300 border-b border-blue-900/30">{comparisonCard.name}</th>
              </tr>
              </thead>
              <tbody>
              <tr>
                <td className="p-2 font-medium text-blue-300/70 border-b border-blue-900/20">Type</td>
                <td className="p-2 text-blue-300 border-b border-blue-900/20">{card.type}</td>
                <td className="p-2 text-purple-300 border-b border-blue-900/20">{comparisonCard.type}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-blue-300/70 border-b border-blue-900/20">ATK</td>
                <td className={`p-2 border-b border-blue-900/20 ${getComparisonStyle(card.atk, comparisonCard.atk)}`}>
                  {card.atk !== null ? (
                      <div className="flex items-center">
                        {card.atk} <Sword className="h-4 w-4 ml-1" />
                      </div>
                  ) : "-"}
                </td>
                <td className={`p-2 border-b border-blue-900/20 ${getComparisonStyle(comparisonCard.atk, card.atk)}`}>
                  {comparisonCard.atk !== null ? (
                      <div className="flex items-center">
                        {comparisonCard.atk} <Sword className="h-4 w-4 ml-1" />
                      </div>
                  ) : "-"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-blue-300/70 border-b border-blue-900/20">DEF</td>
                <td className={`p-2 border-b border-blue-900/20 ${getComparisonStyle(card.defense, comparisonCard.defense)}`}>
                  {card.defense !== null ? (
                      <div className="flex items-center">
                        {card.defense} <Shield className="h-4 w-4 ml-1" />
                      </div>
                  ) : "-"}
                </td>
                <td className={`p-2 border-b border-blue-900/20 ${getComparisonStyle(comparisonCard.defense, card.defense)}`}>
                  {comparisonCard.defense !== null ? (
                      <div className="flex items-center">
                        {comparisonCard.defense} <Shield className="h-4 w-4 ml-1" />
                      </div>
                  ) : "-"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-blue-300/70 border-b border-blue-900/20">Level/Rank</td>
                <td className={`p-2 border-b border-blue-900/20 ${getComparisonStyle(card.level, comparisonCard.level)}`}>
                  {card.level !== null ? (
                      <div className="flex items-center">
                        {card.level} <Sparkles className="h-4 w-4 ml-1 text-yellow-400" />
                      </div>
                  ) : "-"}
                </td>
                <td className={`p-2 border-b border-blue-900/20 ${getComparisonStyle(comparisonCard.level, card.level)}`}>
                  {comparisonCard.level !== null ? (
                      <div className="flex items-center">
                        {comparisonCard.level} <Sparkles className="h-4 w-4 ml-1 text-yellow-400" />
                      </div>
                  ) : "-"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-blue-300/70 border-b border-blue-900/20">Attribute</td>
                <td className="p-2 text-blue-300 border-b border-blue-900/20">{card.attribute || "-"}</td>
                <td className="p-2 text-purple-300 border-b border-blue-900/20">{comparisonCard.attribute || "-"}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-blue-300/70 border-b border-blue-900/20">Race</td>
                <td className="p-2 text-blue-300 border-b border-blue-900/20">{card.race}</td>
                <td className="p-2 text-purple-300 border-b border-blue-900/20">{comparisonCard.race}</td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-blue-300/70 border-b border-blue-900/20">Archetype</td>
                <td className="p-2 text-blue-300 border-b border-blue-900/20">
                  {card.archetype ? (
                      <Badge className="bg-blue-900/30 text-blue-200 hover:bg-blue-800/50">
                        {card.archetype}
                      </Badge>
                  ) : "-"}
                </td>
                <td className="p-2 text-purple-300 border-b border-blue-900/20">
                  {comparisonCard.archetype ? (
                      <Badge className="bg-purple-900/30 text-purple-200 hover:bg-purple-800/50">
                        {comparisonCard.archetype}
                      </Badge>
                  ) : "-"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-blue-300/70 border-b border-blue-900/20">Is Staple</td>
                <td className="p-2 text-blue-300 border-b border-blue-900/20">
                  {card.is_staple === 1 ? (
                      <Badge className="bg-blue-900/30 text-blue-200">Yes</Badge>
                  ) : "No"}
                </td>
                <td className="p-2 text-purple-300 border-b border-blue-900/20">
                  {comparisonCard.is_staple === 1 ? (
                      <Badge className="bg-purple-900/30 text-purple-200">Yes</Badge>
                  ) : "No"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium text-blue-300/70">Ban Status</td>
                <td className="p-2 text-blue-300">
                  {(card.ban_tcg || card.ban_ocg) ? (
                      <div className="flex flex-wrap gap-1">
                        {card.ban_tcg && <Badge className="bg-blue-900/30 text-blue-200">{card.ban_tcg} (TCG)</Badge>}
                        {card.ban_ocg && <Badge className="bg-blue-900/30 text-blue-200">{card.ban_ocg} (OCG)</Badge>}
                      </div>
                  ) : "Not banned"}
                </td>
                <td className="p-2 text-purple-300">
                  {(comparisonCard.ban_tcg || comparisonCard.ban_ocg) ? (
                      <div className="flex flex-wrap gap-1">
                        {comparisonCard.ban_tcg && <Badge className="bg-purple-900/30 text-purple-200">{comparisonCard.ban_tcg} (TCG)</Badge>}
                        {comparisonCard.ban_ocg && <Badge className="bg-purple-900/30 text-purple-200">{comparisonCard.ban_ocg} (OCG)</Badge>}
                      </div>
                  ) : "Not banned"}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
  )
}