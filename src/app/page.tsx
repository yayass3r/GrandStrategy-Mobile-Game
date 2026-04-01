'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useGameStore } from '@/store/game-store'
import { calculateProduction, getRebellionRisk, calculateArmyPower, getAvailableTechs, getConstructableBuildings, getBuildingBonuses } from '@/game/engine'
import {
  PopulationStatus, GovernorType, TraitType, ResourceType,
  type City, type GovernorData, type Army, type GameNotification, type BattleResult,
  UnitType, TechBranch, TechId, TECH_DEFS,
  type EventNotification, type EventChoice,
  FactionPersonality, DiplomaticStatus, VictoryType,
  PERSONALITY_CONFIG, DIPLOMATIC_STATUS_LABELS,
} from '@/game/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Crown, Shield, Swords, Wheat, Coins, Hammer, Package, BookOpen,
  Users, Heart, Star, MapPin, ChevronRight, Play, RotateCcw,
  AlertTriangle, Bell, Castle, UserPlus, UserMinus, ArrowRightLeft,
  TrendingUp, TrendingDown, Skull, Info, Flame, X, Trophy,
  Beaker, Microscope, Lock, CheckCircle2, Zap, Flag, Handshake,
} from 'lucide-react'

// ---- Helper Components ----

const StatusBadge: React.FC<{ status: PopulationStatus }> = ({ status }) => {
  const config: Record<PopulationStatus, { label: string; className: string }> = {
    [PopulationStatus.Enthusiastic]: { label: 'متحمس', className: 'bg-emerald-600 text-white' },
    [PopulationStatus.Happy]: { label: 'سعيد', className: 'bg-green-600 text-white' },
    [PopulationStatus.Normal]: { label: 'عادي', className: 'bg-amber-700 text-white' },
    [PopulationStatus.Discontent]: { label: 'ساخط', className: 'bg-orange-600 text-white' },
    [PopulationStatus.Angry]: { label: 'غاضب', className: 'bg-red-600 text-white' },
    [PopulationStatus.Desperate]: { label: 'يائس', className: 'bg-red-900 text-white' },
  }
  const c = config[status]
  return <Badge className={c.className}>{c.label}</Badge>
}

const GovernorTypeBadge: React.FC<{ type: GovernorType }> = ({ type }) => {
  const config: Record<GovernorType, { label: string; icon: React.ReactNode; className: string }> = {
    [GovernorType.Economic]: { label: 'اقتصادي', icon: <Coins className="w-3 h-3" />, className: 'bg-amber-700 text-white' },
    [GovernorType.Military]: { label: 'عسكري', icon: <Swords className="w-3 h-3" />, className: 'bg-red-700 text-white' },
    [GovernorType.Defensive]: { label: 'دفاعي', icon: <Shield className="w-3 h-3" />, className: 'bg-blue-700 text-white' },
  }
  const c = config[type]
  return <Badge className={`${c.className} gap-1`}>{c.icon} {c.label}</Badge>
}

const TraitBadge: React.FC<{ type: TraitType; magnitude: number }> = ({ type, magnitude }) => {
  const isPositive = ![
    TraitType.Corrupt, TraitType.Cruel, TraitType.Lazy,
    TraitType.Reckless, TraitType.Cowardly, TraitType.Greedy, TraitType.Incompetent,
  ].includes(type)

  const labels: Record<TraitType, string> = {
    [TraitType.Charismatic]: 'كاريزمي',
    [TraitType.Brilliant]: 'عبقري',
    [TraitType.Frugal]: 'مقتصد',
    [TraitType.Inspiring]: 'ملهم',
    [TraitType.Energetic]: 'نشيط',
    [TraitType.Lucky]: 'محظوظ',
    [TraitType.Experienced]: 'متمرس',
    [TraitType.Loyal]: 'مخلص',
    [TraitType.Corrupt]: 'فاسد',
    [TraitType.Cruel]: 'قاسي',
    [TraitType.Lazy]: 'كسول',
    [TraitType.Reckless]: 'متهور',
    [TraitType.Cowardly]: 'جبان',
    [TraitType.Greedy]: 'طماع',
    [TraitType.Incompetent]: 'غير كفء',
    [TraitType.Ambitious]: 'طموح',
    [TraitType.Cautious]: 'حذر',
    [TraitType.Diplomatic]: 'دبلوماسي',
    [TraitType.Traditional]: 'تقليدي',
  }

  return (
    <Badge variant="outline" className={`${isPositive ? 'border-emerald-600 text-emerald-400' : 'border-red-600 text-red-400'} text-xs`}>
      {labels[type]} ({Math.round(magnitude * 100)}%)
    </Badge>
  )
}

const NotificationIcon: React.FC<{ category: GameNotification['category'] }> = ({ category }) => {
  switch (category) {
    case 'military': return <Swords className="w-3.5 h-3.5 text-red-400" />
    case 'economic': return <Coins className="w-3.5 h-3.5 text-amber-400" />
    case 'political': return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
    case 'info': return <Info className="w-3.5 h-3.5 text-blue-400" />
  }
}

// ---- Battle Result Modal ----

