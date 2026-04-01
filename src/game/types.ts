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
