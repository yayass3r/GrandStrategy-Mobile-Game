// ============================================================================
// 4X Grand Strategy Game - Type Definitions
// ============================================================================

// ---- Enums ----

export enum LaborType {
  Farming = 'farming',
  Commerce = 'commerce',
  Industry = 'industry',
  Construction = 'construction',
  Mining = 'mining',
  Religion = 'religion',
  Research = 'research',
}

export enum PopulationStatus {
  Normal = 'normal',
  Happy = 'happy',
  Enthusiastic = 'enthusiastic',
  Discontent = 'discontent',
  Angry = 'angry',
  Desperate = 'desperate',
}

export enum GovernorType {
  Economic = 'economic',
  Military = 'military',
  Defensive = 'defensive',
}

export enum GovernorState {
  Idle = 'idle',
  Developing = 'developing',
  Recruiting = 'recruiting',
  BuildingDefense = 'building_defense',
  Trading = 'trading',
  PreparingAttack = 'preparing_attack',
  ReactingToThreat = 'reacting_to_threat',
}

export enum TraitType {
  Charismatic = 'charismatic',
  Brilliant = 'brilliant',
  Frugal = 'frugal',
  Inspiring = 'inspiring',
  Energetic = 'energetic',
  Lucky = 'lucky',
  Experienced = 'experienced',
  Loyal = 'loyal',
  Corrupt = 'corrupt',
  Cruel = 'cruel',
  Lazy = 'lazy',
  Reckless = 'reckless',
  Cowardly = 'cowardly',
  Greedy = 'greedy',
  Incompetent = 'incompetent',
  Ambitious = 'ambitious',
  Cautious = 'cautious',
  Diplomatic = 'diplomatic',
  Traditional = 'traditional',
}

export enum RebellionRisk {
  None = 'none',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Rebellion = 'rebellion',
}

export enum ResourceType {
  Food = 'food',
  Gold = 'gold',
  Production = 'production',
  Materials = 'materials',
  Research = 'research',
}

// ---- Structs ----

export interface PopulationDemographics {
  children: number;
  adults: number;
  elderly: number;
}

export interface LaborDistribution {
  farming: number;
  commerce: number;
  industry: number;
  construction: number;
  mining: number;
  religion: number;
  research: number;
  unemployed: number;
}

export interface GovernorTrait {
  type: TraitType;
  magnitude: number; // typically 0.1 to 1.0
}

export interface CityProduction {
  food: number;
  gold: number;
  production: number;
  materials: number;
  research: number;
  foodConsumption: number;
  foodNet: number;
  happinessBonus: number;
}

// ---- Main Interfaces ----

export interface City {
  id: string;
  name: string;
  x: number;
  y: number;
  isCapital: boolean;
  population: PopulationDemographics;
  labor: LaborDistribution;
  soldierCount: number;
  happiness: number;       // 0-100
  loyalty: number;         // 0-100
  status: PopulationStatus;
  governor: GovernorData | null;
  resources: Record<ResourceType, number>;
  maxPopulation: number;
  growthAccumulator: number; // tracks fractional growth before becoming whole people
  wallLevel: number;         // 0-5, defensive walls
  garrisonComposition: ArmyComposition;
  siegeState: SiegeState | null;
  lastBattleTurn: number;
  timesConquered: number;
  buildings: Record<BuildingType, CityBuilding>;
}

export interface GovernorData {
  id: string;
  name: string;
  type: GovernorType;
  cityId: string;
  level: number;
  loyalty: number;      // 0-100
  competence: number;   // 0-100
  traits: GovernorTrait[];
  state: GovernorState;
  currentAction: string;
  turnsInOffice: number;
}

export interface Army {
  id: string;
  name: string;
  soldierCount: number;
  composition: ArmyComposition;
  experience: number; // 0-100, veteran bonus
  originCityId: string;
  targetCityId: string;
  x: number;
  y: number;
  isMoving: boolean;
  movementProgress: number; // 0.0 to 1.0
  siegeState: SiegeState | null;
  battlesWon: number;
  battlesLost: number;
}

export interface GameNotification {
  id: string;
  turn: number;
  message: string;
  category: 'military' | 'economic' | 'political' | 'info';
  timestamp: number;
}

export interface GameState {
  turn: number;
  treasury: number;
  totalIncome: number;
  totalExpenses: number;
  taxRate: number;       // 0.0 to 1.0
  cities: City[];
  armies: Army[];
  notifications: GameNotification[];
  selectedCityId: string | null;
  selectedArmyId: string | null;
  gameStarted: boolean;
  gameOver: boolean;
  availableGovernors: GovernorData[];
  battleHistory: BattleResult[];
  activeSieges: SiegeState[];
  showBattleResult: BattleResult | null;
  researchedTechs: ResearchedTech[];
  currentResearch: { techId: TechId; progress: number } | null;
  totalResearchPoints: number;
  researchPerTurn: number;
  factions: Faction[];
  diplomaticActions: DiplomaticAction[];
  victory: VictoryState;
  showDiplomacyModal: DiplomaticAction | null;
  showVictoryScreen: boolean;
}

// ==================== COMBAT SYSTEM ====================

// Unit types with rock-paper-scissors balance
export enum UnitType {
  Infantry = 'infantry',
  Cavalry = 'cavalry',
  Archers = 'archers',
}

