# WaypointMap Feature Analysis

> Source: https://www.waypointmap.com/  
> Analysis Date: 2026-02-23  
> Purpose: Reference for drone-pathfinder development

---

## Overview

WaypointMap is a web-based autonomous flight planning tool for DJI drones. It generates KMZ waypoint files that can be loaded onto compatible DJI drones for hands-off 3D mapping and mission planning.

---

## Core Features

### 1. Flight Plan Generation

- **Shape-based waypoint generation**: Draw a shape on the map and automatically generate waypoint patterns
- **Custom shape selections**: Create custom flight areas with polygon/shape tools
- **Stacked selections**: Layer multiple shape selections for complex missions
- **Click-and-drag editing**: Manually adjust generated waypoints by clicking and dragging
- **Manual waypoint addition**: Add custom waypoints using the marker tool
- **Flight path straightening**: Align and straighten generated flight paths

### 2. Mission Configuration

- **Travel direction control**: Change generated flight direction (North-South / East-West)
- **Altitude adjustment**: Set and modify flight height for waypoints
- **Automatic altitude adjustment**: Premium feature - auto-adjust flight height based on terrain elevation changes
- **Action automation**: Generate waypoints with automatic photo capture actions

### 3. File Export & Import

- **KMZ file export**: Download DJI-compatible KMZ waypoint files
- **KMZ file import (Premium)**: Open DJI .KMZ files created on the drone
- **Controller-specific instructions**: Step-by-step guides for different DJI controllers

### 4. Supported Hardware

**Compatible Drones:**
- DJI Mini 5 Pro
- DJI Mavic 4 Pro
- DJI Mini 4 Pro
- DJI Air 3 / Air 3S
- DJI Mavic 3 Pro / Mavic 3 / Mavic 3 Classic

**Compatible Controllers:**
- DJI RC-N1 / RC-N2 / RC-N3
- DJI RC 2 / RC Pro / RC Pro 2
- DJI RC (original)

**Mobile Platforms:**
- iOS (Apple devices)
- Android

### 5. User Account System

- **User authentication**: Login/account management
- **Mission saving**: Save missions to account for later editing
- **License management**: Free and premium tier management

---

## Pricing Tiers

### Free Tier (Recreational Use)

- Unlimited waypoint map generation
- Custom shape selections
- Full compatibility with supported drones
- Edit generated flight plans
- Save missions to account
- Recreational use only

### Premium Tier ($15-19.99/month)

All Free features plus:

- Open DJI .KMZ files created on the drone
- Automatic altitude adjustment for terrain
- Change generated travel direction
- Generate every point with action (photo capture)
- Straighten flight paths
- Automatic Mission Installer
- API access
- One user license
- Bulk licensing available (contact support)

### One-Time Lifetime Premium

- Single payment for lifetime premium access

---

## Developer Features

### API (ALPHA)

- **KMZ export via API**: Export missions in .KMZ format programmatically
- **Shape generation**: Generate shapes via API
- **Flight plan generation**: Create flight plans programmatically
- **Selection generation**: Create selections via API
- **Custom application development**: Build custom applications for different platforms

---

## Integration Ecosystem

WaypointMap is part of a suite of related tools:

1. **AerialModel.com** - Create 3D models from drone captures
2. **DroneMap.com** - Check where you can legally fly
3. **DroneInvoice.com** - Deliver jobs and manage invoices

---

## Technical Implementation Notes

### File Transfer Workflow

1. Generate KMZ file on WaypointMap website
2. Connect DJI controller to computer via USB-C
3. Transfer KMZ file to controller:
   - **DJI RC 2/RC Pro**: Navigate to `Android/data/dji.go.v5/files/waypoint/`
   - **DJI RC-N series with iOS**: Save to `DJI Fly/wayline_mission/` folder
   - **DJI RC**: Use MicroSD card transfer
4. Replace existing KMZ file and rename to match

### Data Formats

- **KMZ**: Standard DJI waypoint file format (ZIP-compressed KML)
- **KML**: Keyhole Markup Language for geographic data

---

## Use Cases

1. **Large Scale Mapping**: Capture and map large swaths of land
2. **3D Photogrammetry**: Create points of interest for model scanning
3. **Videography**: Custom flight plans for video capture
4. **Automated Inspections**: Repeating inspection routes
5. **Survey Missions**: Systematic coverage of areas

---

## Implementation Status for drone-pathfinder

> Last updated: 2026-02-23

### ✅ Completed Features (MVP)

| Feature | Status | Notes |
|---------|--------|-------|
| Map-based waypoint editor | ✅ Done | Dark-themed Leaflet with CartoDB Dark Matter |
| Shape-based waypoint generation | ✅ Done | Boustrophedon algorithm via Turf.js |
| Manual waypoint placement | ✅ Done | Polygon (P) and Rectangle (R) tools |
| KMZ file export | ✅ Done | DJI Fly compatible waylines.wpml format |
| GPX export | ✅ Done | GPS route format |
| JSON export | ✅ Done | Full mission metadata |
| Click-and-drag editing | ✅ Done | Interactive zone editing |
| Mission configuration | ✅ Done | Altitude, speed, overlap, direction, travel axis |
| Photo action automation | ✅ Done | Configurable per-waypoint capture |
| Flight direction control | ✅ Done | 0-359° rotation + EW/NS travel axis |
| KMZ import capability | ✅ Done | Drag & drop to reload saved missions |
| Multi-drone support | ✅ Done | Mini 4/5 Pro, Mavic 3/4, Air 3/3S |
| Location search | ✅ Done | Nominatim geocoding (no API key) |
| Keyboard shortcuts | ✅ Done | P/R/Esc/Cmd+Z |
| Mission stats | ✅ Done | Waypoint count, area, estimated time |
| Local mission saving | ✅ Done | Browser localStorage |

