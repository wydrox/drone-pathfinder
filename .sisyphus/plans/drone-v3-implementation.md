# Drone-Pathfinder V3 Full Implementation Plan

## Overview

**Objective**: Implement all planned features from FEATURES.md using parallel multi-agent execution.

**Scope**: 30+ features across 8 phases including terrain/obstacle planning, POI photogrammetry, multi-stage battery resume, offline capabilities, and pro tools.

**Timeline**: 13 weeks across 8 phases

**Team Structure**: 6 parallel tracks (A-F) with specialized agents

---

## Phase 1: Foundation (Weeks 1-2)

### Goal
Establish schema v2 backbone with backward compatibility and export contract tests.

### Deliverables
- [ ] Domain schema v2 with versioned types
- [ ] Migration adapters for v1 → v2
- [ ] Export contract tests (KMZ/GPX/JSON golden files)
- [ ] Feature flag system for incremental rollout

### Implementation Tasks

#### Track A: Core Domain & State

- [ ] **A1.1** Extend `src/types/mission.ts` with schema versioning
  - Add `schemaVersion: '1.0' | '2.0'` to Mission interface
  - Create v2 types: `MissionSegment`, `MissionStage`, `WaypointActionStack`
  - Add POI types: `POI`, `POICategory`, `POIOverlay`
  - Add terrain types: `TerrainConfig`, `ElevationPoint`, `Obstacle`
  - Add offline types: `OfflinePack`, `CacheManifest`, `LocalMissionVault`

- [ ] **A1.2** Create migration adapters
  - `src/lib/migration/v1ToV2.ts`: Transform v1 missions to v2
  - `src/lib/migration/v2ToV1.ts`: Downgrade for backward compatibility
  - Validation functions for schema integrity

- [ ] **A1.3** Refactor `src/hooks/useMission.ts`
  - Support both v1 and v2 mission structures
  - Add state for: segments[], stages[], pois[], offlinePacks[]
  - Implement migration on load
  - Add feature flag checks

#### Track E: Export Pipeline Foundation

- [ ] **E1.1** Create export contract test suite
  - `src/lib/__tests__/kmzExport.test.ts`: Golden file tests
  - `src/lib/__tests__/gpxExport.test.ts`: Compatibility tests
  - `src/lib/__tests__/jsonExport.test.ts`: Schema validation tests
  - Generate reference missions for test coverage

- [ ] **E1.2** Implement versioned exporters
  - Extend `kmzGenerator.ts` with schema version detection
  - Extend `gpxGenerator.ts` with v1/v2 branches
  - Extend `jsonExporter.ts` with version field
  - Ensure v1 exports remain unchanged

### Success Criteria
- [ ] All existing tests pass
- [ ] Migration adapters have 100% test coverage
- [ ] Export golden files match v1 output exactly
- [ ] TypeScript strict mode clean
- [ ] Build succeeds with zero errors

---

## Phase 2: Map + Authoring (Weeks 2-4)

### Goal
Enhance map system with styles, POI overlays, and manual path tracing.

### Deliverables
- [ ] Multiple map style selector (satellite, streets, terrain, dark)
- [ ] POI overlay manager with categories
- [ ] Manual path tracing tool
- [ ] Layer visibility controls

### Implementation Tasks

#### Track B: Map & UX Systems

- [ ] **B2.1** Implement map style system
  - Create `src/lib/mapStyles.ts` with style definitions
  - Extend `MapContainer.tsx` with dynamic tileLayer switching
  - Add map style selector UI in Toolbar or Sidebar
  - Persist selected style in mission config

- [ ] **B2.2** Create POI overlay infrastructure
  - New `POILayer.tsx`: Marker clustering, category icons
  - New `usePOIManager.ts`: CRUD operations for POIs
  - New `POIPanel.tsx`: Category filters, bulk operations
  - Integration with `useMission.ts` state

- [ ] **B2.3** Implement manual path tracing
  - Extend `useMapDrawing.ts` with 'path' drawMode
  - New `ManualPathLayer.tsx`: Render user-drawn paths
  - Path smoothing algorithms
  - Integration with mission segments

- [ ] **B2.4** Layer visibility controls
  - Layer toggle UI in Sidebar
  - Independent visibility for: zones, waypoints, paths, POIs, heatmaps
  - Persist visibility state

#### Track A: State Management (continued)

- [ ] **A2.1** Extend state for map features
  - Add `mapStyle: MapStyle` to MissionConfig
  - Add `pois: POI[]` to Mission state
  - Add `manualPaths: PathSegment[]` to Mission state
  - Add `layerVisibility: LayerVisibilityConfig`

