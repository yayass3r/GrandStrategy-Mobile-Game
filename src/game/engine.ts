// ============================================================================
// 4X Grand Strategy Game - Core Engine (Pure Functions)
// ============================================================================

import {
  City, Army, GovernorData, GovernorType, GovernorState, GovernorTrait,
  TraitType, CityProduction, GameState, GameNotification, PopulationStatus,
  ResourceType, LaborDistribution, LABOR_KEYS, BASE_PRODUCTION_RATES,
  HAPPINESS_MULTIPLIER, PopulationDemographics,
  UnitType, ArmyComposition, BattleResult, SiegeState,
  UNIT_EFFECTIVENESS, UNIT_STATS,
  BuildingType, BUILDING_DEFS, CityBuilding,
  TechId, TechDef, TECH_DEFS, ResearchedTech,
  EventId, EventCategory, EventEffect, EventNotification,
  GAME_EVENTS,
} from './types';

// ---- Utilities ----

function uuid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getTotalPopulation(pop: PopulationDemographics): number {
  return pop.children + pop.adults + pop.elderly;
}

function getTotalWorkers(labor: LaborDistribution): number {
  return LABOR_KEYS.reduce((sum, k) => sum + labor[k], 0) - labor.unemployed;
}

// ---- City Names ----

const CITY_NAMES = [
  'مكة', 'المدينة', 'بغداد', 'دمشق', 'القاهرة', 'القدس', 'طرابلس', 'الإسكندرية',
];

const GOVERNOR_FIRST_NAMES = [
  'عمر', 'خالد', 'طارق', 'صلاح', 'يوسف', 'محمد', 'إبراهيم', 'أحمد',
  'علي', 'حسن', 'يحيى', 'سليمان', 'موسى', 'عبدالله', 'فهد', 'ناصر',
  'سعد', 'معاوية', 'أنور', 'زياد', 'حارث', 'وليد', 'المعتصم', 'هارون',
];

const GOVERNOR_LAST_NAMES = [
  'بن الخطاب', 'بن الوليد', 'بن زياد', 'الدين الأيوبي', 'الصالح', 'الفاروق',
  'العتيبي', 'القحطاني', 'الشمري', 'الحربي', 'المطيري', 'الدوسري',
  'العنزي', 'السبيعي', 'الزهراني', 'الغامدي', 'الرشيدي', 'المالكي',
];

// ---- World Generation ----

export function generateWorld(): { cities: City[]; armies: Army[] } {
  const cities: City[] = [];
  const usedPositions: { x: number; y: number }[] = [];
  const numCities = rand(6, 8);
  const shuffledNames = [...CITY_NAMES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < numCities; i++) {
    // Place cities with minimum distance
    let x: number, y: number;
    let attempts = 0;
    do {
      x = rand(60, 740);
      y = rand(60, 540);
      attempts++;
    } while (
      attempts < 100 &&
      usedPositions.some(p => Math.abs(p.x - x) < 100 && Math.abs(p.y - y) < 100)
    );
    usedPositions.push({ x, y });

    const isCapital = i === 0;
    const basePop = isCapital ? 500 : rand(150, 300);

    // Distribution: 20% children, 65% adults, 15% elderly
    const children = Math.floor(basePop * 0.2);
    const adults = Math.floor(basePop * 0.65);
    const elderly = basePop - children - adults;

    // Initial labor distribution for a new city
    const workerPool = adults;
    const farming = Math.floor(workerPool * 0.35);
    const commerce = Math.floor(workerPool * 0.15);
    const industry = Math.floor(workerPool * 0.1);
    const construction = Math.floor(workerPool * 0.1);
    const mining = Math.floor(workerPool * 0.1);
    const religion = Math.floor(workerPool * 0.05);
    const research = Math.floor(workerPool * 0.05);
    const unemployed = workerPool - farming - commerce - industry - construction - mining - religion - research;

    const city: City = {
      id: uuid(),
      name: shuffledNames[i % shuffledNames.length],
      x,
      y,
      isCapital,
      population: { children, adults, elderly },
      labor: { farming, commerce, industry, construction, mining, religion, research, unemployed },
      soldierCount: isCapital ? 30 : rand(5, 15),
      happiness: rand(50, 70),
      loyalty: isCapital ? 80 : rand(50, 70),
      status: PopulationStatus.Normal,
      governor: null,
      resources: {
        [ResourceType.Food]: isCapital ? 200 : 50,
        [ResourceType.Gold]: isCapital ? 300 : 100,
        [ResourceType.Production]: 0,
        [ResourceType.Materials]: isCapital ? 100 : 30,
        [ResourceType.Research]: 0,
      },
      maxPopulation: isCapital ? 2000 : rand(800, 1500),
      growthAccumulator: 0,
      wallLevel: isCapital ? 2 : Math.floor(Math.random() * 2),
      garrisonComposition: createDefaultComposition(isCapital ? 30 : rand(5, 15)),
      siegeState: null,
      lastBattleTurn: 0,
      timesConquered: 0,
      buildings: initializeBuildings(),
    };

    cities.push(city);
  }

  // Assign a starting governor to the capital
  const capital = cities[0];
  capital.governor = createGovernor(GovernorType.Economic, capital.id, capital.name);

  return { cities, armies: [] };
}

// ---- Population Growth ----

export function updatePopulationGrowth(city: City): City {
  const total = getTotalPopulation(city.population);
  if (total === 0) return city;

  // Base growth rate 2%
  let growthRate = 0.02;

  // Happiness bonus (up to +2% for very happy)
  growthRate += (city.happiness - 50) * 0.0002;

  // Food surplus bonus
  const production = calculateProduction(city);
  if (production.foodNet > 0) {
    growthRate += Math.min(0.03, production.foodNet / (total * 10));
  } else if (production.foodNet < 0) {
    growthRate -= Math.min(0.05, Math.abs(production.foodNet) / (total * 5));
  }

  // Loyalty factor
  if (city.loyalty < 30) {
    growthRate -= 0.01;
  }

  // Governor trait effects
  if (city.governor) {
    const hasInspiring = city.governor.traits.find(t => t.type === TraitType.Inspiring);
    if (hasInspiring) growthRate += hasInspiring.magnitude * 0.005;
  }

  // Cap growth rate
  growthRate = clamp(growthRate, -0.08, 0.06);

  const growthAmount = total * growthRate;

  // Use accumulator for fractional growth
  const newAccumulator = city.growthAccumulator + growthAmount;

  if (newAccumulator >= 1.0) {
    // Positive growth: add people
    const wholeGrowth = Math.floor(newAccumulator);
    const fraction = newAccumulator - wholeGrowth;

    // New pop distribution: 70% children, 25% adults, ~5% elderly
    const newChildren = Math.floor(wholeGrowth * 0.70);
    const newAdults = Math.floor(wholeGrowth * 0.25);
    const newElderly = wholeGrowth - newChildren - newAdults;

    // Check max population
    const newTotal = total + wholeGrowth;
    if (newTotal <= city.maxPopulation) {
      return {
        ...city,
        population: {
          children: city.population.children + newChildren,
          adults: city.population.adults + newAdults,
          elderly: city.population.elderly + newElderly,
        },
        growthAccumulator: fraction,
      };
    } else {
      // Can't grow beyond max
      return { ...city, growthAccumulator: 0 };
    }
  } else if (newAccumulator <= -1.0) {
    // Negative growth: lose people
    const wholeLoss = Math.abs(Math.floor(newAccumulator));
    const fraction = newAccumulator + wholeLoss; // negative fraction

    // Lose from elderly first, then children
    let lostElderly = Math.min(wholeLoss, city.population.elderly);
    let lostChildren = Math.min(wholeLoss - lostElderly, city.population.children);
    let lostAdults = wholeLoss - lostElderly - lostChildren;

    return {
      ...city,
      population: {
        children: Math.max(0, city.population.children - lostChildren),
        adults: Math.max(0, city.population.adults - lostAdults),
        elderly: Math.max(0, city.population.elderly - lostElderly),
      },
      growthAccumulator: fraction,
    };
  } else {
    // Fractional growth only
    return { ...city, growthAccumulator: newAccumulator };
  }
}