// Combat modifiers
export enum TerrainType {
  Plains = 'plains',
  Hills = 'hills',
  Mountains = 'mountains',
  Desert = 'desert',
  Forest = 'forest',
  River = 'river',
}

export interface ArmyComposition {
  infantry: number;
  cavalry: number;
  archers: number;
}

export interface BattleResult {
  id: string;
  turn: number;
  attackerArmyId: string;
  attackerName: string;
  attackerOrigin: string;
  defenderCityId: string;
  defenderCityName: string;
  attackerComposition: ArmyComposition;
  defenderComposition: ArmyComposition;
  attackerPower: number;
  defenderPower: number;
  attackerLosses: ArmyComposition;
  defenderLosses: ArmyComposition;
  attackerTotalLosses: number;
  defenderTotalLosses: number;
  outcome: 'attacker_victory' | 'defender_victory' | 'stalemate' | 'city_captured';
  siegeDamage: number;
  loot: number;
  defenderCityLoyaltyDrop: number;
  battleLog: string[];
  timestamp: number;
}

export interface SiegeState {
  cityId: string;
  besiegingArmyId: string;
  turnsUnderSiege: number;
  wallIntegrity: number;
  cityDefeated: boolean;
}

// Unit type effectiveness matrix (attacker -> defender -> multiplier)
export const UNIT_EFFECTIVENESS: Record<UnitType, Record<UnitType, number>> = {
  [UnitType.Infantry]: {
    [UnitType.Infantry]: 1.0,
    [UnitType.Cavalry]: 0.6,
    [UnitType.Archers]: 1.4,
  },
  [UnitType.Cavalry]: {
    [UnitType.Infantry]: 1.5,
    [UnitType.Cavalry]: 1.0,
    [UnitType.Archers]: 0.7,
  },
  [UnitType.Archers]: {
    [UnitType.Infantry]: 1.3,
    [UnitType.Cavalry]: 0.8,
    [UnitType.Archers]: 1.0,
  },
};

// Base stats per unit type
export const UNIT_STATS: Record<UnitType, { attack: number; defense: number; cost: number }> = {
  [UnitType.Infantry]: { attack: 10, defense: 12, cost: 1 },
  [UnitType.Cavalry]: { attack: 18, defense: 8, cost: 2 },
  [UnitType.Archers]: { attack: 14, defense: 6, cost: 1.5 },
};

// ==================== BUILDING SYSTEM ====================

export enum BuildingType {
  Farm = 'farm',
  Market = 'market',
  Barracks = 'barracks',
  Wall = 'wall',
  Mosque = 'mosque',
  Library = 'library',
  Mine = 'mine',
  Workshop = 'workshop',
  Hospital = 'hospital',
  Caravanserai = 'caravanserai',
}

export interface BuildingDef {
  type: BuildingType;
  name: string;
  description: string;
  icon: string;
  goldCost: number;
  materialCost: number;
  productionCost: number;
  buildTurns: number;
  maxLevel: number;
  effects: BuildingEffect[];
  prerequisite: BuildingType | null;
}

export interface BuildingEffect {
  type: 'food' | 'gold' | 'production' | 'materials' | 'research' | 'happiness' | 'population_growth' | 'defense' | 'soldier_capacity' | 'recruitment_speed';
  value: number;
  isPercent: boolean;
}

export interface CityBuilding {
  type: BuildingType;
  level: number;
  turnsToComplete: number;
}