### Success Criteria
- [ ] Map style switching works smoothly
- [ ] POIs can be added, edited, categorized, filtered
- [ ] Manual paths can be drawn and edited
- [ ] All layers can be toggled independently
- [ ] State persists through export/import cycle

---

## Phase 3: Camera + Modes (Weeks 4-6)

### Goal
Implement advanced camera control and flight path modes.

### Deliverables
- [ ] POV mode with POI tracking
- [ ] Camera angle timeline with keyframes
- [ ] Multi-level altitude band flights
- [ ] Video path modes (spiral, orbital helix, golden-ratio)

### Implementation Tasks

#### Track C: Capture/Planning Modes

- [ ] **C3.1** Implement POV mode
  - POI lock for heading calculation
  - Gimbal auto-tracking toward POI
  - Smoothing controls (look-ahead, damping)
  - Camera frustum preview visualization

- [ ] **C3.2** Create camera angle timeline
  - Per-segment gimbal pitch profiles
  - Support: fixed angle, linear ramp, keyframed curves
  - Visual timeline editor in Sidebar
  - Heading modes: course-aligned, POI-locked, manual curve

- [ ] **C3.3** Implement multi-level flight bands
  - Altitude band definition (roof/mid/lower)
  - Band-aware path duplication
  - Overlap control between bands
  - Visual band management UI

- [ ] **C3.4** Create video path generators
  - `generateSpiralPath()`: Inward/outward spiral
  - `generateHelixPath()`: Orbital helix with altitude change
  - `generateGoldenRatioPath()`: Fibonacci-inspired coverage
  - Curvature smoothing for stable video
  - Integration with mission segments

#### Track A: State Management (continued)

- [ ] **A3.1** Extend types for camera modes
  - Add `POVConfig`, `CameraTimeline`, `GimbalKeyframe`
  - Add `AltitudeBand`, `MultiLevelConfig`
  - Add `VideoPathMode: 'spiral' | 'helix' | 'goldenRatio'`

### Success Criteria
- [ ] POV mode tracks POI smoothly during flight preview
- [ ] Camera timeline shows keyframes and interpolates correctly
- [ ] Multi-level missions generate waypoints at all bands
- [ ] Video paths are smooth with no sharp turns
- [ ] All modes export correctly to KMZ/GPX/JSON

---

## Phase 4: POI Photogrammetry (Weeks 6-7)

### Goal
Specialized mode for high-quality 3D reconstruction around Points of Interest.

### Deliverables
- [ ] POI photogrammetry mode with orbit rings
- [ ] Stacked altitude levels for tall structures
- [ ] Coverage scoring and blind-spot detection
- [ ] RealityScan-optimized preset templates

### Implementation Tasks

#### Track C: POI Photogrammetry Mode

- [ ] **C4.1** Implement POI-driven orbit generation
  - Concentric orbit rings around POI
  - Adaptive radius based on POI size and GSD target
  - Configurable ring count and overlap
  - Vertical ladder passes for complex geometry

- [ ] **C4.2** Create stacked level system
  - Multiple altitude rings per POI
  - Automatic level spacing based on structure height
  - Level-to-level overlap control
  - Visual level preview in 3D (placeholder for now)

- [ ] **C4.3** Build coverage quality engine
  - Calculate coverage score per POI
  - Detect blind spots (occluded areas)
  - Visual coverage heatmap overlay
  - Suggest additional capture angles

#### Track D: RealityScan Optimization

- [ ] **D4.1** Implement GSD estimator
  - Live calculation: altitude + camera sensor → cm/px
  - Quality target bands (optimal, acceptable, poor)
  - Warnings when GSD exceeds thresholds

- [ ] **D4.2** Create overlap guardrails
  - Enforce minimum 80% overlap for structures
  - Visual warnings below thresholds
  - Auto-suggest corrections

- [ ] **D4.3** Build mixed-pass templates
  - Nadir roof pass + oblique orbit + facade grid
  - One-click template application
  - Export bundle with metadata for RealityScan

### Success Criteria
- [ ] POI photogrammetry generates complete orbit coverage
- [ ] Coverage score accurately predicts reconstruction quality
- [ ] Blind spots are identified and correctable
- [ ] RealityScan preset applies all optimization settings
- [ ] Export includes RealityScan-compatible metadata

---

## Phase 5: Terrain/Safety Intelligence (Weeks 7-9)

### Goal
Terrain-aware planning with obstacle avoidance and safety scoring.

### Deliverables
- [ ] DSM/DTM terrain following
- [ ] Obstacle envelope system
- [ ] LOS (Line-of-Sight) risk scoring
- [ ] Coverage quality heatmaps
- [ ] Preflight mission validator

