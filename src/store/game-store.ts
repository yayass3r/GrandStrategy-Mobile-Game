// ============================================================================
// 4X Grand Strategy Game - Zustand Store
// ============================================================================

import { create } from 'zustand';
import {
  GameState, City, Army, GovernorData, GovernorType,
  GameNotification, BattleResult, BuildingType,
} from '@/game/types';
import {
  generateWorld, processTurn, createGovernor as engineCreateGovernor,
  dismissGovernor as engineDismissGovernor,
  recruitSoldiers as engineRecruitSoldiers,
  createArmy as engineCreateArmy,
  generateAvailableGovernors as engineGenerateAvailableGovernors,
  calculateBudget,
  updatePopulationStatus,
  createDefaultComposition,
  startBuilding as engineStartBuilding,
} from '@/game/engine';

export interface GameStore extends GameState {
  // Actions
  startGame: () => void;
  endTurn: () => void;
  selectCity: (cityId: string | null) => void;
  selectArmy: (armyId: string | null) => void;
  assignGovernorToCity: (cityId: string, governor: GovernorData) => void;
  dismissGovernorFromCity: (cityId: string) => void;
  setTaxRate: (rate: number) => void;
  recruitFromCity: (cityId: string, count: number) => void;
  createArmyFromCity: (cityId: string, targetCityId: string) => void;
  getCityById: (id: string) => City | undefined;
  getArmyById: (id: string) => Army | undefined;
  refreshAvailableGovernors: () => void;
  addNotification: (message: string, category: GameNotification['category']) => void;
  dismissBattleResult: () => void;
  buildInCity: (cityId: string, buildingType: BuildingType) => void;
}

const initialState: GameState = {
  turn: 0,
  treasury: 100,
  totalIncome: 0,
  totalExpenses: 0,
  taxRate: 0.15,
  cities: [],
  armies: [],
  notifications: [],
  selectedCityId: null,
  selectedArmyId: null,
  gameStarted: false,
  gameOver: false,
  availableGovernors: [],
  battleHistory: [],
  activeSieges: [],
  showBattleResult: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startGame: () => {
    const { cities, armies } = generateWorld();
    set({
      cities,
      armies,
      turn: 1,
      treasury: 100,
      gameStarted: true,
      gameOver: false,
      notifications: [],
      selectedCityId: null,
      selectedArmyId: null,
      availableGovernors: engineGenerateAvailableGovernors(),
      battleHistory: [],
      activeSieges: [],
      showBattleResult: null,
    });
  },

  endTurn: () => {
    const state = get();
    if (!state.gameStarted || state.gameOver) return;

    const newState = processTurn(state);

    // Check game over conditions
    const capital = newState.cities.find(c => c.isCapital);
    const totalPop = newState.cities.reduce(
      (sum, c) => sum + c.population.children + c.population.adults + c.population.elderly,
      0
    );

    let gameOver = false;
    if (!capital || totalPop === 0 || newState.treasury < -500) {
      gameOver = true;
      newState.notifications.push({
        id: Math.random().toString(36),
        turn: newState.turn,
        message: '💀 انتهت اللعبة!',
        category: 'info',
        timestamp: Date.now(),
      });
    }

    set({
      ...newState,
      gameOver,
      // Refresh available governors every 5 turns
      availableGovernors: newState.turn % 5 === 0
        ? engineGenerateAvailableGovernors()
        : state.availableGovernors,
    });
  },

  dismissBattleResult: () => {
    set({ showBattleResult: null });
  },

  buildInCity: (cityId: string, buildingType: BuildingType) => {
    set(state => ({
      cities: state.cities.map(city => {
        if (city.id !== cityId) return city;
        return engineStartBuilding(city, buildingType);
      }),
    }));
  },

  selectCity: (cityId: string | null) => {
    set({ selectedCityId: cityId, selectedArmyId: null });
  },

  selectArmy: (armyId: string | null) => {
    set({ selectedArmyId: armyId, selectedCityId: null });
  },

  assignGovernorToCity: (cityId: string, governor: GovernorData) => {
    set(state => ({
      cities: state.cities.map(city => {
        if (city.id !== cityId) return city;
        const updatedGovernor = { ...governor, cityId, turnsInOffice: 0 };
        return {
          ...city,
          governor: updatedGovernor,
          loyalty: Math.min(100, city.loyalty + 3),
        };
      }),
      availableGovernors: state.availableGovernors.filter(g => g.id !== governor.id),
    }));
  },

  dismissGovernorFromCity: (cityId: string) => {
    set(state => ({
      cities: state.cities.map(city => {
        if (city.id !== cityId) return city;
        return engineDismissGovernor(city);
      }),
    }));
  },

  setTaxRate: (rate: number) => {
    set({ taxRate: Math.max(0, Math.min(0.5, rate)) });
  },

  recruitFromCity: (cityId: string, count: number) => {
    set(state => ({
      cities: state.cities.map(city => {
        if (city.id !== cityId) return city;
        const { city: updatedCity, recruited } = engineRecruitSoldiers(city, count);
        if (recruited === 0) return updatedCity;
        // Also update garrison composition with the new recruits
        const comp = createDefaultComposition(recruited);
        return {
          ...updatedCity,
          garrisonComposition: {
            infantry: updatedCity.garrisonComposition.infantry + comp.infantry,
            cavalry: updatedCity.garrisonComposition.cavalry + comp.cavalry,
            archers: updatedCity.garrisonComposition.archers + comp.archers,
          },
        };
      }),
    }));
  },

  createArmyFromCity: (cityId: string, targetCityId: string) => {
    set(state => {
      const city = state.cities.find(c => c.id === cityId);
      if (!city) return state;

      const { city: updatedCity, army } = engineCreateArmy(city, targetCityId);
      if (!army) return state;

      return {
        cities: state.cities.map(c => c.id === cityId ? updatedCity : c),
        armies: [...state.armies, army],
      };
    });
  },

  getCityById: (id: string) => {
    return get().cities.find(c => c.id === id);
  },

  getArmyById: (id: string) => {
    return get().armies.find(a => a.id === id);
  },

  refreshAvailableGovernors: () => {
    set({ availableGovernors: engineGenerateAvailableGovernors() });
  },

  addNotification: (message: string, category: GameNotification['category']) => {
    set(state => ({
      notifications: [
        {
          id: Math.random().toString(36),
          turn: state.turn,
          message,
          category,
          timestamp: Date.now(),
        },
        ...state.notifications,
      ].slice(0, 50), // Keep only last 50 notifications
    }));
  },
}));