// ---- Production Calculation ----

export function calculateProduction(city: City): CityProduction {
  const multiplier = HAPPINESS_MULTIPLIER[city.status];
  const totalPop = getTotalPopulation(city.population);
  const foodConsumption = totalPop * 1.0;

  // Governor competence bonus
  let competenceBonus = 1.0;
  if (city.governor) {
    competenceBonus = 1.0 + (city.governor.competence / 100) * 0.3;
  }

  // Calculate production per sector
  let food = 0;
  let gold = 0;
  let production = 0;
  let materials = 0;
  let research = 0;

  const sectorKeys: (keyof Omit<LaborDistribution, 'unemployed'>)[] = [
    'farming', 'commerce', 'industry', 'construction', 'mining', 'religion', 'research',
  ];

  for (const sector of sectorKeys) {
    const workers = city.labor[sector];
    const rates = BASE_PRODUCTION_RATES[sector];
    food += workers * rates[ResourceType.Food] * multiplier * competenceBonus;
    gold += workers * rates[ResourceType.Gold] * multiplier * competenceBonus;
    production += workers * rates[ResourceType.Production] * multiplier * competenceBonus;
    materials += workers * rates[ResourceType.Materials] * multiplier * competenceBonus;
    research += workers * rates[ResourceType.Research] * multiplier * competenceBonus;
  }

  // Apply building bonuses
  const bonuses = getBuildingBonuses(city);
  food *= (1 + (bonuses.food_percent || 0) / 100);
  gold *= (1 + (bonuses.gold_percent || 0) / 100);
  production *= (1 + (bonuses.production_percent || 0) / 100);
  materials *= (1 + (bonuses.materials_percent || 0) / 100);
  research *= (1 + (bonuses.research_percent || 0) / 100);

  // Religion provides happiness bonus
  const religionWorkers = city.labor.religion;
  const buildingHappiness = bonuses.happiness || 0;
  const happinessBonus = religionWorkers * 0.3 + buildingHappiness;

  // Apply frugal trait (reduce food consumption)
  let adjustedFoodConsumption = foodConsumption;
  if (city.governor) {
    const frugalTrait = city.governor.traits.find(t => t.type === TraitType.Frugal);
    if (frugalTrait) {
      adjustedFoodConsumption = foodConsumption * (1 - frugalTrait.magnitude * 0.1);
    }
  }

  const foodNet = food - adjustedFoodConsumption;

  return {
    food: Math.floor(food * 10) / 10,
    gold: Math.floor(gold * 10) / 10,
    production: Math.floor(production * 10) / 10,
    materials: Math.floor(materials * 10) / 10,
    research: Math.floor(research * 10) / 10,
    foodConsumption: Math.floor(adjustedFoodConsumption * 10) / 10,
    foodNet: Math.floor(foodNet * 10) / 10,
    happinessBonus: Math.floor(happinessBonus * 10) / 10,
  };
}

// ---- Governor AI ----

export function runGovernorAI(city: City): City {
  if (!city.governor) return city;

  const governor = { ...city.governor, turnsInOffice: city.governor.turnsInOffice + 1 };
  const adultWorkers = city.population.adults;
  const totalSoldiers = city.soldierCount;

  // Determine labor priorities based on governor type
  let farmingW = 3.0;
  let commerceW = 2.0;
  let industryW = 1.0;
  let constructionW = 1.0;
  let miningW = 1.0;
  let religionW = 0.5;
  let researchW = 1.0;
  let recruitPercent = 0;

  switch (governor.type) {
    case GovernorType.Economic:
      commerceW = 4.0;
      farmingW = 3.0;
      researchW = 2.0;
      religionW = 1.0;
      recruitPercent = 0.05;
      governor.state = GovernorState.Developing;
      governor.currentAction = 'تطوير الاقتصاد';
      break;
    case GovernorType.Military:
      industryW = 4.0;
      constructionW = 3.0;
      miningW = 2.5;
      farmingW = 2.0;
      recruitPercent = rand(30, 60) / 100;
      governor.state = GovernorState.Recruiting;
      governor.currentAction = 'بناء الجيش';
      break;
    case GovernorType.Defensive:
      farmingW = 3.5;
      constructionW = 3.0;
      religionW = 1.5;
      recruitPercent = rand(5, 15) / 100;
      governor.state = GovernorState.BuildingDefense;
      governor.currentAction = 'تعزيز الدفاعات';
      break;
  }

  // Apply trait modifiers
  for (const trait of governor.traits) {
    switch (trait.type) {
      case TraitType.Brilliant:
        researchW += trait.magnitude * 1.5;
        break;
      case TraitType.Energetic:
        industryW += trait.magnitude * 0.5;
        farmingW += trait.magnitude * 0.5;
        break;
      case TraitType.Lazy:
        industryW -= trait.magnitude * 0.8;
        constructionW -= trait.magnitude * 0.5;
        break;
      case TraitType.Traditional:
        religionW += trait.magnitude * 1.5;
        farmingW += trait.magnitude * 0.5;
        break;
      case TraitType.Ambitious:
        commerceW += trait.magnitude * 1.0;
        break;
      case TraitType.Reckless:
        recruitPercent += trait.magnitude * 0.2;
        break;
      case TraitType.Cautious:
        constructionW += trait.magnitude * 1.0;
        recruitPercent = Math.max(0, recruitPercent - trait.magnitude * 0.1);
        break;
    }
  }

  // Redistribute labor
  const totalWeight = farmingW + commerceW + industryW + constructionW + miningW + religionW + researchW;
  const soldiersFromPopulation = Math.floor(adultWorkers * recruitPercent);
  const availableWorkers = Math.max(10, adultWorkers - soldiersFromPopulation);

  const newLabor: LaborDistribution = {
    farming: Math.floor(availableWorkers * (farmingW / totalWeight)),
    commerce: Math.floor(availableWorkers * (commerceW / totalWeight)),
    industry: Math.floor(availableWorkers * (industryW / totalWeight)),
    construction: Math.floor(availableWorkers * (constructionW / totalWeight)),
    mining: Math.floor(availableWorkers * (miningW / totalWeight)),
    religion: Math.floor(availableWorkers * (religionW / totalWeight)),
    research: Math.floor(availableWorkers * (researchW / totalWeight)),
    unemployed: 0,
  };

  // Recalculate to ensure total matches availableWorkers
  const assignedWorkers = getTotalWorkers(newLabor);
  const diff = availableWorkers - assignedWorkers;
  if (diff > 0) {
    newLabor.farming += diff; // assign remainder to farming
  } else if (diff < 0) {
    newLabor.farming = Math.max(0, newLabor.farming + diff);
  }

  // Apply trait effects on happiness and loyalty
  let happinessDelta = 0;
  let loyaltyDelta = 0;

  for (const trait of governor.traits) {
    switch (trait.type) {
      case TraitType.Charismatic:
        happinessDelta += trait.magnitude * 2;
        loyaltyDelta += trait.magnitude * 1;
        break;
      case TraitType.Inspiring:
        happinessDelta += trait.magnitude * 3;
        break;
      case TraitType.Cruel:
        happinessDelta -= trait.magnitude * 4;
        loyaltyDelta -= trait.magnitude * 2;
        break;
      case TraitType.Corrupt:
        happinessDelta -= trait.magnitude * 3;
        loyaltyDelta -= trait.magnitude * 3;
        break;
      case TraitType.Loyal:
        loyaltyDelta += trait.magnitude * 2;
        break;
      case TraitType.Incompetent:
        happinessDelta -= trait.magnitude * 1.5;
        break;
    }
  }

  // Recruitment from governor
  let newSoldiers = city.soldierCount;
  const canRecruit = Math.min(soldiersFromPopulation, adultWorkers - getTotalWorkers(newLabor));
  if (canRecruit > 0) {
    newSoldiers += canRecruit;
    happinessDelta -= canRecruit * 0.1;
  }

  const updatedCity: City = {
    ...city,
    labor: newLabor,
    soldierCount: newSoldiers,
    governor,
    happiness: clamp(city.happiness + happinessDelta, 0, 100),
    loyalty: clamp(city.loyalty + loyaltyDelta, 0, 100),
  };

  // Update status based on happiness
  return updatePopulationStatus(updatedCity);
}