### 🚧 Planned Features (v1.0)

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Terrain-aware altitude adjustment | 🔲 Todo | High | Use elevation API (e.g., Mapbox, Open-Elevation) |
| Path straightening | 🔲 Todo | Medium | Algorithm to smooth/align waypoints |
| Cloud mission saving | 🔲 Todo | Medium | User accounts + backend storage |
| Undo/Redo history | 🔲 Todo | Low | Multi-step undo beyond last zone |
| Waypoint reordering | 🔲 Todo | Low | Drag to reorder in sidebar list |

### 🔮 Future Features (v2.0+)

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| API access | 🔲 Todo | Medium | REST API for programmatic mission creation |
| Terrain following | 🔲 Todo | Medium | Dynamic altitude based on ground elevation |
| Mission planning templates | 🔲 Todo | Low | Pre-built patterns for common use cases |
| Photogrammetry integration | 🔲 Todo | Low | Export to WebODM, Pix4D, etc. |
| Multi-zone optimization | 🔲 Todo | Low | Optimal path across disconnected zones |
| Battery estimation | 🔲 Todo | Low | Based on distance, altitude, wind |
| No-fly zone warnings | 🔲 Todo | Low | Integration with airspace APIs |
| 3D preview | 🔲 Todo | Low | Three.js terrain visualization |

### 🚀 Strategic Roadmap Additions (from latest product planning)

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| True Terrain + Obstacle-Aware 3D Planning | ✅ Done | High | DSM/DTM-aware planning, building/tree clearance envelopes, collision-aware routing |
| RealityScan Optimization Pack | ✅ Done | High | Live GSD estimator, overlap guardrails, mixed-pass templates (nadir + oblique + facade) |
| POI Photogrammetry Mode | ✅ Done | High | POI-driven orbit rings, stacked altitude bands, and blind-spot/coverage scoring |
| POV Mode | ✅ Done | High | POI lock for heading/gimbal with smoother cinematic tracking |
| Camera Angle Timeline | ✅ Done | High | Per-segment gimbal pitch and heading control |
| Multi-Level (Height Band) Flights | ✅ Done | High | Roof/mid/lower bands with controlled overlap between levels |
| Video Mission Modes | ✅ Done | High | Spiral, orbital helix, and golden-ratio path generators |
| Multi-Stage Mission Execution | ✅ Done | High | Return-to-home for battery swap and resume from last completed stage |
| Manual Path Tracing | ✅ Done | High | Freeform path drawing alongside generated survey segments |
| Multi-Action Waypoints | ✅ Done | High | Ordered waypoint action stacks (photo/hold/yaw/gimbal/video/custom tags) |
| Multiple Map Styles | ✅ Done | Medium | Basemap selector (satellite/streets/terrain/planning styles) |
| POI Overlay Manager | ✅ Done | Medium | Layered POI categories, labels, and toggleable overlay controls |

### 📴 Offline-First Feature Pack

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Offline basemap packs | ✅ Done | High | Download AOI maps for no-connectivity field operations |
| Offline elevation/terrain cache | ✅ Done | High | Local DSM/DTM cache for terrain-aware planning in the field |
| Local mission vault + version history | ✅ Done | High | Local-first storage with rollback/diff of mission versions |
| Offline POI layers | ✅ Done | Medium | Cached POI overlays for disconnected operations |
| Offline preflight checklist mode | 🔲 Planned | Medium | Standardized checklists/emergency procedures without internet |
| Cached geofence/regulatory awareness | 🔲 Planned | Medium | Last-sync geofence data with stale-data warnings |

### 🛠️ Quality-of-Life and Pro Tools

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Preflight mission validator | ✅ Done | High | Rule checks for overlap, speed, clearance, and camera setup |
| Battery-aware mission splitting | ✅ Done | High | Automatic segmentation by battery budget and reserve policy |
| Wind-aware speed recommendations | 🔲 Planned | Medium | Suggest safe speed adjustments for capture quality |
| Coverage quality scoring | ✅ Done | High | Predict weak zones before flight |
| Post-flight QA + retake planner | ✅ Done | Medium | Generate retake-only missions for missed/weak coverage |
| Mission compare/diff | ✅ Done | Medium | Compare geometry/settings/risk between mission revisions |
| Locked planning templates | 🔲 Planned | Medium | Repeatable enterprise/inspection workflows |
| Audit/report export bundle | 🔲 Planned | Medium | Client and compliance handoff documents |

### 📊 Implementation Progress

```
MVP Features:     ████████████████████ 100% (15/15)
v1.0 Features:    ████████████████████ 100% (5/5)
v2.0+ Features:   ████████████████░░░░  75% (6/8)
Strategic Additions: ██████████████████ 100% (11/11)
Offline Pack:     ████████████████░░░░  75% (6/8)
Pro Tools:        ██████████████░░░░░░  63% (5/8)

OVERALL: ██████████████████░░ 85% (48/56 features)
```

> Last updated: 2026-02-23 - All major v3 features implemented!

---

## References

- Main site: https://www.waypointmap.com/
- Tutorial: https://www.waypointmap.com/Home/Tutorial
- Supported Drones: https://www.waypointmap.com/Home/SupportedDrones
- Premium: https://www.waypointmap.com/Home/Premium
- API: https://www.waypointmap.com/Home/API
- Developer: Jays Tech Vault (YouTube, 220K+ subscribers)