export interface BuildAction {
  cityId: string;
  buildingType: BuildingType;
}

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> = {
  [BuildingType.Farm]: {
    type: BuildingType.Farm, name: 'مزرعة', description: 'تزيد إنتاج الغذاء وتحسن الأمن الغذائي', icon: '🌾',
    goldCost: 50, materialCost: 10, productionCost: 30, buildTurns: 3, maxLevel: 5,
    effects: [{ type: 'food', value: 15, isPercent: true }, { type: 'population_growth', value: 2, isPercent: true }],
    prerequisite: null,
  },
  [BuildingType.Market]: {
    type: BuildingType.Market, name: 'سوق', description: 'يجذب التجار ويزيد الدخل الذهبي', icon: '🏪',
    goldCost: 80, materialCost: 20, productionCost: 40, buildTurns: 4, maxLevel: 5,
    effects: [{ type: 'gold', value: 20, isPercent: true }],
    prerequisite: null,
  },
  [BuildingType.Barracks]: {
    type: BuildingType.Barracks, name: 'ثكنة', description: 'تدرب الجنود وتزيد سعة الجيش', icon: '⚔️',
    goldCost: 100, materialCost: 30, productionCost: 50, buildTurns: 5, maxLevel: 3,
    effects: [{ type: 'soldier_capacity', value: 50, isPercent: false }, { type: 'recruitment_speed', value: 20, isPercent: true }, { type: 'defense', value: 10, isPercent: true }],
    prerequisite: null,
  },
  [BuildingType.Wall]: {
    type: BuildingType.Wall, name: 'سور', description: 'يحمي المدينة من الهجمات والحصارات', icon: '🏰',
    goldCost: 120, materialCost: 50, productionCost: 60, buildTurns: 6, maxLevel: 5,
    effects: [{ type: 'defense', value: 15, isPercent: true }],
    prerequisite: null,
  },
  [BuildingType.Mosque]: {
    type: BuildingType.Mosque, name: 'مسجد', description: 'يرفع الروح المعنوية والسعادة', icon: '🕌',
    goldCost: 60, materialCost: 15, productionCost: 30, buildTurns: 4, maxLevel: 3,
    effects: [{ type: 'happiness', value: 8, isPercent: false }, { type: 'population_growth', value: 3, isPercent: true }],
    prerequisite: null,
  },
  [BuildingType.Library]: {
    type: BuildingType.Library, name: 'مكتبة', description: 'مركز للعلم والمعرفة', icon: '📚',
    goldCost: 90, materialCost: 25, productionCost: 40, buildTurns: 5, maxLevel: 3,
    effects: [{ type: 'research', value: 25, isPercent: true }],
    prerequisite: null,
  },
  [BuildingType.Mine]: {
    type: BuildingType.Mine, name: 'منجم', description: 'يستخرج المعادن والثروات الطبيعية', icon: '⛏️',
    goldCost: 70, materialCost: 10, productionCost: 30, buildTurns: 4, maxLevel: 5,
    effects: [{ type: 'materials', value: 20, isPercent: true }, { type: 'production', value: 10, isPercent: true }],
    prerequisite: null,
  },
  [BuildingType.Workshop]: {
    type: BuildingType.Workshop, name: 'ورشة', description: 'تسرّع البناء والإنتاج الصناعي', icon: '🔨',
    goldCost: 80, materialCost: 20, productionCost: 40, buildTurns: 4, maxLevel: 3,
    effects: [{ type: 'production', value: 20, isPercent: true }],
    prerequisite: BuildingType.Mine,
  },
  [BuildingType.Hospital]: {
    type: BuildingType.Hospital, name: 'مستشفى', description: 'يعالج المرضى ويقلل الوفيات', icon: '🏥',
    goldCost: 100, materialCost: 30, productionCost: 50, buildTurns: 5, maxLevel: 3,
    effects: [{ type: 'population_growth', value: 5, isPercent: true }, { type: 'happiness', value: 5, isPercent: false }],
    prerequisite: BuildingType.Mosque,
  },
  [BuildingType.Caravanserai]: {
    type: BuildingType.Caravanserai, name: 'خان', description: 'محطة تجارية للقوافل', icon: '🐪',
    goldCost: 120, materialCost: 40, productionCost: 60, buildTurns: 5, maxLevel: 3,
    effects: [{ type: 'gold', value: 30, isPercent: true }],
    prerequisite: BuildingType.Market,
  },
};

// ==================== TECHNOLOGY TREE ====================

export enum TechBranch {
  Agriculture = 'agriculture',
  Military = 'military',
  Commerce = 'commerce',
  Culture = 'culture',
}

export enum TechId {
  // Agriculture Branch
  Irrigation = 'irrigation',
  CropRotation = 'crop_rotation',
  SelectiveBreeding = 'selective_breeding',
  IrrigationCanals = 'irrigation_canals',
  AdvancedFarming = 'advanced_farming',
  Granaries = 'granaries',
  // Military Branch
  BronzeWeapons = 'bronze_weapons',
  IronWeapons = 'iron_weapons',
  Siegecraft = 'siegecraft',
  HeavyCavalry = 'heavy_cavalry',
  ArmorPlating = 'armor_plating',
  Gunpowder = 'gunpowder',
  // Commerce Branch
  Coinage = 'coinage',
  TradeRoutes = 'trade_routes',
  Banking = 'banking',
  MerchantFleet = 'merchant_fleet',
  Taxation = 'taxation',
  Guilds = 'guilds',
  // Culture Branch
  Writing = 'writing',
  Mathematics = 'mathematics',
  Medicine = 'medicine',
  Architecture = 'architecture',
  Philosophy = 'philosophy',
  Engineering = 'engineering',
}

export interface TechDef {
  id: TechId;
  name: string;
  description: string;
  icon: string;
  branch: TechBranch;
  researchCost: number;
  prerequisite: TechId | null;
  tier: number;
  effects: TechEffect[];
}

export interface TechEffect {
  type: string;
  value: number;
  isPercent: boolean;
  description: string;
}

export interface ResearchedTech {
  id: TechId;
  completedTurn: number;
}