// ---- Loyalty Update ----

export function updateLoyalty(city: City, taxRate: number): City {
  let loyaltyDelta = 0;

  // Natural decay when loyalty > 50 (complacency)
  if (city.loyalty > 50) {
    loyaltyDelta -= 0.3;
  }

  // Tax impact: higher tax = more loyalty loss
  loyaltyDelta -= taxRate * 5;

  // Food surplus helps loyalty
  const production = calculateProduction(city);
  if (production.foodNet > 0) {
    loyaltyDelta += Math.min(1.5, production.foodNet / 20);
  } else if (production.foodNet < 0) {
    loyaltyDelta -= Math.min(3.0, Math.abs(production.foodNet) / 10);
  }

  // Governor effects
  if (city.governor) {
    const loyal = city.governor.traits.find(t => t.type === TraitType.Loyal);
    if (loyal) loyaltyDelta += loyal.magnitude * 1.0;

    const corrupt = city.governor.traits.find(t => t.type === TraitType.Corrupt);
    if (corrupt) loyaltyDelta -= corrupt.magnitude * 1.5;

    const cruel = city.governor.traits.find(t => t.type === TraitType.Cruel);
    if (cruel) loyaltyDelta -= cruel.magnitude * 1.0;

    // Governor's own loyalty influences city
    loyaltyDelta += (city.governor.loyalty - 50) * 0.02;
  }

  // Low happiness reduces loyalty
  if (city.happiness < 30) {
    loyaltyDelta -= 1.0;
  }

  // Capital gets loyalty bonus
  if (city.isCapital) {
    loyaltyDelta += 0.5;
  }

  const newLoyalty = clamp(city.loyalty + loyaltyDelta, 0, 100);
  const updatedCity = { ...city, loyalty: newLoyalty };

  // Check for rebellion
  if (newLoyalty < 10 && Math.random() < 0.3) {
    // Rebellion occurs!
    const rebellionLoss = Math.floor(getTotalPopulation(city.population) * 0.1);
    return {
      ...updatedCity,
      population: {
        children: Math.max(0, city.population.children - Math.floor(rebellionLoss * 0.2)),
        adults: Math.max(0, city.population.adults - Math.floor(rebellionLoss * 0.6)),
        elderly: Math.max(0, city.population.elderly - Math.floor(rebellionLoss * 0.2)),
      },
      soldierCount: Math.max(0, city.soldierCount - Math.floor(city.soldierCount * 0.2)),
      happiness: Math.max(0, city.happiness - 15),
    };
  }

  return updatedCity;
}

// ---- Recruitment ----

export function recruitSoldiers(city: City, count: number): { city: City; recruited: number } {
  const availableAdults = city.population.adults - getTotalWorkers(city.labor);
  const fromUnemployed = Math.min(count, city.labor.unemployed);
  let recruited = fromUnemployed;
  let newLabor = { ...city.labor, unemployed: city.labor.unemployed - fromUnemployed };

  // If still need more, pull from workers by priority (farming last priority to pull from)
  const pullOrder: (keyof Omit<LaborDistribution, 'unemployed'>)[] = [
    'religion', 'research', 'mining', 'commerce', 'industry', 'construction', 'farming',
  ];

  let remaining = count - fromUnemployed;
  for (const sector of pullOrder) {
    if (remaining <= 0) break;
    const pull = Math.min(remaining, newLabor[sector]);
    newLabor[sector] -= pull;
    remaining -= pull;
    recruited += pull;
  }

  if (recruited === 0) {
    return { city, recruited: 0 };
  }

  const happinessImpact = recruited * -0.5;
  const loyaltyImpact = -3;

  const updatedCity: City = {
    ...city,
    labor: newLabor,
    soldierCount: city.soldierCount + recruited,
    happiness: clamp(city.happiness + happinessImpact, 0, 100),
    loyalty: clamp(city.loyalty + loyaltyImpact, 0, 100),
  };

  return { city: updatePopulationStatus(updatedCity), recruited };
}

// ---- Governor Management ----

export function dismissGovernor(city: City): City {
  if (!city.governor) return city;
  return {
    ...city,
    governor: null,
    loyalty: clamp(city.loyalty - 5, 0, 100),
  };
}

const POSITIVE_TRAITS: TraitType[] = [
  TraitType.Charismatic, TraitType.Brilliant, TraitType.Frugal,
  TraitType.Inspiring, TraitType.Energetic, TraitType.Lucky,
  TraitType.Experienced, TraitType.Loyal, TraitType.Ambitious,
  TraitType.Cautious, TraitType.Diplomatic, TraitType.Traditional,
];

const NEGATIVE_TRAITS: TraitType[] = [
  TraitType.Corrupt, TraitType.Cruel, TraitType.Lazy,
  TraitType.Reckless, TraitType.Cowardly, TraitType.Greedy,
  TraitType.Incompetent,
];

function generateTraits(): GovernorTrait[] {
  const traits: GovernorTrait[] = [];
  const numTraits = rand(1, 3);

  // Always at least 1 positive
  const posTrait = POSITIVE_TRAITS[rand(0, POSITIVE_TRAITS.length - 1)];
  traits.push({ type: posTrait, magnitude: +(0.3 + Math.random() * 0.7).toFixed(2) });

  // Additional traits
  for (let i = 1; i < numTraits; i++) {
    if (Math.random() < 0.6) {
      // Another positive
      let t: TraitType;
      do {
        t = POSITIVE_TRAITS[rand(0, POSITIVE_TRAITS.length - 1)];
      } while (traits.some(tr => tr.type === t));
      traits.push({ type: t, magnitude: +(0.3 + Math.random() * 0.7).toFixed(2) });
    } else {
      // A negative trait
      const t = NEGATIVE_TRAITS[rand(0, NEGATIVE_TRAITS.length - 1)];
      traits.push({ type: t, magnitude: +(0.3 + Math.random() * 0.7).toFixed(2) });
    }
  }

  return traits;
}