const BattleResultModal: React.FC = () => {
  const { showBattleResult, dismissBattleResult } = useGameStore()

  if (!showBattleResult) return null

  const result = showBattleResult
  const outcomeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    attacker_victory: { label: 'انتصار المهاجمين', color: 'text-emerald-400', icon: <Swords className="w-8 h-8" /> },
    defender_victory: { label: 'انتصار المدافعين', color: 'text-blue-400', icon: <Shield className="w-8 h-8" /> },
    stalemate: { label: 'تعادل', color: 'text-amber-400', icon: <ArrowRightLeft className="w-8 h-8" /> },
    city_captured: { label: 'احتلال المدينة', color: 'text-red-400', icon: <Trophy className="w-8 h-8" /> },
  }

  const config = outcomeConfig[result.outcome]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="bg-card border-[#3d3425] max-w-lg mx-4 w-full">
        <CardHeader className="text-center pb-3">
          <div className={`flex items-center justify-center gap-3 ${config.color}`}>
            {config.icon}
            <CardTitle className="text-2xl">{config.label}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {result.attackerName} ⚔ {result.defenderCityName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Power comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1410] rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">المهاجمون</p>
              <p className="text-xl font-bold text-red-400">{result.attackerPower}</p>
              <p className="text-xs text-muted-foreground mt-1">القوة</p>
            </div>
            <div className="bg-[#1a1410] rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">المدافعون</p>
              <p className="text-xl font-bold text-blue-400">{result.defenderPower}</p>
              <p className="text-xs text-muted-foreground mt-1">القوة</p>
            </div>
          </div>

          {/* Army compositions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1a1410] rounded p-3">
              <p className="text-xs font-semibold mb-2"> troop المهاجمون</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🗡️ مشاة</span>
                  <span>{result.attackerComposition.infantry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🐎 فرسان</span>
                  <span>{result.attackerComposition.cavalry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🏹 رماة</span>
                  <span>{result.attackerComposition.archers}</span>
                </div>
                <Separator className="bg-[#2d2619] my-1" />
                <div className="flex justify-between text-red-400">
                  <span>خسائر</span>
                  <span>-{result.attackerTotalLosses}</span>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1410] rounded p-3">
              <p className="text-xs font-semibold mb-2">المدافعون</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🗡️ مشاة</span>
                  <span>{result.defenderComposition.infantry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🐎 فرسان</span>
                  <span>{result.defenderComposition.cavalry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">🏹 رماة</span>
                  <span>{result.defenderComposition.archers}</span>
                </div>
                <Separator className="bg-[#2d2619] my-1" />
                <div className="flex justify-between text-red-400">
                  <span>خسائر</span>
                  <span>-{result.defenderTotalLosses}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extra info */}
          <div className="flex gap-2 flex-wrap text-xs">
            {result.siegeDamage > 0 && (
              <Badge variant="outline" className="border-orange-700 text-orange-400">
                🏗️ ضرر الأسوار: {result.siegeDamage}%
              </Badge>
            )}
            {result.loot > 0 && (
              <Badge variant="outline" className="border-amber-700 text-amber-400">
                💰 نهب: {result.loot} ذهب
              </Badge>
            )}
            {result.defenderCityLoyaltyDrop !== 0 && (
              <Badge variant="outline" className={`border-${result.defenderCityLoyaltyDrop > 0 ? 'emerald' : 'red'}-700 text-${result.defenderCityLoyaltyDrop > 0 ? 'emerald' : 'red'}-400`}>
                ♥ ولاء: {result.defenderCityLoyaltyDrop > 0 ? '+' : ''}{result.defenderCityLoyaltyDrop}
              </Badge>
            )}
          </div>

          {/* Battle log */}
          <div className="bg-[#1a1410] rounded p-3 max-h-40 overflow-y-auto">
            <p className="text-xs font-semibold mb-2">📜 سجل المعركة</p>
            <div className="space-y-1">
              {result.battleLog.map((entry, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">{entry}</p>
              ))}
            </div>
          </div>

          <Button
            onClick={dismissBattleResult}
            className="w-full bg-[#d4a843] text-[#1a1410] hover:bg-[#e0b850]"
          >
            متابعة
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Random Event Modal ----