export const TECH_DEFS: Record<TechId, TechDef> = {
  // ---- Agriculture Branch ----
  [TechId.Irrigation]: {
    id: TechId.Irrigation, name: 'الري', description: 'نظام الري يزيد إنتاج الغذاء', icon: '💧',
    branch: TechBranch.Agriculture, researchCost: 15, prerequisite: null, tier: 1,
    effects: [
      { type: 'food', value: 10, isPercent: true, description: '+10% إنتاج غذاء' },
      { type: 'population_growth', value: 2, isPercent: true, description: '+2% نمو سكاني' },
    ],
  },
  [TechId.CropRotation]: {
    id: TechId.CropRotation, name: 'دورة المحاصيل', description: 'تناوب المحاصيل يحافظ على خصوبة التربة', icon: '🔄',
    branch: TechBranch.Agriculture, researchCost: 25, prerequisite: TechId.Irrigation, tier: 2,
    effects: [
      { type: 'food', value: 15, isPercent: true, description: '+15% إنتاج غذاء' },
      { type: 'materials', value: 5, isPercent: true, description: '+5% مواد' },
    ],
  },
  [TechId.SelectiveBreeding]: {
    id: TechId.SelectiveBreeding, name: 'تحسين السلالات', description: 'تحسين سلالات الحيوانات والنباتات', icon: '🧬',
    branch: TechBranch.Agriculture, researchCost: 30, prerequisite: TechId.CropRotation, tier: 3,
    effects: [
      { type: 'population_growth', value: 5, isPercent: true, description: '+5% نمو سكاني' },
      { type: 'happiness', value: 3, isPercent: false, description: '+3 سعادة' },
    ],
  },
  [TechId.IrrigationCanals]: {
    id: TechId.IrrigationCanals, name: 'قنوات الري', description: 'شبكة قنوات مياه واسعة', icon: '🌊',
    branch: TechBranch.Agriculture, researchCost: 35, prerequisite: TechId.Irrigation, tier: 3,
    effects: [
      { type: 'food', value: 20, isPercent: true, description: '+20% إنتاج غذاء' },
      { type: 'population_growth', value: 3, isPercent: true, description: '+3% نمو سكاني' },
    ],
  },
  [TechId.AdvancedFarming]: {
    id: TechId.AdvancedFarming, name: 'الزراعة المتقدمة', description: 'تقنيات زراعية متطورة', icon: '🌾',
    branch: TechBranch.Agriculture, researchCost: 50, prerequisite: TechId.SelectiveBreeding, tier: 4,
    effects: [
      { type: 'food', value: 25, isPercent: true, description: '+25% إنتاج غذاء' },
      { type: 'happiness', value: 5, isPercent: false, description: '+5 سعادة' },
    ],
  },
  [TechId.Granaries]: {
    id: TechId.Granaries, name: 'مخازن الحبوب', description: 'تخزين الحبوب لفترات القحط', icon: '🏛️',
    branch: TechBranch.Agriculture, researchCost: 40, prerequisite: TechId.IrrigationCanals, tier: 4,
    effects: [
      { type: 'food', value: 15, isPercent: true, description: '+15% إنتاج غذاء' },
      { type: 'defense', value: 5, isPercent: true, description: '+5% دفاع (مقاومة الحصار)' },
    ],
  },
  // ---- Military Branch ----
  [TechId.BronzeWeapons]: {
    id: TechId.BronzeWeapons, name: 'الأسلحة البرونزية', description: 'سيوف ورماح من البرونز المتين', icon: '🗡️',
    branch: TechBranch.Military, researchCost: 20, prerequisite: null, tier: 1,
    effects: [
      { type: 'defense', value: 10, isPercent: true, description: '+10% قوة الجيش' },
    ],
  },
  [TechId.IronWeapons]: {
    id: TechId.IronWeapons, name: 'الأسلحة الحديدية', description: 'حديد أقوى وأصلب', icon: '⚔️',
    branch: TechBranch.Military, researchCost: 35, prerequisite: TechId.BronzeWeapons, tier: 2,
    effects: [
      { type: 'defense', value: 15, isPercent: true, description: '+15% قوة الجيش' },
    ],
  },
  [TechId.Siegecraft]: {
    id: TechId.Siegecraft, name: 'فن الحصار', description: 'المجانيق والأسلحة الثقيلة', icon: '🏗️',
    branch: TechBranch.Military, researchCost: 40, prerequisite: TechId.IronWeapons, tier: 3,
    effects: [
      { type: 'defense', value: 10, isPercent: true, description: '+10% هجوم' },
      { type: 'siege_damage', value: 30, isPercent: false, description: '+30% ضرر حصار' },
    ],
  },
  [TechId.HeavyCavalry]: {
    id: TechId.HeavyCavalry, name: 'الفرسان الثقيلة', description: 'فرسان مدرعة بالكامل', icon: '🐎',
    branch: TechBranch.Military, researchCost: 45, prerequisite: TechId.IronWeapons, tier: 3,
    effects: [
      { type: 'defense', value: 12, isPercent: true, description: '+12% قوة الجيش' },
      { type: 'recruitment_speed', value: 15, isPercent: true, description: '+15% سرعة تجنيد' },
    ],
  },
  [TechId.ArmorPlating]: {
    id: TechId.ArmorPlating, name: 'صناعة الدروع', description: 'دروع معدنية للحماية', icon: '🛡️',
    branch: TechBranch.Military, researchCost: 50, prerequisite: TechId.Siegecraft, tier: 4,
    effects: [
      { type: 'defense', value: 20, isPercent: true, description: '+20% قوة دفاعية' },
      { type: 'soldier_capacity', value: 30, isPercent: false, description: '+30 سعة جيش' },
    ],
  },
  [TechId.Gunpowder]: {
    id: TechId.Gunpowder, name: 'البارود', description: 'اختراع يغير قواعد الحرب', icon: '💥',
    branch: TechBranch.Military, researchCost: 80, prerequisite: TechId.HeavyCavalry, tier: 5,
    effects: [
      { type: 'defense', value: 30, isPercent: true, description: '+30% قوة الجيش' },
      { type: 'siege_damage', value: 50, isPercent: false, description: '+50% ضرر حصار' },
    ],
  },
  // ---- Commerce Branch ----
  [TechId.Coinage]: {
    id: TechId.Coinage, name: 'العملة', description: 'نظام نقدي موحد', icon: '🪙',
    branch: TechBranch.Commerce, researchCost: 15, prerequisite: null, tier: 1,
    effects: [
      { type: 'gold', value: 10, isPercent: true, description: '+10% ذهب' },
    ],
  },
  [TechId.TradeRoutes]: {
    id: TechId.TradeRoutes, name: 'طرق التجارة', description: 'شبكة طرق تجارية بين المدن', icon: '🗺️',
    branch: TechBranch.Commerce, researchCost: 25, prerequisite: TechId.Coinage, tier: 2,
    effects: [
      { type: 'gold', value: 20, isPercent: true, description: '+20% ذهب' },
      { type: 'happiness', value: 2, isPercent: false, description: '+2 سعادة' },
    ],
  },
  [TechId.Banking]: {
    id: TechId.Banking, name: 'البنوك', description: 'نظام مصرفي متطور', icon: '🏦',
    branch: TechBranch.Commerce, researchCost: 40, prerequisite: TechId.TradeRoutes, tier: 3,
    effects: [
      { type: 'gold', value: 25, isPercent: true, description: '+25% ذهب' },
      { type: 'research', value: 10, isPercent: true, description: '+10% بحث' },
    ],
  },
  [TechId.MerchantFleet]: {
    id: TechId.MerchantFleet, name: 'الأسطول التجاري', description: 'سفن تجارية للتبادل البحري', icon: '⛵',
    branch: TechBranch.Commerce, researchCost: 45, prerequisite: TechId.TradeRoutes, tier: 3,
    effects: [
      { type: 'gold', value: 30, isPercent: true, description: '+30% ذهب' },
      { type: 'materials', value: 15, isPercent: true, description: '+15% مواد' },
    ],
  },
  [TechId.Taxation]: {
    id: TechId.Taxation, name: 'نظام الضرائب', description: 'جباية الضرائب بكفاءة', icon: '📋',
    branch: TechBranch.Commerce, researchCost: 35, prerequisite: TechId.Banking, tier: 4,
    effects: [
      { type: 'gold', value: 20, isPercent: true, description: '+20% ذهب' },
      { type: 'happiness', value: -3, isPercent: false, description: '-3 سعادة (ضرائب!)' },
    ],
  },
  [TechId.Guilds]: {
    id: TechId.Guilds, name: 'النقابات', description: 'نقابات حرفية منظمة', icon: '🏢',
    branch: TechBranch.Commerce, researchCost: 50, prerequisite: TechId.MerchantFleet, tier: 4,
    effects: [
      { type: 'production', value: 20, isPercent: true, description: '+20% إنتاج' },
      { type: 'gold', value: 15, isPercent: true, description: '+15% ذهب' },
    ],
  },
  // ---- Culture Branch ----
  [TechId.Writing]: {
    id: TechId.Writing, name: 'الخط والكتابة', description: 'نظام كتابي لتسجيل المعرفة', icon: '✍️',
    branch: TechBranch.Culture, researchCost: 15, prerequisite: null, tier: 1,
    effects: [
      { type: 'research', value: 15, isPercent: true, description: '+15% بحث' },
    ],
  },
  [TechId.Mathematics]: {
    id: TechId.Mathematics, name: 'الرياضيات', description: 'علوم الأعداد والهندسة', icon: '📐',
    branch: TechBranch.Culture, researchCost: 25, prerequisite: TechId.Writing, tier: 2,
    effects: [
      { type: 'research', value: 20, isPercent: true, description: '+20% بحث' },
      { type: 'production', value: 5, isPercent: true, description: '+5% إنتاج' },
    ],
  },
  [TechId.Medicine]: {
    id: TechId.Medicine, name: 'الطب', description: 'فن الشفاء والمعالجة', icon: '⚕️',
    branch: TechBranch.Culture, researchCost: 30, prerequisite: TechId.Mathematics, tier: 3,
    effects: [
      { type: 'population_growth', value: 5, isPercent: true, description: '+5% نمو سكاني' },
      { type: 'happiness', value: 5, isPercent: false, description: '+5 سعادة' },
    ],
  },
  [TechId.Architecture]: {
    id: TechId.Architecture, name: 'الهندسة المعمارية', description: 'بناء القلاع والقصور', icon: '🏛️',
    branch: TechBranch.Culture, researchCost: 35, prerequisite: TechId.Mathematics, tier: 3,
    effects: [
      { type: 'production', value: 15, isPercent: true, description: '+15% إنتاج بناء' },
      { type: 'defense', value: 8, isPercent: true, description: '+8% دفاع (تحصينات أفضل)' },
    ],
  },
  [TechId.Philosophy]: {
    id: TechId.Philosophy, name: 'الفلسفة', description: 'الفكر النقدي والحكم', icon: '📖',
    branch: TechBranch.Culture, researchCost: 40, prerequisite: TechId.Medicine, tier: 4,
    effects: [
      { type: 'happiness', value: 8, isPercent: false, description: '+8 سعادة' },
      { type: 'loyalty', value: 5, isPercent: false, description: '+5 ولاء' },
    ],
  },
  [TechId.Engineering]: {
    id: TechId.Engineering, name: 'الهندسة المتقدمة', description: 'تقنيات هندسية مبتكرة', icon: '⚙️',
    branch: TechBranch.Culture, researchCost: 60, prerequisite: TechId.Architecture, tier: 5,
    effects: [
      { type: 'production', value: 25, isPercent: true, description: '+25% إنتاج' },
      { type: 'materials', value: 20, isPercent: true, description: '+20% مواد' },
      { type: 'research', value: 10, isPercent: true, description: '+10% بحث' },
    ],
  },
};