export function createGovernor(type: GovernorType, cityId: string, cityName: string): GovernorData {
  const firstName = GOVERNOR_FIRST_NAMES[rand(0, GOVERNOR_FIRST_NAMES.length - 1)];
  const lastName = GOVERNOR_LAST_NAMES[rand(0, GOVERNOR_LAST_NAMES.length - 1)];
  const traits = generateTraits();

  // Traits influence starting stats
  let competence = rand(40, 70);
  let loyalty = rand(50, 80);

  for (const trait of traits) {
    switch (trait.type) {
      case TraitType.Experienced:
        competence += trait.magnitude * 20;
        break;
      case TraitType.Brilliant:
        competence += trait.magnitude * 15;
        break;
      case TraitType.Incompetent:
        competence -= trait.magnitude * 20;
        break;
      case TraitType.Loyal:
        loyalty += trait.magnitude * 15;
        break;
      case TraitType.Corrupt:
        loyalty -= trait.magnitude * 10;
        break;
    }
  }

  return {
    id: uuid(),
    name: `${firstName} ${lastName}`,
    type,
    cityId,
    level: 1,
    loyalty: clamp(Math.round(loyalty), 10, 95),
    competence: clamp(Math.round(competence), 10, 95),
    traits,
    state: GovernorState.Idle,
    currentAction: 'وصل حديثاً',
    turnsInOffice: 0,
  };
}

export function generateAvailableGovernors(): GovernorData[] {
  return [
    createGovernor(GovernorType.Economic, '', ''),
    createGovernor(GovernorType.Military, '', ''),
    createGovernor(GovernorType.Defensive, '', ''),
  ];
}

// ---- Army Creation & Movement ----

export function createArmy(city: City, targetCityId: string): { city: City; army: Army } {
  // Minimum 5 soldiers to create an army
  const minSoldiers = 5;
  if (city.soldierCount < minSoldiers) {
    return { city, army: null as unknown as Army };
  }

  // Use up to 80% of soldiers for the army
  const armySize = Math.max(minSoldiers, Math.floor(city.soldierCount * 0.8));
  const remainingSoldiers = city.soldierCount - armySize;

  const army: Army = {
    id: uuid(),
    name: `جيش ${city.name}`,
    soldierCount: armySize,
    composition: createDefaultComposition(armySize),
    experience: 0,
    originCityId: city.id,
    targetCityId,
    x: city.x,
    y: city.y,
    isMoving: true,
    movementProgress: 0,
    siegeState: null,
    battlesWon: 0,
    battlesLost: 0,
  };

  const updatedGarrison: ArmyComposition = {
    infantry: city.garrisonComposition.infantry - army.composition.infantry,
    cavalry: city.garrisonComposition.cavalry - army.composition.cavalry,
    archers: city.garrisonComposition.archers - army.composition.archers,
  };

  const updatedCity: City = {
    ...city,
    soldierCount: remainingSoldiers,
    garrisonComposition: updatedGarrison,
    loyalty: clamp(city.loyalty - 2, 0, 100),
  };

  return { city: updatedCity, army };
}

export function advanceArmies(state: GameState): { state: GameState; battles: BattleResult[] } {
  const battles: BattleResult[] = [];
  const updatedCities = [...state.cities];

  const updatedArmies = state.armies.map(army => {
    if (!army.isMoving) return army;

    const targetCity = updatedCities.find(c => c.id === army.targetCityId);
    if (!targetCity) return { ...army, isMoving: false };

    const dx = targetCity.x - army.x;
    const dy = targetCity.y - army.y;

    // Move ~15% of distance per turn
    const moveSpeed = 0.15;
    const newProgress = army.movementProgress + moveSpeed;

    if (newProgress >= 1.0) {
      // Army arrives - trigger battle
      const battleResult = resolveBattle(army, targetCity);
      battleResult.turn = state.turn + 1;
      battles.push(battleResult);

      // Apply battle result
      const { army: updatedArmy, city: updatedCity } = applyBattleResult(army, targetCity, battleResult);

      // Update city in the array
      const cityIdx = updatedCities.findIndex(c => c.id === updatedCity.id);
      if (cityIdx >= 0) updatedCities[cityIdx] = updatedCity;

      return updatedArmy;
    }

    // Interpolate position
    const newX = army.x + dx * moveSpeed;
    const newY = army.y + dy * moveSpeed;

    return {
      ...army,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      movementProgress: newProgress,
    };
  });

  return {
    state: { ...state, cities: updatedCities, armies: updatedArmies },
    battles,
  };
}

// ---- Budget ----

export function calculateBudget(state: GameState): { income: number; expenses: number } {
  let income = 0;
  let expenses = 0;

  for (const city of state.cities) {
    const prod = calculateProduction(city);
    income += prod.gold * state.taxRate;

    // Soldier upkeep: 1 gold per 5 soldiers
    expenses += city.soldierCount * 0.2;
  }

  // Army upkeep
  for (const army of state.armies) {
    expenses += army.soldierCount * 0.3; // field armies cost more
  }

  return {
    income: Math.round(income * 10) / 10,
    expenses: Math.round(expenses * 10) / 10,
  };
}

// ---- Turn Processing ----

export function processTurn(state: GameState): GameState {
  let notifications: GameNotification[] = [...state.notifications];
  let cities = [...state.cities];

  // 1. Run all governor AIs
  cities = cities.map(city => runGovernorAI(city));

  // 1b. Process buildings (after governor AI)
  const prevCities = [...cities];
  cities = cities.map(city => processBuildings(city));

  // 2. Update population growth
  cities = cities.map(city => updatePopulationGrowth(city));

  // 3. Update loyalty
  cities = cities.map(city => updateLoyalty(city, state.taxRate));

  // 4. Calculate production and accumulate resources
  cities = cities.map(city => {
    const prod = calculateProduction(city);
    const updatedResources = { ...city.resources };
    for (const resType of [ResourceType.Food, ResourceType.Gold, ResourceType.Production, ResourceType.Materials, ResourceType.Research]) {
      updatedResources[resType] = Math.round((updatedResources[resType] + prod[resType as keyof CityProduction]) * 10) / 10;
      // Food consumption
      if (resType === ResourceType.Food) {
        updatedResources[resType] = Math.round((updatedResources[resType] - prod.foodConsumption) * 10) / 10;
      }
    }

    return { ...city, resources: updatedResources };
  });

  // Generate notifications for notable events
  for (const city of cities) {
    const prod = calculateProduction(city);
    if (city.loyalty < 15) {
      notifications.push({
        id: uuid(),
        turn: state.turn + 1,
        message: `⚠️ ${city.name}: ولاء منخفض جداً! خطر التمرد!`,
        category: 'political',
        timestamp: Date.now(),
      });
    }
    if (prod.foodNet < -10) {
      notifications.push({
        id: uuid(),
        turn: state.turn + 1,
        message: `🌾 ${city.name}: نقص حاد في الغذاء!`,
        category: 'economic',
        timestamp: Date.now(),
      });
    }
    if (city.happiness < 20) {
      notifications.push({
        id: uuid(),
        turn: state.turn + 1,
        message: `😠 ${city.name}: السكان غاضبون جداً!`,
        category: 'political',
        timestamp: Date.now(),
      });
    }
  }

  // 4b. Check building completion notifications
  for (let i = 0; i < cities.length; i++) {
    const completions = checkBuildingCompletions(cities[i], prevCities[i], state.turn + 1);
    notifications.push(...completions);
  }

  // 5. Advance armies (may trigger battles)
  let newState: GameState = {
    ...state,
    cities,
    notifications,
    battleHistory: state.battleHistory || [],
    activeSieges: state.activeSieges || [],
    showBattleResult: state.showBattleResult,
  };
  const { state: armyState, battles } = advanceArmies(newState);
  newState = armyState;

  // Process battles
  for (const battle of battles) {
    newState.battleHistory = [...newState.battleHistory, battle];
    // Show the latest battle result
    newState.showBattleResult = battle;

    // Add notification
    if (battle.outcome === 'city_captured') {
      notifications.push({
        id: uuid(),
        turn: newState.turn,
        message: `🏴 ${battle.attackerName} احتل ${battle.defenderCityName}!`,
        category: 'military',
        timestamp: Date.now(),
      });
    } else if (battle.outcome === 'attacker_victory') {
      notifications.push({
        id: uuid(),
        turn: newState.turn,
        message: `⚔️ ${battle.attackerName} انتصر على ${battle.defenderCityName}`,
        category: 'military',
        timestamp: Date.now(),
      });
    } else if (battle.outcome === 'defender_victory') {
      notifications.push({
        id: uuid(),
        turn: newState.turn,
        message: `🛡️ ${battle.defenderCityName} صمدت أمام ${battle.attackerName}`,
        category: 'military',
        timestamp: Date.now(),
      });
    } else {
      notifications.push({
        id: uuid(),
        turn: newState.turn,
        message: `⚖️ معركة متعادلة عند ${battle.defenderCityName}`,
        category: 'military',
      timestamp: Date.now(),
      });
    }
  }

  // 6. Remove destroyed armies (0 soldiers)
  newState = {
    ...newState,
    armies: newState.armies.filter(a => a.soldierCount > 0),
  };

  // 7. Process research
  newState = processResearch(newState);

  // 8. Calculate research per turn
  const researchPerTurn = newState.cities.reduce((sum, city) => {
    const prod = calculateProduction(city);
    return sum + prod.research;
  }, 0);

  // 9. Process random events
  const { state: eventState, eventNotification } = processRandomEvents(newState);
  newState = eventState;
  newState = { ...newState, researchPerTurn };

  // Add event notification
  if (eventNotification) {
    notifications = [eventNotification, ...notifications].slice(0, 50);
  }

  // 10. Calculate budget
  const budget = calculateBudget(newState);
  const treasuryChange = budget.income - budget.expenses;
  const newTreasury = Math.round((state.treasury + treasuryChange) * 10) / 10;

  // 11. Advance turn
  return {
    ...newState,
    turn: state.turn + 1,
    treasury: newTreasury,
    totalIncome: budget.income,
    totalExpenses: budget.expenses,
  };
}