const RandomEventModal: React.FC = () => {
  const { activeEvent, handleEventChoice, dismissEvent } = useGameStore()

  if (!activeEvent) return null

  const isChoiceEvent = activeEvent.choices && activeEvent.choices.length > 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="bg-card border-[#3d3425] max-w-lg mx-4 w-full">
        <CardHeader className="text-center pb-3">
          <div className="text-4xl mb-2">{activeEvent.icon}</div>
          <CardTitle className="text-xl text-[#d4a843]">{activeEvent.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {activeEvent.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Effect badges for non-choice events */}
          {!isChoiceEvent && activeEvent.effectDescription && (
            <div className="flex flex-wrap gap-2 justify-center">
              {activeEvent.effectDescription.split(', ').map((effect, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={effect.startsWith('-')
                    ? 'border-red-700 text-red-400'
                    : 'border-emerald-700 text-emerald-400'
                  }
                >
                  {effect}
                </Badge>
              ))}
            </div>
          )}

          {/* Choice buttons */}
          {isChoiceEvent && activeEvent.choices!.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleEventChoice(choice.id)}
              className="w-full text-right bg-[#1a1410] border border-[#3d3425] rounded-lg p-4 hover:border-[#d4a843] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-[#d4a843]">{choice.label}</span>
                <Zap className="w-4 h-4 text-[#d4a843]" />
              </div>
              <p className="text-xs text-muted-foreground mb-2">{choice.description}</p>
              <div className="flex flex-wrap gap-1">
                {choice.effects.map((eff, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-[10px] ${eff.value >= 0 ? 'border-emerald-700 text-emerald-400' : 'border-red-700 text-red-400'}`}
                  >
                    {eff.description}
                  </Badge>
                ))}
              </div>
            </button>
          ))}

          {/* Continue button for non-choice events */}
          {!isChoiceEvent && (
            <Button
              onClick={dismissEvent}
              className="w-full bg-[#d4a843] text-[#1a1410] hover:bg-[#e0b850]"
            >
              متابعة
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Tech Tree Panel ----

const BRANCH_CONFIG: Record<TechBranch, { label: string; icon: string; color: string }> = {
  [TechBranch.Agriculture]: { label: 'زراعية', icon: '🌾', color: 'text-green-400' },
  [TechBranch.Military]: { label: 'عسكرية', icon: '⚒️', color: 'text-red-400' },
  [TechBranch.Commerce]: { label: 'تجارية', icon: '💰', color: 'text-amber-400' },
  [TechBranch.Culture]: { label: 'ثقافية', icon: '🕌', color: 'text-blue-400' },
}

const TechTreePanel: React.FC = () => {
  const {
    researchedTechs, currentResearch, researchPerTurn, startTechResearch,
  } = useGameStore()

  const allTechs = useGameStore(state => getAvailableTechs(state))

  const [activeBranch, setActiveBranch] = useState<TechBranch>(TechBranch.Agriculture)

  const branchTechs = allTechs.filter(t => t.tech.branch === activeBranch)

  const currentResearchTech = currentResearch ? TECH_DEFS[currentResearch.techId] : null

  return (
    <div className="space-y-3">
      {/* Current Research Progress */}
      <Card className="bg-card border-[#3d3425]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1">
            <Microscope className="w-4 h-4 text-blue-400" /> البحث العلمي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentResearchTech ? (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold">{currentResearchTech.icon} {currentResearchTech.name}</span>
                <span className="text-muted-foreground">
                  {Math.round(currentResearch.progress)}/{currentResearchTech.researchCost}
                </span>
              </div>
              <Progress
                value={(currentResearch.progress / currentResearchTech.researchCost) * 100}
                className="h-2"
              />
              <p className="text-[10px] text-muted-foreground">
                📚 {researchPerTurn.toFixed(1)} نقطة بحث / الدور | {currentResearchTech.effects.map(e => e.description).join(', ')}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-1">
              لا يوجد بحث جارٍ — اختر تقنية من الأسفل
            </p>
          )}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>✅ التقنيات المكتشفة: {researchedTechs.length}/24</span>
            <span>📚 بحث/الدور: {researchPerTurn.toFixed(1)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tech Tree */}
      <Card className="bg-card border-[#3d3425]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1">
            <Beaker className="w-4 h-4 text-blue-400" /> شجرة التقنيات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Branch tabs */}
          <div className="flex border-b border-[#3d3425] px-3">
            {(Object.values(TechBranch) as TechBranch[]).map(branch => (
              <button
                key={branch}
                onClick={() => setActiveBranch(branch)}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeBranch === branch
                    ? `border-[#d4a843] ${BRANCH_CONFIG[branch].color}`
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {BRANCH_CONFIG[branch].icon} {BRANCH_CONFIG[branch].label}
              </button>
            ))}
          </div>

          {/* Tech list */}
          <ScrollArea className="max-h-72">
            <div className="p-3 space-y-2">
              {branchTechs.map(techInfo => {
                const tech = techInfo.tech
                const isResearched = researchedTechs.some(t => t.id === tech.id)
                const isCurrent = techInfo.isCurrent

                return (
                  <div
                    key={tech.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      isResearched
                        ? 'border-emerald-700/50 bg-emerald-950/20'
                        : isCurrent
                          ? 'border-[#d4a843] bg-[#d4a843]/10'
                          : techInfo.available
                            ? 'border-[#3d3425] bg-[#1a1410] hover:border-[#8a7e6b] cursor-pointer'
                            : 'border-[#2d2619] bg-[#0d0b08] opacity-50'
                    }`}
                    onClick={() => {
                      if (techInfo.available && !isResearched && !isCurrent) {
                        startTechResearch(tech.id)
                      }
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{tech.icon}</span>
                        <div>
                          <p className="text-sm font-semibold">{tech.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            المستوى {tech.tier} | تكلفة: {tech.researchCost} نقطة
                          </p>
                        </div>
                      </div>
                      {isResearched && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {!isResearched && !techInfo.available && (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mb-2">{tech.description}</p>

                    {/* Prerequisite */}
                    {tech.prerequisite && (
                      <p className="text-[10px] text-muted-foreground mb-1">
                        🔗 يتطلب: {TECH_DEFS[tech.prerequisite].icon} {TECH_DEFS[tech.prerequisite].name}
                      </p>
                    )}

                    {/* Effects */}
                    <div className="flex flex-wrap gap-1">
                      {tech.effects.map((eff, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="border-[#d4a843]/50 text-[#d4a843] text-[10px]"
                        >
                          {eff.description}
                        </Badge>
                      ))}
                    </div>

                    {/* Research progress for current */}
                    {isCurrent && currentResearch && (
                      <div className="mt-2">
                        <Progress
                          value={(currentResearch.progress / tech.researchCost) * 100}
                          className="h-1.5"
                        />
                        <p className="text-[10px] text-[#d4a843] mt-0.5">
                          🔬 {Math.round(currentResearch.progress)}/{tech.researchCost}
                        </p>
                      </div>
                    )}

                    {/* Status reason */}
                    {!isResearched && !isCurrent && (
                      <p className="text-[10px] text-muted-foreground mt-1">{techInfo.reason}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Map Canvas ----

const GameMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    cities, armies, selectedCityId, selectCity,
    gameStarted,
  } = useGameStore()

  const canvasWidth = 800
  const canvasHeight = 600

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvasWidth / rect.width
    const scaleY = canvasHeight / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Check if clicked on a city
    for (const city of cities) {
      const dx = x - city.x
      const dy = y - city.y
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        selectCity(city.id)
        return
      }
    }
    selectCity(null)
  }, [cities, selectCity])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#1a1410'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw grid
    ctx.strokeStyle = '#2d2619'
    ctx.lineWidth = 0.5
    for (let x = 0; x < canvasWidth; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasHeight)
      ctx.stroke()
    }
    for (let y = 0; y < canvasHeight; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasWidth, y)
      ctx.stroke()
    }

    // Draw terrain texture (desert dots)
    ctx.fillStyle = '#2a2215'
    for (let i = 0; i < 200; i++) {
      const tx = Math.random() * canvasWidth
      const ty = Math.random() * canvasHeight
      ctx.beginPath()
      ctx.arc(tx, ty, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw army movement paths
    for (const army of armies) {
      const originCity = cities.find(c => c.id === army.originCityId)
      const targetCity = cities.find(c => c.id === army.targetCityId)
      if (!originCity || !targetCity) continue

      ctx.strokeStyle = '#c0392b88'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(originCity.x, originCity.y)
      ctx.lineTo(targetCity.x, targetCity.y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw cities
    for (const city of cities) {
      const isSelected = city.id === selectedCityId
      const isCapital = city.isCapital

      // City glow
      if (isSelected) {
        const gradient = ctx.createRadialGradient(city.x, city.y, 0, city.x, city.y, 30)
        gradient.addColorStop(0, '#d4a84366')
        gradient.addColorStop(1, '#d4a84300')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(city.x, city.y, 30, 0, Math.PI * 2)
        ctx.fill()
      }

      // City base
      ctx.fillStyle = isSelected ? '#d4a843' : isCapital ? '#c9953a' : '#8a7e6b'
      ctx.beginPath()
      if (isCapital) {
        // Star shape for capital
        const spikes = 5
        const outerRadius = 14
        const innerRadius = 7
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (Math.PI * i) / spikes - Math.PI / 2
          const px = city.x + Math.cos(angle) * r
          const py = city.y + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
      } else {
        ctx.arc(city.x, city.y, 10, 0, Math.PI * 2)
      }
      ctx.fill()

      // City border
      ctx.strokeStyle = isSelected ? '#f0d080' : '#d4a84366'
      ctx.lineWidth = 2
      ctx.stroke()

      // City name
      ctx.fillStyle = isSelected ? '#f0d080' : '#e8dcc8'
      ctx.font = isCapital ? 'bold 13px sans-serif' : '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(city.name, city.x, city.y - 18)

      // Population
      const totalPop = city.population.children + city.population.adults + city.population.elderly
      ctx.fillStyle = '#8a7e6b'
      ctx.font = '9px sans-serif'
      ctx.fillText(`${totalPop}`, city.x, city.y + 22)

      // Loyalty indicator (small bar under city)
      const barWidth = 20
      const barHeight = 3
      ctx.fillStyle = '#3d3425'
      ctx.fillRect(city.x - barWidth / 2, city.y + 26, barWidth, barHeight)
      const loyaltyColor = city.loyalty > 50 ? '#27ae60' : city.loyalty > 25 ? '#f39c12' : '#c0392b'
      ctx.fillStyle = loyaltyColor
      ctx.fillRect(city.x - barWidth / 2, city.y + 26, barWidth * (city.loyalty / 100), barHeight)
    }

    // Draw armies
    for (const army of armies) {
      if (!army.isMoving) continue
      ctx.fillStyle = '#c0392b'
      ctx.beginPath()
      // Draw as a small sword/diamond
      ctx.moveTo(army.x, army.y - 8)
      ctx.lineTo(army.x + 6, army.y)
      ctx.lineTo(army.x, army.y + 8)
      ctx.lineTo(army.x - 6, army.y)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#e74c3c'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#e8dcc8'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${army.soldierCount} ⚔`, army.x, army.y + 18)
    }
  }, [cities, armies, selectedCityId])

  if (!gameStarted) return null

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={handleCanvasClick}
      className="game-map-canvas w-full rounded-lg border border-[#3d3425] cursor-pointer"
      style={{ aspectRatio: '800/600' }}
    />
  )
}

// ---- City Detail Panel ----

const CityDetailPanel: React.FC = () => {
  const { selectedCityId, cities, armies, assignGovernorToCity, dismissGovernorFromCity, recruitFromCity, createArmyFromCity, availableGovernors, refreshAvailableGovernors, buildInCity } = useGameStore()
  const [recruitCount, setRecruitCount] = useState(10)
  const [showGovernors, setShowGovernors] = useState(false)
  const [selectedTargetCity, setSelectedTargetCity] = useState<string>('')

  const city = cities.find(c => c.id === selectedCityId)

  if (!city) {
    return (
      <Card className="bg-card border-[#3d3425]">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
          <MapPin className="w-12 h-12 mb-3 opacity-30" />
          <p>اختر مدينة من الخريطة</p>
          <p className="text-sm mt-1">انقر على مدينة لعرض التفاصيل</p>
        </CardContent>
      </Card>
    )
  }

  const production = calculateProduction(city)
  const totalPop = city.population.children + city.population.adults + city.population.elderly
  const totalWorkers = Object.values(city.labor).reduce((s, v) => s + v, 0)
  const rebellionRisk = getRebellionRisk(city.loyalty)
  const otherCities = cities.filter(c => c.id !== city.id)

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-4 p-1">
        {/* City Header */}
        <Card className="bg-card border-[#3d3425]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {city.isCapital && <Crown className="w-5 h-5 text-[#d4a843]" />}
                <CardTitle className="text-xl text-[#d4a843]">{city.name}</CardTitle>
                {city.isCapital && <Badge className="bg-[#d4a843] text-[#1a1410]">عاصمة</Badge>}
              </div>
              <StatusBadge status={city.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Population */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1"><Users className="w-4 h-4" /> السكان</span>
                <span className="font-bold">{totalPop} / {city.maxPopulation}</span>
              </div>
              <Progress value={(totalPop / city.maxPopulation) * 100} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>👶 أطفال: {city.population.children}</span>
                <span>🧑 بالغون: {city.population.adults}</span>
                <span>👴 كبار: {city.population.elderly}</span>
              </div>
            </div>

            <Separator className="bg-[#3d3425]" />

            {/* Loyalty & Happiness */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Star className="w-4 h-4" /> الولاء</span>
                  <span className={`font-bold ${city.loyalty > 50 ? 'text-emerald-400' : city.loyalty > 25 ? 'text-amber-400' : 'text-red-400'}`}>
                    {Math.round(city.loyalty)}%
                  </span>
                </div>
                <Progress value={city.loyalty} className="h-2" />
                <p className="text-xs text-muted-foreground">خطر التمرد: <span className={rebellionRisk !== 'لا يوجد' ? 'text-red-400' : ''}>{rebellionRisk}</span></p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Heart className="w-4 h-4" /> السعادة</span>
                  <span className={`font-bold ${city.happiness > 60 ? 'text-emerald-400' : city.happiness > 30 ? 'text-amber-400' : 'text-red-400'}`}>
                    {Math.round(city.happiness)}%
                  </span>
                </div>
                <Progress value={city.happiness} className="h-2" />
              </div>
            </div>

            <Separator className="bg-[#3d3425]" />

            {/* Labor Distribution */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Hammer className="w-4 h-4 text-[#d4a843]" /> توزيع العمال ({totalWorkers})
              </h4>
              <div className="space-y-1.5">
                {[
                  { key: 'farming' as const, label: '🌾 زراعة', value: city.labor.farming },
                  { key: 'commerce' as const, label: '💰 تجارة', value: city.labor.commerce },
                  { key: 'industry' as const, label: '⚙️ صناعة', value: city.labor.industry },
                  { key: 'construction' as const, label: '🏗️ بناء', value: city.labor.construction },
                  { key: 'mining' as const, label: '⛏️ تعدين', value: city.labor.mining },
                  { key: 'religion' as const, label: '🕌 دين', value: city.labor.religion },
                  { key: 'research' as const, label: '📚 بحث', value: city.labor.research },
                  { key: 'unemployed' as const, label: 'Idle عاطلون', value: city.labor.unemployed },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#2d2619] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.key === 'unemployed' ? 'bg-orange-600' : 'bg-[#d4a843]'}`}
                          style={{ width: `${totalWorkers > 0 ? (item.value / totalWorkers) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-8 text-left">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-[#3d3425]" />

            {/* Production */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-[#d4a843]" /> الإنتاج / الدور
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { icon: <Wheat className="w-4 h-4 text-green-400" />, label: 'طعام', value: production.food, net: production.foodNet },
                  { icon: <Coins className="w-4 h-4 text-amber-400" />, label: 'ذهب', value: production.gold },
                  { icon: <Hammer className="w-4 h-4 text-orange-400" />, label: 'إنتاج', value: production.production },
                  { icon: <Package className="w-4 h-4 text-stone-400" />, label: 'مواد', value: production.materials },
                  { icon: <BookOpen className="w-4 h-4 text-blue-400" />, label: 'بحث', value: production.research },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 bg-[#1a1410] rounded p-2">
                    {item.icon}
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="font-bold">{item.value.toFixed(1)}</p>
                      {item.net !== undefined && (
                        <p className={`text-xs ${item.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.net >= 0 ? '+' : ''}{item.net.toFixed(1)} صافي
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">📋 استهلاك الطعام: {production.foodConsumption.toFixed(1)}</p>
            </div>

            <Separator className="bg-[#3d3425]" />

            {/* Buildings */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Hammer className="w-4 h-4 text-[#d4a843]" /> المباني
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {getConstructableBuildings(city).map(item => {
                  const current = city.buildings[item.type];
                  const def = item.def;
                  const levelMultiplier = 1 + current.level * 0.5;
                  const goldCost = Math.round(def.goldCost * levelMultiplier);
                  const matCost = Math.round(def.materialCost * levelMultiplier);
                  const isUnderConstruction = current.turnsToComplete > 0;

                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        if (item.canBuild && !isUnderConstruction) buildInCity(city.id, item.type);
                      }}
                      disabled={!item.canBuild || isUnderConstruction}
                      className={`text-right p-2 rounded-lg border transition-colors text-xs ${
                        current.level > 0
                          ? 'border-[#d4a843]/50 bg-[#1a1410]'
                          : 'border-[#3d3425] bg-[#0d0b08]'
                      } ${item.canBuild && !isUnderConstruction ? 'hover:border-[#d4a843] cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{def.icon} {def.name}</span>
                        <span className="text-[10px] text-[#d4a843]">
                          {current.level > 0 ? `م.${current.level}` : '-'}
                        </span>
                      </div>

                      {isUnderConstruction && (
                        <div className="mb-1">
                          <p className="text-[10px] text-amber-400">🏗️ جارٍ البناء ({current.turnsToComplete} دورات)</p>
                          <Progress value={(1 - current.turnsToComplete / (def.buildTurns + Math.floor((current.level - 1) * 1.5))) * 100} className="h-1 mt-0.5" />
                        </div>
                      )}

                      {current.level < def.maxLevel && !isUnderConstruction && (
                        <div className="text-[10px] text-muted-foreground">
                          💰{goldCost} 📦{matCost}
                          {item.reason && <span className="text-red-400 block">{item.reason}</span>}
                        </div>
                      )}

                      {current.level >= def.maxLevel && (
                        <span className="text-[10px] text-emerald-400">✅ أقصى مستوى</span>
                      )}

                      {current.level > 0 && !isUnderConstruction && current.level < def.maxLevel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.canBuild) buildInCity(city.id, item.type);
                          }}
                          disabled={!item.canBuild}
                          className="mt-1 w-full text-[10px] bg-[#d4a843]/20 text-[#d4a843] rounded px-2 py-0.5 hover:bg-[#d4a843]/30 disabled:opacity-40"
                        >
                          ترقية ← م.{current.level + 1}
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const bonuses = getBuildingBonuses(city);
                const activeBonuses = Object.entries(bonuses).filter(([, v]) => v > 0);
                if (activeBonuses.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {activeBonuses.map(([key, val]) => (
                      <Badge key={key} variant="outline" className="border-[#d4a843]/50 text-[#d4a843] text-[10px]">
                        {key.replace(/_/g, ' ')} +{val}%
                      </Badge>
                    ))}
                  </div>
                );
              })()}
            </div>

            <Separator className="bg-[#3d3425]" />

            {/* Military */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Swords className="w-4 h-4 text-red-400" /> القوات العسكرية
              </h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">الجنود</span>
                <span className="font-bold text-red-300">{city.soldierCount}</span>
              </div>
              {/* Army composition display */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                <div className="bg-[#1a1410] rounded p-1.5 text-center">
                  <p className="text-muted-foreground">🗡️</p>
                  <p className="font-bold">{city.garrisonComposition.infantry}</p>
                  <p className="text-[10px] text-muted-foreground">مشاة</p>
                </div>
                <div className="bg-[#1a1410] rounded p-1.5 text-center">
                  <p className="text-muted-foreground">🐎</p>
                  <p className="font-bold">{city.garrisonComposition.cavalry}</p>
                  <p className="text-[10px] text-muted-foreground">فرسان</p>
                </div>
                <div className="bg-[#1a1410] rounded p-1.5 text-center">
                  <p className="text-muted-foreground">🏹</p>
                  <p className="font-bold">{city.garrisonComposition.archers}</p>
                  <p className="text-[10px] text-muted-foreground">رماة</p>
                </div>
              </div>
              {/* Wall level */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">🏰 مستوى الأسوار</span>
                <span className="font-bold">{city.wallLevel} / 5</span>
              </div>
              <Progress value={(city.wallLevel / 5) * 100} className="h-1.5 mb-2" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <UserPlus className="w-3 h-3" />
                    <span className="text-xs">تجنيد</span>
                    <span className="text-xs text-muted-foreground mr-auto">{recruitCount}</span>
                  </div>
                  <Slider
                    min={1}
                    max={Math.max(1, city.labor.unemployed)}
                    value={[recruitCount]}
                    onValueChange={([v]) => setRecruitCount(v)}
                    className="w-full"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1 border-[#3d3425] text-xs"
                    onClick={() => {
                      recruitFromCity(city.id, recruitCount)
                    }}
                  >
                    <UserPlus className="w-3 h-3 ml-1" /> تجنيد {recruitCount}
                  </Button>
                </div>
              </div>
              {otherCities.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span className="text-xs">إرسال جيش</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedTargetCity}
                      onChange={(e) => setSelectedTargetCity(e.target.value)}
                      className="flex-1 bg-[#1a1410] border border-[#3d3425] rounded text-xs p-1.5 text-foreground"
                    >
                      <option value="">اختر الهدف...</option>
                      {otherCities.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-800 text-red-400 hover:bg-red-900/30 text-xs"
                      disabled={!selectedTargetCity || city.soldierCount < 5}
                      onClick={() => {
                        if (selectedTargetCity) {
                          createArmyFromCity(city.id, selectedTargetCity)
                          setSelectedTargetCity('')
                        }
                      }}
                    >
                      <Swords className="w-3 h-3 ml-1" /> إرسال
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-[#3d3425]" />

            {/* Governor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <Castle className="w-4 h-4 text-[#d4a843]" /> الحاكم
                </h4>
                {city.governor && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 text-xs h-7"
                    onClick={() => dismissGovernorFromCity(city.id)}
                  >
                    <UserMinus className="w-3 h-3 ml-1" /> عزل
                  </Button>
                )}
              </div>

              {city.governor ? (
                <div className="bg-[#1a1410] rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{city.governor.name}</span>
                    <GovernorTypeBadge type={city.governor.type} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-muted-foreground">المستوى: <span className="text-foreground">{city.governor.level}</span></span>
                    <span className="text-muted-foreground">الأداء: <span className="text-foreground">{city.governor.competence}%</span></span>
                    <span className="text-muted-foreground">الولاء: <span className="text-foreground">{city.governor.loyalty}%</span></span>
                    <span className="text-muted-foreground">الدور: <span className="text-foreground">{city.governor.turnsInOffice}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {city.governor.traits.map((t, i) => (
                      <TraitBadge key={i} type={t.type} magnitude={t.magnitude} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📋 {city.governor.currentAction}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">لا يوجد حاكم - التعيين يزيد الولاء</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#3d3425] text-xs"
                      onClick={() => setShowGovernors(!showGovernors)}
                    >
                      <UserPlus className="w-3 h-3 ml-1" />
                      {showGovernors ? 'إخفاء' : 'تعيين حاكم'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={refreshAvailableGovernors}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                  {showGovernors && (
                    <div className="space-y-2 mt-2">
                      {availableGovernors.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center">لا يوجد حكام متاحون حالياً</p>
                      ) : (
                        availableGovernors.map(gov => (
                          <div key={gov.id} className="bg-[#1a1410] rounded p-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold">{gov.name}</p>
                              <GovernorTypeBadge type={gov.type} />
                              <div className="flex flex-wrap gap-1 mt-1">
                                {gov.traits.map((t, i) => (
                                  <TraitBadge key={i} type={t.type} magnitude={t.magnitude} />
                                ))}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="bg-[#d4a843] text-[#1a1410] hover:bg-[#e0b850] text-xs h-8"
                              onClick={() => {
                                assignGovernorToCity(city.id, gov)
                                setShowGovernors(false)
                              }}
                            >
                              تعيين
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

// ---- Notifications Panel ----

const NotificationsPanel: React.FC = () => {
  const { notifications } = useGameStore()
  const recent = notifications.slice(0, 15)

  return (
    <Card className="bg-card border-[#3d3425]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1">
          <Bell className="w-4 h-4 text-[#d4a843]" /> الأحداث
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-48">
          <div className="space-y-1 px-4 pb-3">
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">لا توجد أحداث</p>
            ) : (
              recent.map(n => (
                <div key={n.id} className="flex items-start gap-2 py-1.5 border-b border-[#2d2619] last:border-0">
                  <NotificationIcon category={n.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground">دور {n.turn}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ---- Faction Panel ----

const FactionPanel: React.FC = () => {
  const { factions, victory } = useGameStore();
  
  return (
    <Card className="bg-card border-[#3d3425]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1">
          <Flag className="w-4 h-4 text-[#d4a843]" /> الفصائل ({factions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-40">
          <div className="space-y-1 px-4 pb-3">
            {factions.map(faction => {
              const config = PERSONALITY_CONFIG[faction.personality];
              return (
                <div key={faction.id} className="flex items-center justify-between py-2 border-b border-[#2d2619] last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: faction.color }} />
                    <div>
                      <p className="text-xs font-semibold">{faction.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{config.icon} {config.label}</span>
                        <span>🏙️ {faction.cityCount}</span>
                        <span>⚔️ {faction.armyCount}</span>
                        <span>💰 {faction.treasury}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge variant="outline" className={`text-[10px] ${
                      faction.isAtWar ? 'border-red-600 text-red-400' :
                      faction.diplomaticStatus === DiplomaticStatus.Allied ? 'border-blue-600 text-blue-400' :
                      faction.diplomaticStatus === DiplomaticStatus.Peace ? 'border-emerald-600 text-emerald-400' :
                      'border-[#3d3425] text-muted-foreground'
                    }`}>
                      {faction.isAtWar ? '⚔️ حرب' : DIPLOMATIC_STATUS_LABELS[faction.diplomaticStatus]}
                    </Badge>
                    <p className={`text-[10px] mt-0.5 ${faction.relationWithPlayer >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {faction.relationWithPlayer >= 0 ? '♥' : '💔'} {faction.relationWithPlayer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Victory Progress */}
        <div className="px-4 pb-3 space-y-2 border-t border-[#2d2619] pt-2">
          <p className="text-[10px] font-semibold text-muted-foreground">📊 تقدم النصر</p>
          <div className="space-y-1">
            {[
              { label: '⚔️ سيطرة', value: victory.dominationProgress, color: 'bg-red-500' },
              { label: '📚 حضارة', value: victory.culturalProgress, color: 'bg-blue-500' },
              { label: '💰 اقتصاد', value: victory.economicProgress, color: 'bg-amber-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-[10px]">
                <span className="w-16 text-muted-foreground">{item.label}</span>
                <div className="flex-1 h-1.5 bg-[#2d2619] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
                <span className="w-8 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ---- Diplomacy Modal ----

const DiplomacyModal: React.FC = () => {
  const showDiplomacyModal = useGameStore(state => state.showDiplomacyModal);
  const handleDiplomaticChoice = useGameStore(state => state.handleDiplomaticChoice);
  const dismissDiplomacy = useGameStore(state => state.dismissDiplomacy);
  const factions = useGameStore(state => state.factions);
  
  if (!showDiplomacyModal) return null;
  
  const action = showDiplomacyModal;
  const faction = factions.find(f => f.id === action.factionId);
  if (!faction) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <Card className="bg-card border-[#3d3425] max-w-md mx-4 w-full">
        <CardHeader className="text-center pb-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: faction.color }} />
            <CardTitle className="text-lg text-[#d4a843]">{faction.name}</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{action.message}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {action.effects && action.effects.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {action.effects.map((eff, i) => (
                <Badge key={i} variant="outline" className="border-amber-700 text-amber-400">{eff.description}</Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => handleDiplomaticChoice(action.id, 'accept')} className="flex-1 bg-emerald-700 hover:bg-emerald-600">
              ✓ قبول
            </Button>
            <Button onClick={() => handleDiplomaticChoice(action.id, 'reject')} variant="outline" className="flex-1 border-red-800 text-red-400 hover:bg-red-900/30">
              ✗ رفض
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ---- Victory Screen ----

const VictoryScreen: React.FC = () => {
  const { victory, showVictoryScreen, dismissVictory } = useGameStore();
  
  if (!showVictoryScreen || !victory.victoryAchieved) return null;
  
  const isDefeat = victory.victoryType === null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
      <Card className="bg-card border-[#3d3425] max-w-md mx-4 w-full text-center">
        <CardContent className="py-8 space-y-4">
          <div className="text-6xl">{isDefeat ? '💀' : '🏆'}</div>
          <h2 className={`text-2xl font-bold ${isDefeat ? 'text-red-400' : 'text-[#d4a843]'}`}>
            {isDefeat ? 'هزيمة!' : 'نصر!'}
          </h2>
          <p className="text-muted-foreground leading-relaxed">{victory.victoryMessage}</p>
          {victory.victoryType && (
            <Badge className="bg-[#d4a843] text-[#1a1410] text-sm px-4 py-1">
              {victory.victoryType === VictoryType.Domination ? '⚔️ سيطرة' :
               victory.victoryType === VictoryType.Cultural ? '📚 حضارة' : '💰 اقتصاد'}
            </Badge>
          )}
          <Button onClick={dismissVictory} className="bg-[#d4a843] text-[#1a1410] hover:bg-[#e0b850]">
            متابعة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ---- Armies Panel ----

const ArmiesPanel: React.FC = () => {
  const { armies, cities } = useGameStore()

  return (
    <Card className="bg-card border-[#3d3425]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1">
          <Swords className="w-4 h-4 text-red-400" /> الجيوش ({armies.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-36">
          <div className="space-y-1 px-4 pb-3">
            {armies.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">لا توجد جيوش</p>
            ) : (
              armies.map(army => {
                const origin = cities.find(c => c.id === army.originCityId)
                const target = cities.find(c => c.id === army.targetCityId)
                return (
                  <div key={army.id} className="flex items-center justify-between py-1.5 border-b border-[#2d2619] last:border-0">
                    <div>
                      <p className="text-xs font-semibold">{army.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {origin?.name} → {target?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        🗡️{army.composition.infantry} 🐎{army.composition.cavalry} 🏹{army.composition.archers}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ⭐ خبرة: {army.experience}% | 🏆 {army.battlesWon} | 💀 {army.battlesLost}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-red-300">{army.soldierCount} ⚔</p>
                      {army.isMoving && (
                        <p className="text-[10px] text-muted-foreground">
                          {Math.round(army.movementProgress * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ---- Title Screen ----

const TitleScreen: React.FC = () => {
  const { startGame } = useGameStore()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1410] via-[#231e16] to-[#1a1410]" />
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, #d4a843 35px, #d4a843 36px)',
        }}
      />

      <div className="relative z-10 text-center space-y-6">
        <Crown className="w-20 h-20 text-[#d4a843] mx-auto" />
        <h1 className="text-6xl font-bold text-[#d4a843]" style={{ fontFamily: 'serif' }}>
          فُتُوح
        </h1>
        <p className="text-xl text-[#8a7e6b]">إستراتيجية الفتوحات الكبرى</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          قُد إمبراطوريتك عبر المدن والجيوش. عيّن الحكام، أدِر الموارد، وحافظ على ولاء شعبك.
        </p>
        <Button
          onClick={startGame}
          className="bg-[#d4a843] text-[#1a1410] hover:bg-[#e0b850] text-lg px-12 py-6 font-bold"
        >
          <Play className="w-5 h-5 ml-2" /> ابدأ الفتوح
        </Button>
        <div className="flex items-center justify-center gap-8 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><Wheat className="w-4 h-4" /> موارد</div>
          <div className="flex items-center gap-1"><Users className="w-4 h-4" /> سكان</div>
          <div className="flex items-center gap-1"><Castle className="w-4 h-4" /> حكام</div>
          <div className="flex items-center gap-1"><Swords className="w-4 h-4" /> جيوش</div>
        </div>
      </div>
    </div>
  )
}

// ---- Game Over Screen ----

const GameOverScreen: React.FC = () => {
  const { turn, cities, startGame } = useGameStore()
  const totalPop = cities.reduce((s, c) => s + c.population.children + c.population.adults + c.population.elderly, 0)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="bg-card border-red-900 max-w-md mx-4">
        <CardHeader className="text-center">
          <Skull className="w-16 h-16 text-red-500 mx-auto mb-2" />
          <CardTitle className="text-2xl text-red-400">انتهت اللعبة</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">سقطت إمبراطوريتك بعد {turn} دور</p>
          <p className="text-sm">إجمالي السكان المتبقي: {totalPop}</p>
          <Button
            onClick={startGame}
            className="bg-[#d4a843] text-[#1a1410] hover:bg-[#e0b850]"
          >
            <RotateCcw className="w-4 h-4 ml-2" /> ابدأ من جديد
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Main Game Page ----

export default function Home() {
  const {
    turn, treasury, totalIncome, totalExpenses, taxRate,
    cities, gameStarted, gameOver, setTaxRate, endTurn,
    researchedTechs,
  } = useGameStore()

  if (!gameStarted) return <TitleScreen />
  if (gameOver) return <GameOverScreen />

  const totalPop = cities.reduce((s, c) => s + c.population.children + c.population.adults + c.population.elderly, 0)
  const totalSoldiers = cities.reduce((s, c) => s + c.soldierCount, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Modals */}
      <BattleResultModal />
      <RandomEventModal />
      <DiplomacyModal />
      <VictoryScreen />

      {/* Top Bar */}
      <div className="bg-[#231e16] border-b border-[#3d3425] px-4 py-2">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-[#d4a843]" />
              <span className="font-bold text-[#d4a843]">فُتُوح</span>
            </div>
            <Separator orientation="vertical" className="h-6 bg-[#3d3425]" />
            <div className="text-sm">
              <span className="text-muted-foreground">الدور: </span>
              <span className="font-bold">{turn}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">المدن: </span>
              <span className="font-bold">{cities.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-muted-foreground">السكان:</span>
              <span className="font-bold">{totalPop}</span>
            </div>
            <div className="text-sm flex items-center gap-1">
              <Swords className="w-4 h-4 text-red-400" />
              <span className="text-muted-foreground">الجنود:</span>
              <span className="font-bold">{totalSoldiers}</span>
            </div>
            <div className="text-sm flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-muted-foreground">التقنيات:</span>
              <span className="font-bold text-blue-300">{researchedTechs.length}/24</span>
            </div>
            <div className="text-sm flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-muted-foreground">الخزينة:</span>
              <span className={`font-bold ${treasury < 0 ? 'text-red-400' : 'text-amber-300'}`}>
                {Math.round(treasury)} 🪙
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline text-emerald-400" /> {totalIncome.toFixed(1)}
              <TrendingDown className="w-3 h-3 inline text-red-400 ml-1 mr-1" /> {totalExpenses.toFixed(1)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground text-xs">الضرائب:</span>
              <Slider
                min={0}
                max={50}
                step={1}
                value={[Math.round(taxRate * 100)]}
                onValueChange={([v]) => setTaxRate(v / 100)}
                className="w-20"
              />
              <span className="text-xs font-bold w-8">{Math.round(taxRate * 100)}%</span>
            </div>
            <Button
              onClick={endTurn}
              className="bg-[#d4a843] text-[#1a1410] hover:bg-[#e0b850] font-bold"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              دور تالي
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map (left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="map" className="w-full">
              <TabsList className="bg-[#231e16] border border-[#3d3425]">
                <TabsTrigger value="map" className="data-[state=active]:bg-[#d4a843] data-[state=active]:text-[#1a1410]">
                  🗺️ الخريطة
                </TabsTrigger>
                <TabsTrigger value="cities" className="data-[state=active]:bg-[#d4a843] data-[state=active]:text-[#1a1410]">
                  🏙️ المدن
                </TabsTrigger>
              </TabsList>
              <TabsContent value="map">
                <GameMap />
              </TabsContent>
              <TabsContent value="cities">
                <Card className="bg-card border-[#3d3425]">
                  <CardContent className="p-2">
                    <ScrollArea className="max-h-[600px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cities.map(city => {
                          const pop = city.population.children + city.population.adults + city.population.elderly
                          return (
                            <CityCard key={city.id} city={city} population={pop} />
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <CityDetailPanel />
            <TechTreePanel />
            <FactionPanel />
            <ArmiesPanel />
            <NotificationsPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- City Card (for grid view) ----

const CityCard: React.FC<{ city: City; population: number }> = ({ city, population }) => {
  const { selectCity, selectedCityId } = useGameStore()
  const production = calculateProduction(city)

  return (
    <button
      onClick={() => selectCity(city.id === selectedCityId ? null : city.id)}
      className={`text-right bg-[#1a1410] rounded-lg p-3 border transition-colors ${
        city.id === selectedCityId ? 'border-[#d4a843]' : 'border-[#3d3425] hover:border-[#8a7e6b]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {city.isCapital && <Crown className="w-3.5 h-3.5 text-[#d4a843]" />}
          <span className="font-semibold text-sm">{city.name}</span>
        </div>
        <StatusBadge status={city.status} />
      </div>
      <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
        <div>
          <Users className="w-3 h-3 inline" /> {population}
        </div>
        <div>
          <Swords className="w-3 h-3 inline" /> {city.soldierCount}
        </div>
        <div>
          <Star className={`w-3 h-3 inline ${city.loyalty > 50 ? 'text-emerald-400' : 'text-red-400'}`} /> {Math.round(city.loyalty)}%
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs">
        <span className="text-green-400">🌾{production.food.toFixed(0)}</span>
        <span className="text-amber-400">💰{production.gold.toFixed(0)}</span>
        <span className="text-orange-400">🔨{production.production.toFixed(0)}</span>
        <span className="text-stone-400">📦{production.materials.toFixed(0)}</span>
      </div>
      {city.governor && (
        <div className="mt-1.5 flex items-center gap-1">
          <Castle className="w-3 h-3 text-[#d4a843]" />
          <span className="text-[10px] text-muted-foreground">{city.governor.name}</span>
          <GovernorTypeBadge type={city.governor.type} />
        </div>
      )}
    </button>
  )
}
