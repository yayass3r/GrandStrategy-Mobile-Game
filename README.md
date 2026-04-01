# 🎮 فُتُوح - Grand Strategy Mobile Game (4X)

A 4X Grand Strategy web game built with **Next.js + TypeScript + Tailwind CSS + shadcn/ui**.

The player is the **Supreme Commander** who appoints AI-driven governors to manage cities.

## 🏛️ Implemented Systems

### Phase 1: Core Systems
| System | Description |
|--------|-------------|
| 🗺️ Mobile Camera Controls | Touch-based camera (Unity C# code included) |
| 👥 Population System | Demographics, labor distribution, growth, conscription |
| 🤖 Governor AI | 3 types: Economic, Military, Defensive with 19 traits |
| 🏰 Loyalty & Rebellion | Dynamic loyalty with rebellion mechanics |

### Phase 2: Combat System ⚔️
| Feature | Description |
|---------|-------------|
| Unit Types | Infantry (🗡️), Cavalry (🐎), Archers (🏹) - Rock-Paper-Scissors |
| Battle Resolution | 4 outcomes: Victory, Defeat, Stalemate, City Captured |
| Siege Mechanics | Wall degradation, starvation, city capture |
| Army Experience | Veteran bonuses up to +30% |
| Battle Report | Detailed narrative log with Arabic text |

### Phase 3: Building System 🏗️
| Building | Icon | Effect | Max Level |
|----------|------|--------|-----------|
| مزرعة Farm | 🌾 | +15% food per level | 5 |
| سوق Market | 🏪 | +20% gold per level | 5 |
| ثكنة Barracks | ⚔️ | +50 soldier capacity per level | 3 |
| سور Wall | 🏰 | +15% defense per level | 5 |
| مسجد Mosque | 🕌 | +8 happiness per level | 3 |
| مكتبة Library | 📚 | +25% research per level | 3 |
| منجم Mine | ⛏️ | +20% materials per level | 5 |
| ورشة Workshop | 🔨 | +20% production (requires Mine) | 3 |
| مستشفى Hospital | 🏥 | +5% pop growth (requires Mosque) | 3 |
| خان Caravanserai | 🐪 | +30% gold (requires Market) | 3 |

## 🕹️ How to Play
1. Click **"ابدأ الفتوح"** to start
2. Click a city on the map to view details
3. Assign a governor to auto-manage the city
4. Build structures to boost economy and military
5. Recruit soldiers and create armies
6. Attack enemy cities for conquest!
7. Click **"دور تالي"** to advance

## 🛠️ Tech Stack
- **Framework**: Next.js 16 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand
- **Map**: HTML5 Canvas
- **Engine**: Pure functions (no side effects)

## 📁 Project Structure
```
src/
  game/
    types.ts      # All type definitions
    engine.ts     # Pure function game engine
  store/
    game-store.ts # Zustand state management
  app/
    page.tsx      # Full game UI
  components/ui/  # shadcn/ui components
```

## 📜 License
MIT License