// ==================== COMBAT SYSTEM ====================

// Create default army composition from soldier count
// By default: 60% infantry, 20% cavalry, 20% archers
export function createDefaultComposition(soldierCount: number): ArmyComposition {
  return {
    infantry: Math.floor(soldierCount * 0.6),
    cavalry: Math.floor(soldierCount * 0.2),
    archers: Math.floor(soldierCount * 0.2),
  };
}

// Calculate total army power
export function calculateArmyPower(
  composition: ArmyComposition,
  isDefender: boolean,
  wallLevel: number = 0,
  experience: number = 0,
  governorTraits: GovernorTrait[] = []
): number {
  let totalPower = 0;

  for (const unitType of [UnitType.Infantry, UnitType.Cavalry, UnitType.Archers]) {
    const count = composition[unitType as keyof ArmyComposition] as number;
    const stats = UNIT_STATS[unitType];
    let unitPower = count * ((stats.attack + stats.defense) / 2);

    // Defender bonus
    if (isDefender) {
      unitPower *= 1.15;
      unitPower *= (1 + wallLevel * 0.12); // walls give +12% per level
    }

    // Experience bonus (up to +30%)
    unitPower *= (1 + (experience / 100) * 0.3);

    totalPower += unitPower;
  }

  // Governor trait effects
  for (const trait of governorTraits) {
    switch (trait.type) {
      case TraitType.Brilliant:
        totalPower *= (1 + trait.magnitude * 0.15);
        break;
      case TraitType.Reckless:
        totalPower *= (1 + trait.magnitude * 0.25);
        break;
      case TraitType.Cowardly:
        totalPower *= (1 - trait.magnitude * 0.2);
        break;
      case TraitType.Experienced:
        totalPower *= (1 + trait.magnitude * 0.2);
        break;
      case TraitType.Incompetent:
        totalPower *= (1 - trait.magnitude * 0.15);
        break;
      case TraitType.Lazy:
        totalPower *= (1 - trait.magnitude * 0.1);
        break;
    }
  }

  return Math.round(totalPower);
}

// Calculate losses considering unit type effectiveness
function calculateLosses(
  targetComp: ArmyComposition,
  enemyComp: ArmyComposition,
  lossPercent: number,
): ArmyComposition {
  const losses: ArmyComposition = { infantry: 0, cavalry: 0, archers: 0 };

  for (const unitType of [UnitType.Infantry, UnitType.Cavalry, UnitType.Archers]) {
    const count = targetComp[unitType as keyof ArmyComposition] as number;

    // Calculate how effective enemies are against this unit type
    let enemyEffectiveness = 0;
    let enemyCount = 0;
    for (const enemyType of [UnitType.Infantry, UnitType.Cavalry, UnitType.Archers]) {
      const eCount = enemyComp[enemyType as keyof ArmyComposition] as number;
      enemyEffectiveness += eCount * UNIT_EFFECTIVENESS[enemyType][unitType];
      enemyCount += eCount;
    }

    // Units that enemies are effective against take more losses
    const effectivenessRatio = enemyCount > 0 ? enemyEffectiveness / enemyCount : 1;
    const adjustedLossPercent = lossPercent * effectivenessRatio;

    losses[unitType as keyof ArmyComposition] = Math.min(
      count,
      Math.round(count * adjustedLossPercent)
    );
  }

  // Normalize: ensure total losses don't exceed lossPercent of total
  const total = targetComp.infantry + targetComp.cavalry + targetComp.archers;
  const targetTotalLosses = Math.round(total * lossPercent);
  const actualTotalLosses = losses.infantry + losses.cavalry + losses.archers;

  if (actualTotalLosses > 0 && actualTotalLosses !== targetTotalLosses) {
    const scale = targetTotalLosses / actualTotalLosses;
    losses.infantry = Math.round(losses.infantry * scale);
    losses.cavalry = Math.round(losses.cavalry * scale);
    losses.archers = Math.round(losses.archers * scale);
  }

  return losses;
}