### Implementation Tasks

#### Track D: Terrain & Safety Engine

- [ ] **D5.1** Implement terrain-following altitude
  - Elevation data integration (Mapbox, Open-Elevation)
  - Altitude modes: AGL lock, surface-relative, absolute
  - Real-time altitude correction preview
  - Terrain data caching

- [ ] **D5.2** Build obstacle-aware clearance system
  - Obstacle volume definition (buildings, trees, manual)
  - Minimum clearance constraints (horizontal/vertical)
  - Route correction around obstacles
  - Visual clearance envelopes

- [ ] **D5.3** Create LOS risk scorer
  - Calculate LOS from pilot/home point
  - Account for terrain and building occlusion
  - Segment-level risk heatmap (low/medium/high)
  - Mitigation suggestions per segment

- [ ] **D5.4** Implement coverage heatmaps
  - Predict coverage quality across mission area
  - Identify under-sampled zones
  - Visual heatmap overlay on map
  - Export for post-flight comparison

- [ ] **D5.5** Build preflight validator
  - Rule engine: overlap, speed, clearance, camera
  - Issue detection and severity classification
  - Auto-fix suggestions
  - Go/No-go decision support

### Success Criteria
- [ ] Terrain-following keeps altitude within tolerance
- [ ] Obstacles trigger route corrections
- [ ] LOS risk accurately predicts connection quality
- [ ] Coverage heatmap matches actual reconstruction results
- [ ] Validator catches 95%+ of common planning errors

---

## Phase 6: Mission Execution Pro (Weeks 9-10)

### Goal
Professional battery-swap workflow with deterministic resume.

### Deliverables
- [ ] Multi-stage mission splitting
- [ ] Return-to-home stage boundaries
- [ ] Resume token system with validation
- [ ] Battery-aware segmentation

### Implementation Tasks

#### Track E: Mission Execution Engine

- [ ] **E6.1** Implement mission staging
  - Automatic mission splitting by battery budget
  - Stage boundary markers (RTH, land, resume)
  - Stage metadata: name, waypoint range, estimated time
  - Visual stage editor

- [ ] **E6.2** Create resume token system
  - Resume index tracking (waypoint + segment)
  - Plan hash validation (detect plan drift)
  - Rewind distance configuration
  - Resume safety checks (wind, geofence, home point)

- [ ] **E6.3** Build battery-aware optimizer
  - Battery model integration (per drone type)
  - Reserve policy configuration
  - Automatic stage sizing
  - Contingency planning (diversion RTH)

- [ ] **E6.4** Implement resume workflow UI
  - Resume dialog with safety checklist
  - Stage completion tracking
  - Resume history log
  - Error recovery for failed resumes

### Success Criteria
- [ ] Missions split into viable stages automatically
- [ ] Resume token reliably restores exact position
- [ ] Plan drift detected and prevented
- [ ] Battery calculations accurate within 10%
- [ ] Resume workflow intuitive and error-resistant

---

## Phase 7: Action Stacks + Enhanced Exports (Weeks 10-11)

### Goal
Multi-action waypoints with enhanced export capabilities.

### Deliverables
- [ ] Waypoint action stack system
- [ ] Enhanced KMZ with DJI multi-action format
- [ ] GPX extensions for actions
- [ ] Versioned JSON schema with full metadata

### Implementation Tasks

#### Track E: Export & Action System

- [ ] **E7.1** Extend waypoint actions
  - Action types: photo, videoStart, videoStop, hover, yaw, gimbalPitch, customTag
  - Action sequences (ordered lists per waypoint)
  - Conditional actions (on arrival, delay, heading reached)
  - Action presets for common workflows

- [ ] **E7.2** Upgrade KMZ generator
  - DJI wpml:waypointActions support
  - Multi-action serialization
  - Extended data for action parameters
  - Backward compatibility for DJI Fly

- [ ] **E7.3** Upgrade GPX generator
  - Garmin TrackPointExtension for actions
  - Custom namespace for drone actions
  - Graceful degradation for non-drone apps

- [ ] **E7.4** Upgrade JSON exporter
  - Full v2 schema with all new fields
  - Actions array with parameters
  - Mission stages and metadata
  - Audit trail information

#### Track B: Action UI

- [ ] **B7.1** Create waypoint action editor
  - Per-waypoint action stack UI
  - Action type selector
  - Parameter configuration
  - Bulk action application

### Success Criteria
- [ ] Multi-action waypoints serialize correctly to all formats
- [ ] DJI Fly imports KMZ with actions intact
- [ ] GPX extensions don't break standard GPS apps
- [ ] JSON v2 imports correctly into planner
- [ ] Action UI is intuitive and fast