// ==================== RANDOM EVENTS ====================

export enum EventCategory {
  Positive = 'positive',
  Negative = 'negative',
  Choice = 'choice',
}

export enum EventId {
  BountifulHarvest = 'bountiful_harvest',
  GoldDiscovery = 'gold_discovery',
  PopulationBoom = 'population_boom',
  GreatScholar = 'great_scholar',
  TradeCaravan = 'trade_caravan',
  HeroBirth = 'hero_birth',
  Plague = 'plague',
  Earthquake = 'earthquake',
  Flood = 'flood',
  BanditAttack = 'bandit_attack',
  CorruptionScandal = 'corruption_scandal',
  Drought = 'drought',
  RefugeesArrive = 'refugees_arrive',
  MerchantDeal = 'merchant_deal',
  SlaveRevolt = 'slave_revolt',
  ReligiousSchism = 'religious_schism',
}

export interface GameEvent {
  id: EventId;
  name: string;
  description: string;
  icon: string;
  category: EventCategory;
  minTurn: number;
  probability: number;
  choices?: EventChoice[];
  immediateEffects?: EventEffect[];
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type: string;
  value: number;
  targetCity: boolean;
  description: string;
}

export interface EventNotification {
  id: string;
  turn: number;
  eventId: EventId;
  name: string;
  icon: string;
  category: 'military' | 'economic' | 'political' | 'info';
  description: string;
  choices?: EventChoice[];
  effectDescription?: string;
  timestamp: number;
}

