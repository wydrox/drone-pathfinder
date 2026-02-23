import type { MissionV2, MissionStage, WaypointV2 } from '@/types/mission';
import type { MissionConfig } from '@/types/mission';

export interface BatteryConfig {
  capacityMah: number;
  voltage: number;
  reservePercent: number;
  hoverCurrentAmps: number;
  cruiseCurrentAmps: number;
}

export const DEFAULT_BATTERY_CONFIG: BatteryConfig = {
  capacityMah: 5000,
  voltage: 11.1,
  reservePercent: 20,
  hoverCurrentAmps: 15,
  cruiseCurrentAmps: 10,
};

export function calculateBatteryRequirement(
  waypoints: WaypointV2[],
  config: MissionConfig,
  batteryConfig: BatteryConfig = DEFAULT_BATTERY_CONFIG
): number {
  const durationMinutes = waypoints.length * 2;
  const current = config.speed > 5 ? batteryConfig.cruiseCurrentAmps : batteryConfig.hoverCurrentAmps;
  const capacityAh = batteryConfig.capacityMah / 1000;
  const usableCapacity = capacityAh * (1 - batteryConfig.reservePercent / 100);
  const consumption = (current * (durationMinutes / 60)) / usableCapacity;
  return Math.min(100, consumption * 100);
}

export function splitMissionIntoStages(
  mission: MissionV2,
  batteryConfig: BatteryConfig = DEFAULT_BATTERY_CONFIG
): MissionStage[] {
  const stages: MissionStage[] = [];
  let currentStageWaypoints: WaypointV2[] = [];
  let stageStartIndex = 0;
  
  for (let i = 0; i < mission.waypoints.length; i++) {
    currentStageWaypoints.push(mission.waypoints[i]);
    const batteryRequired = calculateBatteryRequirement(
      currentStageWaypoints,
      mission.config,
      batteryConfig
    );
    
    if (batteryRequired > 70 || i === mission.waypoints.length - 1) {
      const estimatedTimeSec = currentStageWaypoints.length * 120;
      
      stages.push({
        id: `stage-${stages.length}`,
        name: `Stage ${stages.length + 1}`,
        startWaypointIndex: stageStartIndex,
        endWaypointIndex: i,
        estimatedTimeSec,
        batteryRequiredPercent: batteryRequired,
      });
      
      currentStageWaypoints = [];
      stageStartIndex = i + 1;
    }
  }
  
  return stages;
}

export interface ResumeToken {
  missionId: string;
  waypointIndex: number;
  stageIndex: number;
  timestamp: string;
  planHash: string;
}

export function generateResumeToken(
  mission: MissionV2,
  waypointIndex: number,
  stageIndex: number = 0
): ResumeToken {
  const planHash = generatePlanHash(mission);
  
  return {
    missionId: mission.id,
    waypointIndex,
    stageIndex,
    timestamp: new Date().toISOString(),
    planHash,
  };
}

function generatePlanHash(mission: MissionV2): string {
  const data = `${mission.id}-${mission.waypoints.length}-${mission.config.altitude}-${mission.config.speed}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function validateResumeToken(
  token: ResumeToken,
  mission: MissionV2
): { valid: boolean; reason?: string } {
  if (token.missionId !== mission.id) {
    return { valid: false, reason: 'Mission ID mismatch' };
  }
  
  const currentHash = generatePlanHash(mission);
  if (token.planHash !== currentHash) {
    return { valid: false, reason: 'Mission plan has changed' };
  }
  
  if (token.waypointIndex >= mission.waypoints.length) {
    return { valid: false, reason: 'Invalid waypoint index' };
  }
  
  return { valid: true };
}

export function createResumeMission(
  originalMission: MissionV2,
  token: ResumeToken
): MissionV2 {
  const remainingWaypoints = originalMission.waypoints.slice(token.waypointIndex);
  
  return {
    ...originalMission,
    id: `${originalMission.id}-resume-${Date.now()}`,
    name: `${originalMission.name} (Resume)`,
    waypoints: remainingWaypoints.map((wp, i) => ({
      ...wp,
      index: i,
    })),
  };
}