---

## Phase 8: Offline Platform + Pro Suite (Weeks 11-13)

### Goal
Full offline capability with professional operations tools.

### Deliverables
- [ ] Offline basemap pack system
- [ ] Elevation/terrain cache
- [ ] Local mission vault with versioning
- [ ] Mission compare/diff
- [ ] Post-flight QA and retake planner
- [ ] Audit reports and templates

### Implementation Tasks

#### Track F: Offline Infrastructure

- [ ] **F8.1** Implement offline basemap packs
  - PMTiles integration for vector basemaps
  - Region selection and download UI
  - Storage in OPFS (Origin Private File System)
  - Progress tracking and resume

- [ ] **F8.2** Build elevation cache
  - DSM/DTM tile downloading
  - Local cache management
  - Stale data detection
  - Fallback to online when available

- [ ] **F8.3** Create local mission vault
  - IndexedDB storage for missions
  - Version history with diff
  - Rollback capability
  - Export/import for backup

- [ ] **F8.4** Implement stale-data warnings
  - Cache manifest with timestamps
  - Freshness checking on load
  - Non-blocking UI notifications
  - One-click refresh

#### Track F: Pro Tools (continued)

- [ ] **F8.5** Build mission compare/diff
  - Visual diff of mission versions
  - Geometry comparison (waypoint changes)
  - Settings comparison
  - Risk delta analysis

- [ ] **F8.6** Create template system
  - Locked planning templates
  - Enterprise/inspection presets
  - Template versioning
  - Sharing and deployment

- [ ] **F8.7** Implement post-flight QA
  - Import captured image footprints
  - Detect gaps and underlap
  - Coverage comparison (planned vs actual)
  - Generate retake-only missions

- [ ] **F8.8** Build audit/reporting
  - Client-ready mission reports
  - Compliance documentation
  - Operator notes and defect pins
  - PDF/printable export

### Success Criteria
- [ ] Offline basemaps render smoothly
- [ ] Mission vault persists across browser sessions
- [ ] Version diff accurately shows changes
- [ ] Retake planner generates minimal correction missions
- [ ] Reports are professional and complete
- [ ] All features work without internet after initial setup

---

## Cross-Cutting Concerns

### Testing Strategy
- Unit tests for all algorithms (grid, orbit, terrain, etc.)
- Integration tests for export/import roundtrips
- E2E tests for critical user flows
- Golden file tests for export compatibility
- Performance tests for large missions (1000+ waypoints)

### Documentation
- JSDoc for all public functions
- Architecture Decision Records (ADRs) in `.sisyphus/notepads/`
- User-facing documentation for new features
- Migration guide for v1 → v2

### Performance Targets
- Map interaction: 60fps with 1000+ waypoints
- Mission generation: <2s for 1000 waypoints
- Export: <1s for 1000 waypoints
- Offline pack download: resume capability, progress tracking

### Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: OPFS support requires 16.4+
- Mobile: Touch-optimized interactions

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Elevation API reliability | Implement caching + multiple provider fallback |
| Browser storage limits | Use OPFS + quota management + user warnings |
| DJI export compatibility | Extensive testing with DJI Fly app |
| Plan drift on resume | Plan hash validation + user confirmation |
| Large mission performance | Virtualization + lazy loading |
| Offline data staleness | Freshness timestamps + stale warnings |

---

## Team Assignments

- **Track A (Core Domain)**: State management, types, migration
- **Track B (Map & UX)**: Map layers, drawing tools, UI components
- **Track C (Capture Modes)**: Path generators, camera control, POI modes
- **Track D (Terrain/Safety)**: Elevation, obstacles, LOS, validation
- **Track E (Execution/Exports)**: Staging, resume, export formats
- **Track F (Offline/Pro)**: Caching, vault, diff, reports

---

## Milestone Reviews

- **M1 (Week 2)**: Schema v2 complete, migration working
- **M2 (Week 4)**: Map enhancements shipped
- **M3 (Week 6)**: Camera modes and POI photogrammetry
- **M4 (Week 8)**: Terrain and safety intelligence
- **M5 (Week 10)**: Multi-stage execution working
- **M6 (Week 11)**: Action stacks and enhanced exports
- **M7 (Week 13)**: Offline platform and pro tools complete

---

## Success Metrics

- **Functional**: All 30+ planned features implemented
- **Quality**: Zero breaking changes to v1 exports
- **Performance**: Meet all performance targets
- **Compatibility**: DJI Fly imports work seamlessly
- **Reliability**: 99%+ uptime in field conditions
- **Adoption**: Users can migrate from v1 without data loss
