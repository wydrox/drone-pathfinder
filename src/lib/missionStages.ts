import type { MissionV2, MissionStage, WaypointV2 } from '@/types/mission';
import type { MissionConfig } from '@/types/mission';

export interface BatteryConfig {
  capacityMah: number;
  voltage: number;
  reservePercent: number;
  hoverCurrentAmps: number;
  cruiseCurrentAmps: number;
}

export interface BatteryProfile {
  id: string;
  label: string;
  battery: Pick<BatteryConfig, 'capacityMah' | 'voltage'>;
  source: string;
}

export const DJI_BATTERY_PROFILES: BatteryProfile[] = [
  {
    id: 'DJI Mini 4 Pro',
    label: 'DJI Mini 4 Pro (Intelligent Flight Battery)',
    battery: { capacityMah: 2590, voltage: 7.32 },
    source: 'https://repair.dji.com/help/content?customId=en-us03400006564&lang=en&re=US&spaceId=34',
  },
  {
    id: 'DJI Mini 5 Pro',
    label: 'DJI Mini 5 Pro (Intelligent Flight Battery)',
    battery: { capacityMah: 2788, voltage: 7.0 },
    source: 'https://repair.dji.com/help/content?customId=en-us03400006564&lang=en&re=US&spaceId=34',
  },
  {
    id: 'DJI Mavic 4 Pro',
    label: 'DJI Mavic 4 Pro (Intelligent Flight Battery)',
    battery: { capacityMah: 6654, voltage: 14.32 },
    source: 'https://repair.dji.com/help/content?customId=en-us03400006564&lang=en&re=US&spaceId=34',
  },
  {
    id: 'DJI Mavic 3',
    label: 'DJI Mavic 3 / 3 Pro (Intelligent Flight Battery)',
    battery: { capacityMah: 5000, voltage: 15.4 },
    source: 'https://repair.dji.com/help/content?customId=en-us03400006564&lang=en&re=US&spaceId=34',
  },
  {
    id: 'DJI Air 3',
    label: 'DJI Air 3 (Intelligent Flight Battery)',
    battery: { capacityMah: 4241, voltage: 14.76 },
    source: 'https://repair.dji.com/help/content?customId=en-us03400006564&lang=en&re=US&spaceId=34',
  },
  {
    id: 'DJI Air 3S',
    label: 'DJI Air 3S (Intelligent Flight Battery)',
    battery: { capacityMah: 4276, voltage: 14.6 },
    source: 'https://repair.dji.com/help/content?customId=en-us03400006564&lang=en&re=US&spaceId=34',
  },
];

const BASE_BATTERY_CONFIG: Pick<BatteryConfig, 'reservePercent' | 'hoverCurrentAmps' | 'cruiseCurrentAmps'> = {
  reservePercent: 20,
  hoverCurrentAmps: 15,
  cruiseCurrentAmps: 10,
};

export function getBatteryProfileForDroneModel(droneModel?: string): BatteryProfile {
  if (!droneModel) {
    return DJI_BATTERY_PROFILES[0];
  }

  const normalized = droneModel.toLowerCase();

  if (normalized.includes('mavic 4')) return DJI_BATTERY_PROFILES.find(p => p.id === 'DJI Mavic 4 Pro')!;
  if (normalized.includes('mavic 3')) return DJI_BATTERY_PROFILES.find(p => p.id === 'DJI Mavic 3')!;
  if (normalized.includes('air 3s')) return DJI_BATTERY_PROFILES.find(p => p.id === 'DJI Air 3S')!;
  if (normalized.includes('air 3')) return DJI_BATTERY_PROFILES.find(p => p.id === 'DJI Air 3')!;
  if (normalized.includes('mini 5')) return DJI_BATTERY_PROFILES.find(p => p.id === 'DJI Mini 5 Pro')!;

  return DJI_BATTERY_PROFILES.find(p => p.id === 'DJI Mini 4 Pro')!;
}

export function getBatteryConfigForDroneModel(droneModel?: string): BatteryConfig {
  const profile = getBatteryProfileForDroneModel(droneModel);
  return {
    ...profile.battery,
    ...BASE_BATTERY_CONFIG,
  };
}

export const DEFAULT_BATTERY_CONFIG: BatteryConfig = getBatteryConfigForDroneModel('DJI Mini 4 Pro');

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