// Calculate detailed combat with unit-type interactions
export function resolveBattle(
  attackerArmy: Army,
  defenderCity: City
): BattleResult {
  const attackerComp = { ...attackerArmy.composition };
  const defenderComp = { ...defenderCity.garrisonComposition };

  const battleLog: string[] = [];
  const defenderTraits = defenderCity.governor?.traits ?? [];

  battleLog.push(`⚔️ بدأت معركة ${attackerArmy.name} ضد ${defenderCity.name}`);

  // Calculate initial power
  let attackerPower = calculateArmyPower(
    attackerComp, false, 0, attackerArmy.experience
  );
  let defenderPower = calculateArmyPower(
    defenderComp, true, defenderCity.wallLevel, 0, defenderTraits
  );

  battleLog.push(`القوة الهجومية: ${attackerPower} | القوة الدفاعية: ${defenderPower}`);

  // Determine outcome based on power ratio
  const powerRatio = attackerPower / (defenderPower + 1);

  let outcome: BattleResult['outcome'];
  let attackerLossPercent: number;
  let defenderLossPercent: number;
  let cityCaptured = false;
  let siegeDamage = 0;
  let loot = 0;
  let loyaltyDrop = 0;

  if (powerRatio > 1.5) {
    // Decisive attacker victory
    outcome = powerRatio > 2.5 ? 'city_captured' : 'attacker_victory';
    attackerLossPercent = 0.15 + (1 / powerRatio) * 0.2; // 15-35% losses
    defenderLossPercent = 0.5 + (powerRatio - 1) * 0.1; // 50-70% losses
    cityCaptured = powerRatio > 2.5;
    battleLog.push(`💪 هجوم قوي! التفوق واضح للقوات المهاجمة`);
  } else if (powerRatio > 1.0) {
    // Close victory
    outcome = 'attacker_victory';
    attackerLossPercent = 0.25 + (1 / powerRatio) * 0.15; // 25-40% losses
    defenderLossPercent = 0.4 + (powerRatio - 1) * 0.2; // 40-60% losses
    battleLog.push(`⚔️ معركة شرسة! كفتان متقاربتان`);
  } else if (powerRatio > 0.7) {
    // Stalemate
    outcome = 'stalemate';
    attackerLossPercent = 0.3;
    defenderLossPercent = 0.3;
    battleLog.push(`🛡️ معركة متعادلة - تراجع كلا الجانبين`);
  } else {
    // Defender victory
    outcome = 'defender_victory';
    attackerLossPercent = 0.4 + ((1 - powerRatio) * 0.2); // 40-60% losses
    defenderLossPercent = 0.15 + powerRatio * 0.15; // 15-30% losses
    battleLog.push(`🏰 دفاع منيع! المدينة صمدت`);
  }

  // Add randomness factor (±10%)
  const randomFactor = 0.9 + Math.random() * 0.2;
  attackerLossPercent *= randomFactor;
  defenderLossPercent *= (2 - randomFactor); // inverse randomness for defender

  // Apply unit-type effectiveness to losses
  const attackerLosses = calculateLosses(attackerComp, defenderComp, attackerLossPercent);
  const defenderLosses = calculateLosses(defenderComp, attackerComp, defenderLossPercent);

  const attackerTotalLosses = attackerLosses.infantry + attackerLosses.cavalry + attackerLosses.archers;
  const defenderTotalLosses = defenderLosses.infantry + defenderLosses.cavalry + defenderLosses.archers;

  // Siege damage (walls)
  siegeDamage = outcome === 'city_captured' ? 100 :
                outcome === 'attacker_victory' ? 30 + Math.random() * 20 :
                Math.random() * 10;

  // Loot calculation
  loot = cityCaptured ? Math.floor(defenderCity.resources[ResourceType.Gold] * 0.5) :
         outcome === 'attacker_victory' ? Math.floor(Math.random() * 50 + 20) : 0;

  // Loyalty drop
  loyaltyDrop = cityCaptured ? -30 :
                outcome === 'attacker_victory' ? -15 :
                outcome === 'defender_victory' ? 5 : -5;

  // Generate narrative log entries
  battleLog.push(`خسائر المهاجمين: ${attackerTotalLosses} (${Math.round(attackerLossPercent * 100)}%)`);
  battleLog.push(`خسائر المدافعين: ${defenderTotalLosses} (${Math.round(defenderLossPercent * 100)}%)`);

  if (siegeDamage > 0) {
    battleLog.push(`🏗️ ضرر الأسوار: ${Math.round(siegeDamage)}%`);
  }
  if (loot > 0) {
    battleLog.push(`💰 نهب: ${loot} ذهب`);
  }
  if (cityCaptured) {
    battleLog.push(`🏴 تم احتلال ${defenderCity.name}!`);
  }

  // Add random flavor text
  const flavors = [
    'سيف يلمع في ضوء الشمس',
    'غبار المعركة يملأ الأفق',
    'صوت السيوف يصدع الآذان',
    'فرسان يقتحمون الصفوف',
    'سهام تظلل السماء',
  ];
  if (battleLog.length < 8) {
    battleLog.splice(2, 0, flavors[Math.floor(Math.random() * flavors.length)]);
  }

  return {
    id: uuid(),
    turn: 0, // will be set by caller
    attackerArmyId: attackerArmy.id,
    attackerName: attackerArmy.name,
    attackerOrigin: attackerArmy.originCityId,
    defenderCityId: defenderCity.id,
    defenderCityName: defenderCity.name,
    attackerComposition: { ...attackerComp },
    defenderComposition: { ...defenderComp },
    attackerPower: Math.round(attackerPower),
    defenderPower: Math.round(defenderPower),
    attackerLosses,
    defenderLosses,
    attackerTotalLosses,
    defenderTotalLosses,
    outcome,
    siegeDamage: Math.round(siegeDamage),
    loot,
    defenderCityLoyaltyDrop: loyaltyDrop,
    battleLog,
    timestamp: Date.now(),
  };
}

// ==================== TECHNOLOGY TREE ====================

export function canResearchTech(
  state: GameState,
  techId: TechId
): { canResearch: boolean; reason: string } {
  const tech = TECH_DEFS[techId];

  if (state.researchedTechs.some(t => t.id === techId)) {
    return { canResearch: false, reason: 'تم البحث عنها مسبقاً' };
  }

  if (state.currentResearch !== null && state.currentResearch.techId !== techId) {
    return { canResearch: false, reason: 'يتم البحث عن تقنية أخرى' };
  }

  if (tech.prerequisite && !state.researchedTechs.some(t => t.id === tech.prerequisite)) {
    const prereq = TECH_DEFS[tech.prerequisite];
    return { canResearch: false, reason: `يتطلب: ${prereq.icon} ${prereq.name}` };
  }

  if (state.currentResearch?.techId === techId) {
    return { canResearch: false, reason: 'قيد البحث حالياً' };
  }

  return { canResearch: true, reason: '' };
}

export function startResearch(state: GameState, techId: TechId): GameState {
  const check = canResearchTech(state, techId);
  if (!check.canResearch) return state;

  return {
    ...state,
    currentResearch: { techId, progress: 0 },
  };
}

export function processResearch(state: GameState): GameState {
  if (!state.currentResearch) return state;

  const tech = TECH_DEFS[state.currentResearch.techId];
  const newProgress = state.currentResearch.progress + state.researchPerTurn;

  if (newProgress >= tech.researchCost) {
    const newResearched: ResearchedTech = {
      id: state.currentResearch.techId,
      completedTurn: state.turn,
    };

    const notification: GameNotification = {
      id: uuid(),
      turn: state.turn,
      message: `🔬 تم البحث عن: ${tech.icon} ${tech.name}! ${tech.effects.map(e => e.description).join(', ')}`,
      category: 'economic',
      timestamp: Date.now(),
    };

    return {
      ...state,
      researchedTechs: [...state.researchedTechs, newResearched],
      currentResearch: null,
      notifications: [notification, ...state.notifications].slice(0, 50),
    };
  }

  return {
    ...state,
    currentResearch: { ...state.currentResearch, progress: newProgress },
  };
}

export function getTechBonuses(state: GameState): Record<string, number> {
  const bonuses: Record<string, number> = {};

  for (const researched of state.researchedTechs) {
    const tech = TECH_DEFS[researched.id];
    for (const effect of tech.effects) {
      const key = effect.isPercent ? `${effect.type}_percent` : effect.type;
      bonuses[key] = (bonuses[key] || 0) + effect.value;
    }
  }

  return bonuses;
}

export function getAvailableTechs(state: GameState): { tech: TechDef; available: boolean; reason: string; isCurrent: boolean }[] {
  const result: { tech: TechDef; available: boolean; reason: string; isCurrent: boolean }[] = [];

  for (const techId of Object.values(TechId) as TechId[]) {
    const check = canResearchTech(state, techId);
    const def = TECH_DEFS[techId];
    const isResearched = state.researchedTechs.some(t => t.id === techId);

    result.push({
      tech: def,
      available: check.canResearch,
      reason: isResearched ? '✅ مكتمل' : check.reason,
      isCurrent: state.currentResearch?.techId === techId,
    });
  }

  return result;
}

