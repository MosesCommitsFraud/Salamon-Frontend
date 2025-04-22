"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface YugiohCard {
  id: number
  name: string
  // Other card properties...
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

interface EffectData {
  effect: string
  value: number
  fullMark: number
}

export function RadarChart({ card }: { card: YugiohCard }) {
  // Map card effects to radar data
  const effectsMap = [
    { key: "effect_search", label: "Search", description: "Searches cards from the deck" },
    { key: "effect_destroy", label: "Destroy", description: "Destroys cards on the field" },
    { key: "effect_negate", label: "Negate", description: "Negates effects or actions" },
    { key: "effect_draw", label: "Draw", description: "Draws additional cards" },
    { key: "effect_special_summon", label: "Special Summon", description: "Special summons monsters" },
    { key: "effect_banish", label: "Banish", description: "Removes cards from play" },
    { key: "effect_send_gy", label: "Send to GY", description: "Sends cards to the graveyard" },
    { key: "effect_recover_lp", label: "Recover LP", description: "Recovers life points" },
    { key: "effect_inflict_damage", label: "Inflict Damage", description: "Deals damage to opponent" },
    { key: "effect_equip", label: "Equip", description: "Equips to other cards" },
    { key: "effect_modify_stats", label: "Modify Stats", description: "Changes ATK/DEF values" },
    { key: "effect_protect", label: "Protect", description: "Protects cards from effects" },
    { key: "effect_discard", label: "Discard", description: "Discards cards from hand" },
    { key: "effect_change_position", label: "Change Position", description: "Changes battle positions" },
    { key: "effect_return", label: "Return", description: "Returns cards to hand/deck" },
    { key: "effect_shuffle", label: "Shuffle", description: "Shuffles cards in deck" },
    { key: "effect_copy", label: "Copy", description: "Copies effects of other cards" },
    { key: "effect_counter", label: "Counter", description: "Uses or manipulates counters" },
    { key: "effect_token_summon", label: "Token Summon", description: "Summons token monsters" },
    { key: "effect_deck_manipulation", label: "Deck Manipulation", description: "Manipulates the deck order" },
  ]

  // Filter out effects that are not present in the card
  const data: EffectData[] = effectsMap
      .filter(
          (effect) => card[effect.key as keyof YugiohCard] !== undefined && card[effect.key as keyof YugiohCard] !== 0,
      )
      .map((effect) => ({
        effect: effect.label,
        value: Number(card[effect.key as keyof YugiohCard]) || 0,
        fullMark: 5, // Maximum possible value for any effect
      }))

  // Count how many effects are present
  const effectCount = data.length

  // Get present effects for the list display
  const presentEffects = effectsMap.filter(
      (effect) => card[effect.key as keyof YugiohCard] !== undefined && card[effect.key as keyof YugiohCard] !== 0
  )

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const effectName = payload[0].payload.effect
      const effectValue = payload[0].value
      const effectInfo = effectsMap.find(e => e.label === effectName)

      return (
          <div className="bg-slate-900 border border-blue-900/30 p-2 rounded-md shadow-lg">
            <p className="text-blue-300 font-semibold">{effectName}</p>
            <p className="text-blue-300/70 text-sm">{effectInfo?.description}</p>
            <p className="text-blue-300">Strength: {effectValue}/5</p>
          </div>
      )
    }
    return null
  }

  // If no effects are present, show a placeholder
  if (data.length === 0) {
    return (
        <div className="space-y-6">
          <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20">
              <CardTitle className="text-lg text-blue-300">Effect Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-full flex items-center justify-center">
                <p className="text-blue-300/70 text-center">This card has no effect data to display in the radar chart.</p>
              </div>
            </CardContent>
          </Card>
        </div>
    )
  }

  return (
      <div className="space-y-6">
        <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-blue-300">Effect Radar</CardTitle>
              <Badge className="bg-blue-900/30 text-blue-200">
                {effectCount} Effect{effectCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="effect" stroke="#94a3b8" />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#64748b" />
                  <Radar
                      name={card.name}
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RechartsRadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70 border-blue-900/20 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-950/50 to-blue-900/20">
            <CardTitle className="text-lg text-blue-300">Card Effects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
              {presentEffects.map((effect) => {
                const effectValue = card[effect.key as keyof YugiohCard] as number
                return (
                    <div key={effect.key} className="flex items-center justify-between p-2 rounded-md bg-slate-800/30 border border-blue-900/20">
                      <div className="flex-1 mr-2">
                        <p className="text-blue-300 font-medium">{effect.label}</p>
                        <p className="text-blue-300/70 text-xs">{effect.description}</p>
                      </div>
                      <div className="flex shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-5 mx-0.5 rounded-sm ${i < effectValue ? 'bg-blue-500' : 'bg-slate-700'}`}
                            />
                        ))}
                      </div>
                    </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}