export const GAME_EVENTS: Record<EventId, GameEvent> = {
  // ---- Positive ----
  [EventId.BountifulHarvest]: {
    id: EventId.BountifulHarvest, name: 'حصاد وفير', description: 'حصاد استثنائي يملأ المخازن!', icon: '🌾',
    category: EventCategory.Positive, minTurn: 3, probability: 0.08,
    immediateEffects: [
      { type: 'food', value: 200, targetCity: true, description: '+200 غذاء لمدينة عشوائية' },
      { type: 'happiness', value: 5, targetCity: true, description: '+5 سعادة' },
    ],
  },
  [EventId.GoldDiscovery]: {
    id: EventId.GoldDiscovery, name: 'اكتشاف منجم ذهب', description: 'عمال المناجم يكتشفون عرقاً ذهبية!', icon: '💰',
    category: EventCategory.Positive, minTurn: 5, probability: 0.06,
    immediateEffects: [
      { type: 'gold', value: 300, targetCity: true, description: '+300 ذهب لمدينة عشوائية' },
    ],
  },
  [EventId.PopulationBoom]: {
    id: EventId.PopulationBoom, name: 'هجرة جماعية', description: 'عائلات عديدة تنتقل إلى إحدى مدنك', icon: '👨‍👩‍👧‍👦',
    category: EventCategory.Positive, minTurn: 8, probability: 0.05,
    immediateEffects: [
      { type: 'population', value: 50, targetCity: true, description: '+50 سكان لمدينة عشوائية' },
    ],
  },
  [EventId.GreatScholar]: {
    id: EventId.GreatScholar, name: 'عالم عظيم', description: 'عالم بارز يصل إلى مدينتك!', icon: '🧑‍🔬',
    category: EventCategory.Positive, minTurn: 6, probability: 0.04,
    immediateEffects: [
      { type: 'research', value: 30, targetCity: false, description: '+30 نقطة بحث فورية' },
      { type: 'happiness', value: 3, targetCity: true, description: '+3 سعادة' },
    ],
  },
  [EventId.TradeCaravan]: {
    id: EventId.TradeCaravan, name: 'قافلة تجارية', description: 'قافلة تجارية كبيرة تمر بالمدينة', icon: '🐪',
    category: EventCategory.Positive, minTurn: 2, probability: 0.10,
    immediateEffects: [
      { type: 'gold', value: 80, targetCity: true, description: '+80 ذهب' },
      { type: 'materials', value: 30, targetCity: true, description: '+30 مواد' },
    ],
  },
  [EventId.HeroBirth]: {
    id: EventId.HeroBirth, name: 'ميلاد بطولي', description: 'ولد في إحدى مدنك فتى يظهر عليه بريق البطولة!', icon: '⭐',
    category: EventCategory.Positive, minTurn: 10, probability: 0.03,
    immediateEffects: [
      { type: 'defense', value: 15, targetCity: true, description: '+15% قوة جيش المدينة' },
      { type: 'loyalty', value: 5, targetCity: true, description: '+5 ولاء' },
    ],
  },
  // ---- Negative ----
  [EventId.Plague]: {
    id: EventId.Plague, name: 'طاعون', description: 'مرض فتاك يضرب إحدى مدنك!', icon: '☠️',
    category: EventCategory.Negative, minTurn: 5, probability: 0.04,
    immediateEffects: [
      { type: 'population_loss', value: 15, targetCity: true, description: '-15% سكان' },
      { type: 'happiness', value: -10, targetCity: true, description: '-10 سعادة' },
    ],
  },
  [EventId.Earthquake]: {
    id: EventId.Earthquake, name: 'زلزال', description: 'زلزال مدمر يهز المنطقة!', icon: '🌋',
    category: EventCategory.Negative, minTurn: 7, probability: 0.03,
    immediateEffects: [
      { type: 'production', value: -15, targetCity: true, description: '-15% إنتاج' },
      { type: 'gold', value: -100, targetCity: true, description: '-100 ذهب (أضرار)' },
      { type: 'happiness', value: -8, targetCity: true, description: '-8 سعادة' },
    ],
  },
  [EventId.Flood]: {
    id: EventId.Flood, name: 'فيضان', description: 'فيضانات مدمرة تجتاح الأراضي الزراعية!', icon: '🌊',
    category: EventCategory.Negative, minTurn: 4, probability: 0.05,
    immediateEffects: [
      { type: 'food', value: -100, targetCity: true, description: '-100 غذاء (محاصيل تالفة)' },
      { type: 'happiness', value: -5, targetCity: true, description: '-5 سعادة' },
    ],
  },
  [EventId.BanditAttack]: {
    id: EventId.BanditAttack, name: 'هجوم قطاع الطرق', description: 'قطاع الطرق يهاجمون قافلة تجارية!', icon: '🗡️',
    category: EventCategory.Negative, minTurn: 3, probability: 0.07,
    immediateEffects: [
      { type: 'gold', value: -60, targetCity: true, description: '-60 ذهب' },
    ],
  },
  [EventId.CorruptionScandal]: {
    id: EventId.CorruptionScandal, name: 'فضيحة فساد', description: 'فضيحة فساد تكشف في بلاط المدينة!', icon: '📜',
    category: EventCategory.Negative, minTurn: 8, probability: 0.04,
    immediateEffects: [
      { type: 'loyalty', value: -10, targetCity: true, description: '-10 ولاء' },
      { type: 'happiness', value: -5, targetCity: true, description: '-5 سعادة' },
    ],
  },
  [EventId.Drought]: {
    id: EventId.Drought, name: 'جفاف', description: 'موسم جفاف شديد يضرب الأراضي!', icon: '☀️',
    category: EventCategory.Negative, minTurn: 6, probability: 0.06,
    immediateEffects: [
      { type: 'food', value: -30, targetCity: true, description: '-30% غذاء' },
      { type: 'happiness', value: -8, targetCity: true, description: '-8 سعادة' },
    ],
  },
  // ---- Choice Events ----
  [EventId.RefugeesArrive]: {
    id: EventId.RefugeesArrive, name: 'لاجئون يطلبون اللجوء', description: 'مئات العائلات الهاربة تصل إلى حدود مدينتك. هل تقبلهم؟', icon: '🚶',
    category: EventCategory.Choice, minTurn: 5, probability: 0.06,
    choices: [
      { id: 'accept', label: 'استقبال بحرارة', description: 'رحب بهم وأمنحهم المأوى', effects: [
        { type: 'population', value: 40, targetCity: true, description: '+40 سكان' },
        { type: 'gold', value: -50, targetCity: true, description: '-50 ذهب (تكلفة إيواء)' },
        { type: 'happiness', value: 5, targetCity: true, description: '+5 سعادة' },
      ]},
      { id: 'reject', label: 'رفض', description: 'أغلق الأبواب في وجوههم', effects: [
        { type: 'happiness', value: -3, targetCity: true, description: '-3 سعادة (ذنب)' },
        { type: 'loyalty', value: 3, targetCity: true, description: '+3 ولاء (حماة الشعب)' },
      ]},
    ],
  },
  [EventId.MerchantDeal]: {
    id: EventId.MerchantDeal, name: 'صفقة تاجر مغامر', description: 'تاجر غريب يعرض صفقة مربحة لكن محفوفة بالمخاطر', icon: '🤝',
    category: EventCategory.Choice, minTurn: 4, probability: 0.08,
    choices: [
      { id: 'accept_deal', label: 'قبول الصفقة', description: 'اقبل الصفقة', effects: [
        { type: 'gold', value: 200, targetCity: false, description: '+200 ذهب' },
        { type: 'loyalty', value: -3, targetCity: true, description: '-3 ولاء (صفقة مشبوهة)' },
      ]},
      { id: 'decline', label: 'رفض الصفقة', description: 'ارفض الصفقة', effects: [
        { type: 'loyalty', value: 2, targetCity: true, description: '+2 ولاء (حكمة)' },
      ]},
    ],
  },
  [EventId.SlaveRevolt]: {
    id: EventId.SlaveRevolt, name: 'تمرد العمال', description: 'عمال ساخطون يهددون بالتمرد!', icon: '⚡',
    category: EventCategory.Choice, minTurn: 8, probability: 0.04,
    choices: [
      { id: 'negotiate', label: 'تفاوض', description: 'تفاوض معهم', effects: [
        { type: 'gold', value: -80, targetCity: true, description: '-80 ذهب (تنازلات)' },
        { type: 'happiness', value: 3, targetCity: true, description: '+3 سعادة' },
      ]},
      { id: 'suppress', label: 'قمع بالقوة', description: 'قمع بالقوة', effects: [
        { type: 'population_loss', value: 10, targetCity: true, description: '-10% سكان' },
        { type: 'happiness', value: -8, targetCity: true, description: '-8 سعادة' },
      ]},
    ],
  },
  [EventId.ReligiousSchism]: {
    id: EventId.ReligiousSchism, name: 'خلاف ديني', description: 'خلاف ديني ينقسم المدينة!', icon: '📿',
    category: EventCategory.Choice, minTurn: 10, probability: 0.03,
    choices: [
      { id: 'tolerate', label: 'تسامح', description: 'تسامح مع الأقلية', effects: [
        { type: 'happiness', value: 5, targetCity: true, description: '+5 سعادة (تسامح)' },
        { type: 'loyalty', value: -3, targetCity: true, description: '-3 ولاء' },
      ]},
      { id: 'suppress_schism', label: 'قمع الخلاف', description: 'قمع الخلاف', effects: [
        { type: 'loyalty', value: 5, targetCity: true, description: '+5 ولاء (قوة)' },
        { type: 'happiness', value: -10, targetCity: true, description: '-10 سعادة' },
      ]},
    ],
  },
};