// ==================== RANDOM EVENTS ====================

export function processRandomEvents(state: GameState): {
  state: GameState;
  eventNotification: EventNotification | null;
} {
  if (state.turn < 3) return { state, eventNotification: null };

  for (const eventId of Object.values(EventId) as EventId[]) {
    const eventDef = GAME_EVENTS[eventId];

    if (state.turn < eventDef.minTurn) continue;
    if (Math.random() > eventDef.probability) continue;

    const targetCity = state.cities[Math.floor(Math.random() * state.cities.length)];

    const cat = eventDef.category;
    const notification: EventNotification = {
      id: uuid(),
      turn: state.turn,
      eventId,
      name: eventDef.name,
      icon: eventDef.icon,
      category: cat === EventCategory.Positive ? 'economic' :
              cat === EventCategory.Negative ? 'political' : 'info',
      description: eventDef.description,
      timestamp: Date.now(),
    };

    // For non-choice events, apply effects immediately
    if (eventDef.category !== EventCategory.Choice && eventDef.immediateEffects) {
      const newState = applyEventEffects(state, eventDef.immediateEffects, targetCity?.id);
      notification.effectDescription = eventDef.immediateEffects.map(e => e.description).join(', ');
      return { state: newState, eventNotification: notification };
    }

    // For choice events, show choices (don't apply yet)
    if (eventDef.choices) {
      notification.choices = eventDef.choices;
      return { state, eventNotification: notification };
    }
  }

  return { state, eventNotification: null };
}

export function applyEventEffects(
  state: GameState,
  effects: EventEffect[],
  targetCityId?: string,
): GameState {
  let cities = [...state.cities];

  for (const effect of effects) {
    cities = cities.map(city => {
      const isTarget = effect.targetCity && targetCityId && city.id === targetCityId;
      if (!isTarget) return city;

      switch (effect.type) {
        case 'food':
          return {
            ...city,
            resources: {
              ...city.resources,
              [ResourceType.Food]: Math.max(0, city.resources[ResourceType.Food] + effect.value),
            },
          };
        case 'gold':
          return {
            ...city,
            resources: {
              ...city.resources,
              [ResourceType.Gold]: Math.max(0, city.resources[ResourceType.Gold] + effect.value),
            },
          };
        case 'happiness':
          return { ...city, happiness: clamp(city.happiness + effect.value, 0, 100) };
        case 'loyalty':
          return { ...city, loyalty: clamp(city.loyalty + effect.value, 0, 100) };
        case 'population': {
          if (effect.value > 0) {
            return {
              ...city,
              population: {
                ...city.population,
                adults: city.population.adults + Math.floor(effect.value * 0.6),
                children: city.population.children + Math.floor(effect.value * 0.3),
                elderly: city.population.elderly + Math.floor(effect.value * 0.1),
              },
            };
          } else {
            const loss = Math.abs(Math.floor(effect.value));
            return {
              ...city,
              population: {
                children: Math.max(0, city.population.children - Math.floor(loss * 0.2)),
                adults: Math.max(0, city.population.adults - Math.floor(loss * 0.6)),
                elderly: Math.max(0, city.population.elderly - Math.floor(loss * 0.2)),
              },
            };
          }
        }
        case 'population_loss': {
          const totalPop = getTotalPopulation(city.population);
          const lossPercent = Math.abs(effect.value) / 100;
          const lossAmount = Math.floor(totalPop * lossPercent);
          return {
            ...city,
            population: {
              children: Math.max(0, city.population.children - Math.floor(lossAmount * 0.2)),
              adults: Math.max(0, city.population.adults - Math.floor(lossAmount * 0.6)),
              elderly: Math.max(0, city.population.elderly - Math.floor(lossAmount * 0.2)),
            },
          };
        }
        case 'production':
          return {
            ...city,
            resources: {
              ...city.resources,
              [ResourceType.Gold]: Math.max(0, city.resources[ResourceType.Gold] + effect.value),
              [ResourceType.Materials]: Math.max(0, city.resources[ResourceType.Materials] + Math.floor(effect.value * 0.5)),
            },
          };
        case 'research':
          if (effect.targetCity) return city;
          // Global research - handled in state
          return city;
        default:
          return city;
      }
    });
  }

  // Handle global research effects
  const researchEffect = effects.find(e => e.type === 'research' && !e.targetCity);
  if (researchEffect) {
    return { ...state, cities, totalResearchPoints: state.totalResearchPoints + researchEffect.value };
  }

  return { ...state, cities };
}

// Process siege - called each turn for cities under siege
export function processSiege(siege: SiegeState, city: City): {
  siege: SiegeState;
  cityChanges: Partial<City>;
} {
  const newSiege = { ...siege, turnsUnderSiege: siege.turnsUnderSiege + 1 };
  const cityChanges: Partial<City> = {};

  // Each turn of siege reduces wall integrity by 10-20%
  const wallDamage = 10 + Math.random() * 10;
  newSiege.wallIntegrity = Math.max(0, newSiege.wallIntegrity - wallDamage);

  // Siege causes starvation
  cityChanges.happiness = Math.max(0, (city.happiness ?? 50) - 3);

  // If walls fall, automatic battle with defender penalty
  if (newSiege.wallIntegrity <= 0 && !newSiege.cityDefeated) {
    cityChanges.loyalty = Math.max(0, (city.loyalty ?? 50) - 20);
    newSiege.cityDefeated = true;
  }

  return { siege: newSiege, cityChanges };
}

// ==================== BUILDING SYSTEM ====================

// Initialize buildings for a new city
export function initializeBuildings(): Record<BuildingType, CityBuilding> {
  const buildings: Record<BuildingType, CityBuilding> = {} as Record<BuildingType, CityBuilding>;
  for (const type of Object.values(BuildingType)) {
    buildings[type as BuildingType] = {
      type: type as BuildingType,
      level: 0,
      turnsToComplete: 0,
    };
  }
  return buildings;
}

// Check if a building can be constructed
export function canBuildBuilding(
  city: City,
  buildingType: BuildingType
): { canBuild: boolean; reason: string } {
  const def = BUILDING_DEFS[buildingType];
  const current = city.buildings[buildingType];

  if (current.level >= def.maxLevel) {
    return { canBuild: false, reason: 'وصل لأعلى مستوى' };
  }
  if (current.turnsToComplete > 0) {
    return { canBuild: false, reason: 'قيد البناء حالياً' };
  }
  if (def.prerequisite) {
    const prereq = city.buildings[def.prerequisite];
    if (prereq.level < 1) {
      return { canBuild: false, reason: `يتطلب: ${BUILDING_DEFS[def.prerequisite].name}` };
    }
  }

  const levelMultiplier = 1 + current.level * 0.5;
  const goldNeeded = Math.round(def.goldCost * levelMultiplier);
  const materialNeeded = Math.round(def.materialCost * levelMultiplier);

  if (city.resources[ResourceType.Gold] < goldNeeded) {
    return { canBuild: false, reason: `ذهب غير كافٍ (${goldNeeded})` };
  }
  if (city.resources[ResourceType.Materials] < materialNeeded) {
    return { canBuild: false, reason: `مواد غير كافية (${materialNeeded})` };
  }

  return { canBuild: true, reason: '' };
}

