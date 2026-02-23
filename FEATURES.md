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

## Key Takeaways for drone-pathfinder

### Must-Have Features (MVP)

- [ ] Map-based waypoint editor
- [ ] Shape-based waypoint generation
- [ ] Manual waypoint placement
- [ ] KMZ file export
- [ ] Click-and-drag editing
- [ ] Mission saving

### Enhanced Features (v1.0)

- [ ] Terrain-aware altitude adjustment
- [ ] Flight direction control
- [ ] Photo action automation
- [ ] Path straightening
- [ ] KMZ import capability

### Advanced Features (v2.0+)

- [ ] API access
- [ ] Multi-drone support
- [ ] Terrain following
- [ ] Mission planning templates
- [ ] Integration with photogrammetry tools

---

## References

- Main site: https://www.waypointmap.com/
- Tutorial: https://www.waypointmap.com/Home/Tutorial
- Supported Drones: https://www.waypointmap.com/Home/SupportedDrones
- Premium: https://www.waypointmap.com/Home/Premium
- API: https://www.waypointmap.com/Home/API
- Developer: Jays Tech Vault (YouTube, 220K+ subscribers)