// ==================== FACTIONS & DIPLOMACY ====================

export enum FactionPersonality {
  Aggressive = 'aggressive',
  Defensive = 'defensive',
  Economic = 'economic',
  Diplomatic = 'diplomatic',
  Balanced = 'balanced',
}

export enum DiplomaticStatus {
  Unknown = 'unknown',
  Neutral = 'neutral',
  Peace = 'peace',
  Allied = 'allied',
  War = 'war',
  Vassal = 'vassal',
}

export enum VictoryType {
  Domination = 'domination',
  Cultural = 'cultural',
  Economic = 'economic',
}

export interface Faction {
  id: string;
  name: string;
  color: string;
  personality: FactionPersonality;
  treasury: number;
  armyPower: number;
  armyCount: number;
  cityCount: number;
  cities: string[];
  capitalId: string;
  researchedTechCount: number;
  relationWithPlayer: number;
  diplomaticStatus: DiplomaticStatus;
  isAtWar: boolean;
  turnsSinceLastAction: number;
  aggressionLevel: number;
}

export interface DiplomaticAction {
  id: string;
  turn: number;
  factionId: string;
  type: 'declare_war' | 'propose_peace' | 'demand_tribute' | 'trade_deal' | 'threaten' | 'praise';
  message: string;
  effects?: { type: string; value: number; description: string }[];
  choices?: { id: string; label: string; description: string; effects: { type: string; value: number; description: string }[] }[];
}

