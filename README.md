# Grand Strategy Mobile Game (4X)

A 4X Grand Strategy mobile game built with **Unity (C#)** and designed specifically for **Android** devices.

## Core Vision

The player is the **Supreme Commander** who makes high-level strategic decisions. Instead of micromanaging cities, the player appoints **AI-driven governors** to autonomously manage conquered cities.

## Phase 1: Core Systems

### Implemented Systems

| System | File | Description |
|--------|------|-------------|
| Mobile Camera Controls | `MobileCameraController.cs` | Touch-based camera: Drag, Pinch-Zoom, Tap |
| Population System | `PopulationData.cs` + `PopulationManager.cs` | Demographics, labor distribution, growth, conscription |
| Governor AI | `GovernorAI.cs` | 3 governor types (Economic, Military, Defensive) with traits |
| Loyalty System | `LoyaltySystem.cs` | Loyalty mechanics, rebellion system, event effects |
| Player Controller | `PlayerController.cs` | Supreme Commander: assign governors, manage budget, move armies |
| Resource Manager | `CityResourceManager.cs` | City resource management |

### Key Features

- **Touch Controls**: Drag to pan, Pinch to zoom, Tap to select (optimized for Android)
- **Autonomous AI Governors**: Economic, Military, and Defensive governors with unique behaviors
- **Trait System**: 20 governor traits (positive/negative) with magnitude scaling
- **Population Simulation**: Age demographics, labor distribution, conscription mechanics
- **Loyalty & Rebellion**: Dynamic loyalty affected by taxes, events, and decisions
- **Event-Driven Architecture**: Decoupled systems communicating via C# events

### Unity Project Structure

```
Assets/Scripts/
  CameraSystem/
    MobileCameraController.cs
  PopulationSystem/
    PopulationData.cs
    PopulationManager.cs
  GovernorSystem/
    GovernorAI.cs
  LoyaltySystem/
    LoyaltySystem.cs
  PlayerSystem/
    PlayerController.cs
  Core/
    CityResourceManager.cs
Documentation/
  GrandStrategy_Game_Documentation.pdf
```

## Setup

1. Create a new Unity project (2022.3 LTS or later)
2. Import the `Assets/Scripts/` folder into your project
3. Attach `MobileCameraController` to your main camera
4. Set up the ground layer and camera bounds in the Inspector
5. Build for Android platform

## Tech Stack

- **Engine**: Unity
- **Language**: C#
- **Platform**: Android (Mobile)
- **Genre**: 4X Grand Strategy

## License

This project is open source and available under the MIT License.