// Start building
export function startBuilding(city: City, buildingType: BuildingType): City {
  const check = canBuildBuilding(city, buildingType);
  if (!check.canBuild) return city;

  const def = BUILDING_DEFS[buildingType];
  const current = city.buildings[buildingType];
  const levelMultiplier = 1 + current.level * 0.5;
  const goldNeeded = Math.round(def.goldCost * levelMultiplier);
  const materialNeeded = Math.round(def.materialCost * levelMultiplier);

  return {
    ...city,
    resources: {
      ...city.resources,
      [ResourceType.Gold]: city.resources[ResourceType.Gold] - goldNeeded,
      [ResourceType.Materials]: city.resources[ResourceType.Materials] - materialNeeded,
    },
    buildings: {
      ...city.buildings,
      [buildingType]: {
        ...current,
        turnsToComplete: def.buildTurns + Math.floor(current.level * 1.5),
      },
    },
  };
}

// Process building construction each turn
export function processBuildings(city: City): City {
  const newBuildings = { ...city.buildings };

  for (const type of Object.values(BuildingType) as BuildingType[]) {
    const building = newBuildings[type];
    if (building.turnsToComplete > 0) {
      const newTurns = building.turnsToComplete - 1;
      if (newTurns === 0) {
        newBuildings[type] = { ...building, level: building.level + 1, turnsToComplete: 0 };
      } else {
        newBuildings[type] = { ...building, turnsToComplete: newTurns };
      }
    }
  }

  return { ...city, buildings: newBuildings };
}

// Calculate total building bonuses for a city
export function getBuildingBonuses(city: City): Record<string, number> {
  const bonuses: Record<string, number> = {
    food_percent: 0, gold_percent: 0, production_percent: 0, materials_percent: 0,
    research_percent: 0, happiness_flat: 0, happiness: 0,
    population_growth_percent: 0, defense_percent: 0, soldier_capacity: 0,
  };

  for (const type of Object.values(BuildingType) as BuildingType[]) {
    const building = city.buildings[type];
    if (building.level <= 0) continue;

    const def = BUILDING_DEFS[type];
    for (const effect of def.effects) {
      const value = effect.value * building.level;
      if (effect.isPercent) {
        const key = `${effect.type}_percent`;
        bonuses[key] = (bonuses[key] || 0) + value;
      } else {
        bonuses[effect.type] = (bonuses[effect.type] || 0) + value;
      }
    }
  }

  // Merge flat happiness into happiness key
  if (bonuses.happiness_flat > 0) {
    bonuses.happiness = (bonuses.happiness || 0) + bonuses.happiness_flat;
  }

  return bonuses;
}

// Get list of constructable buildings for a city
export function getConstructableBuildings(city: City): { type: BuildingType; canBuild: boolean; reason: string; def: typeof BUILDING_DEFS[BuildingType] }[] {
  const result: { type: BuildingType; canBuild: boolean; reason: string; def: typeof BUILDING_DEFS[BuildingType] }[] = [];

  for (const type of Object.values(BuildingType) as BuildingType[]) {
    const check = canBuildBuilding(city, type);
    result.push({ type, canBuild: check.canBuild, reason: check.reason, def: BUILDING_DEFS[type] });
  }

  return result;
}

// Check building completions and generate notifications
function checkBuildingCompletions(city: City, prevCity: City, turn: number): GameNotification[] {
  const notifications: GameNotification[] = [];

  for (const type of Object.values(BuildingType) as BuildingType[]) {
    const building = city.buildings[type];
    const prevBuilding = prevCity.buildings[type];

    if (building.level > prevBuilding.level && building.turnsToComplete === 0) {
      const def = BUILDING_DEFS[type];
      notifications.push({
        id: uuid(),
        turn,
        message: `🏗️ ${city.name}: تم بناء ${def.icon} ${def.name} (مستوى ${building.level})`,
        category: 'economic',
        timestamp: Date.now(),
      });
    }
  }

  return notifications;
}

// Apply battle result to army and city
export function applyBattleResult(
  army: Army,
  city: City,
  result: BattleResult
): { army: Army; city: City } {
  // Update army (apply losses)
  const newComposition: ArmyComposition = {
    infantry: Math.max(0, army.composition.infantry - result.attackerLosses.infantry),
    cavalry: Math.max(0, army.composition.cavalry - result.attackerLosses.cavalry),
    archers: Math.max(0, army.composition.archers - result.attackerLosses.archers),
  };

  const newSoldierCount = newComposition.infantry + newComposition.cavalry + newComposition.archers;

  // Experience gain
  const xpGain = result.outcome === 'attacker_victory' || result.outcome === 'city_captured' ? 15 : 5;
  const newExperience = Math.min(100, army.experience + xpGain);

  const updatedArmy: Army = {
    ...army,
    composition: newComposition,
    soldierCount: newSoldierCount,
    experience: newExperience,
    isMoving: false,
    movementProgress: 1.0,
    siegeState: result.outcome === 'city_captured' || result.outcome === 'attacker_victory' ? null : army.siegeState,
    battlesWon: result.outcome === 'attacker_victory' || result.outcome === 'city_captured' ? army.battlesWon + 1 : army.battlesWon,
    battlesLost: result.outcome === 'defender_victory' ? army.battlesLost + 1 : army.battlesLost,
  };

  // Update city (apply defender losses and effects)
  const newDefenderComp: ArmyComposition = {
    infantry: Math.max(0, city.garrisonComposition.infantry - result.defenderLosses.infantry),
    cavalry: Math.max(0, city.garrisonComposition.cavalry - result.defenderLosses.cavalry),
    archers: Math.max(0, city.garrisonComposition.archers - result.defenderLosses.archers),
  };

  const newDefenderCount = newDefenderComp.infantry + newDefenderComp.cavalry + newDefenderComp.archers;

  const updatedCity: City = {
    ...city,
    soldierCount: newDefenderCount,
    garrisonComposition: newDefenderComp,
    wallLevel: result.outcome === 'city_captured' ? 0 : Math.max(0, city.wallLevel - Math.floor(result.siegeDamage / 30)),
    loyalty: Math.max(0, Math.min(100, city.loyalty + result.defenderCityLoyaltyDrop)),
    lastBattleTurn: result.turn,
    timesConquered: result.outcome === 'city_captured' ? city.timesConquered + 1 : city.timesConquered,
    resources: {
      ...city.resources,
      [ResourceType.Gold]: city.resources[ResourceType.Gold] - result.loot,
    },
  };

  // If city captured, reduce population
  if (result.outcome === 'city_captured') {
    const popLoss = Math.floor((city.population.children + city.population.adults + city.population.elderly) * 0.1);
    updatedCity.population = {
      children: Math.max(0, city.population.children - Math.floor(popLoss * 0.2)),
      adults: Math.max(0, city.population.adults - Math.floor(popLoss * 0.6)),
      elderly: Math.max(0, city.population.elderly - Math.floor(popLoss * 0.2)),
    };
    updatedCity.happiness = Math.max(0, city.happiness - 20);
  }

  return { army: updatedArmy, city: updatedCity };
}

// ---- Population Status ----

function updatePopulationStatus(city: City): City {
  let status: PopulationStatus;

  if (city.happiness >= 80) status = PopulationStatus.Enthusiastic;
  else if (city.happiness >= 60) status = PopulationStatus.Happy;
  else if (city.happiness >= 40) status = PopulationStatus.Normal;
  else if (city.happiness >= 25) status = PopulationStatus.Discontent;
  else if (city.happiness >= 10) status = PopulationStatus.Angry;
  else status = PopulationStatus.Desperate;

  return { ...city, status };
}

// ---- Helper Getters ----

export function getRebellionRisk(loyalty: number): string {
  if (loyalty >= 50) return 'لا يوجد';
  if (loyalty >= 35) return 'منخفض';
  if (loyalty >= 20) return 'متوسط';
  if (loyalty >= 10) return 'مرتفع';
  return 'تمرد!';
}