export interface VictoryState {
  dominationProgress: number;
  culturalProgress: number;
  economicProgress: number;
  victoryAchieved: boolean;
  victoryType: VictoryType | null;
  victoryMessage: string;
}

export const FACTION_NAMES = [
  'العباسيون', 'الفاطميون', 'الأمويون', 'المرابطون', 'الزنكيون', 'الأيوبيون',
];

export const FACTION_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c'];

export const PERSONALITY_CONFIG: Record<FactionPersonality, {
  label: string; icon: string; aggressionBase: number; econBonus: number; milBonus: number;
}> = {
  [FactionPersonality.Aggressive]: { label: 'عدواني', icon: '🔥', aggressionBase: 70, econBonus: 0, milBonus: 30 },
  [FactionPersonality.Defensive]: { label: 'دفاعي', icon: '🛡️', aggressionBase: 20, econBonus: 10, milBonus: 20 },
  [FactionPersonality.Economic]: { label: 'تجاري', icon: '💰', aggressionBase: 25, econBonus: 30, milBonus: 5 },
  [FactionPersonality.Diplomatic]: { label: 'دبلوماسي', icon: '🤝', aggressionBase: 15, econBonus: 15, milBonus: 10 },
  [FactionPersonality.Balanced]: { label: 'متوازن', icon: '⚖️', aggressionBase: 40, econBonus: 15, milBonus: 15 },
};

export const DIPLOMATIC_STATUS_LABELS: Record<DiplomaticStatus, string> = {
  [DiplomaticStatus.Unknown]: 'مجهول',
  [DiplomaticStatus.Neutral]: 'محايد',
  [DiplomaticStatus.Peace]: 'سلام',
  [DiplomaticStatus.Allied]: 'حليف',
  [DiplomaticStatus.War]: 'حرب',
  [DiplomaticStatus.Vassal]: 'تابع',
};

// ---- Helper Types ----

export const LABOR_KEYS: (keyof LaborDistribution)[] = [
  'farming', 'commerce', 'industry', 'construction',
  'mining', 'religion', 'research', 'unemployed',
];

export const RESOURCE_TYPES = [ResourceType.Food, ResourceType.Gold, ResourceType.Production, ResourceType.Materials, ResourceType.Research] as const;

// Base production rates per worker per turn
export const BASE_PRODUCTION_RATES: Record<keyof Omit<LaborDistribution, 'unemployed'>, Record<ResourceType, number>> = {
  farming:     { food: 3.0, gold: 0.0, production: 0.0, materials: 0.0, research: 0.0 },
  commerce:    { food: 0.0, gold: 2.5, production: 0.0, materials: 0.0, research: 0.0 },
  industry:    { food: 0.0, gold: 0.0, production: 2.0, materials: 0.0, research: 0.0 },
  construction:{ food: 0.0, gold: 0.0, production: 1.0, materials: 1.5, research: 0.0 },
  mining:      { food: 0.0, gold: 0.0, production: 0.0, materials: 2.0, research: 0.0 },
  religion:    { food: 0.0, gold: 0.0, production: 0.0, materials: 0.0, research: 0.0 },
  research:    { food: 0.0, gold: 0.0, production: 0.0, materials: 0.0, research: 2.0 },
};

// Happiness multiplier for production
export const HAPPINESS_MULTIPLIER: Record<PopulationStatus, number> = {
  [PopulationStatus.Enthusiastic]: 1.3,
  [PopulationStatus.Happy]: 1.15,
  [PopulationStatus.Normal]: 1.0,
  [PopulationStatus.Discontent]: 0.8,
  [PopulationStatus.Angry]: 0.6,
  [PopulationStatus.Desperate]: 0.4,
};
