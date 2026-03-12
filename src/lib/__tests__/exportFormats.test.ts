import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MissionConfig, MissionStats, POI, Waypoint, Zone } from '@/types/mission';
import { exportGpx } from '../gpxGenerator';
import { exportJson } from '../jsonExporter';

const { saveAsMock } = vi.hoisted(() => ({
  saveAsMock: vi.fn(),
}));

vi.mock('file-saver', () => ({
  saveAs: saveAsMock,
}));

async function captureSavedText(runExport: () => void): Promise<string> {
  let capturedBlob: Blob | null = null;

  saveAsMock.mockImplementation((blob: Blob) => {
    capturedBlob = blob;
  });

  runExport();

  if (!capturedBlob) {
    throw new Error('No blob captured');
  }

  return await capturedBlob.text();
}

const config: MissionConfig = {
  altitude: 100,
  speed: 6,
  overlap: 70,
  direction: 0,
  cameraAngle: -45,
  waypointOrientationMode: 'poi',
  waypointOrientationPoiId: 'poi-1',
  travelAxis: 'EW',
  photoCapture: true,
  terrainAware: false,
  droneModel: 'DJI Mini 4 Pro',
};

const waypoint: Waypoint = {
  id: 'wp-1',
  lat: 0,
  lng: 0,
  altitude: 100,
  index: 0,
  action: 'photo',
};

const poi: POI = {
  id: 'poi-1',
  name: 'Tower',
  lat: 0,
  lng: 0.001,
  altitude: 20,
  category: 'structure',
  radiusMeters: 10,
};

const stats: MissionStats = {
  waypointCount: 1,
  areaSqm: 0,
  estimatedTimeSec: 0,
};

const zones: Zone[] = [];

beforeEach(() => {
  saveAsMock.mockReset();
});

describe('POI-aware non-KMZ exports', () => {
  it('exports resolved heading and pitch in GPX extensions', async () => {
    const gpx = await captureSavedText(() => exportGpx([waypoint], config, [poi]));

    expect(gpx).toContain('<heading>90</heading>');
    expect(gpx).toContain('<cameraAngle>-35.733402996557494</cameraAngle>');
  });

  it('exports POIs and resolved orientation in JSON', async () => {
    const text = await captureSavedText(() => exportJson([waypoint], config, stats, zones, [poi]));
    const payload = JSON.parse(text) as {
      pois: POI[];
      waypoints: Array<{ resolvedHeading: number; resolvedGimbalPitch: number }>;
      config: MissionConfig;
    };

    expect(payload.config.waypointOrientationMode).toBe('poi');
    expect(payload.pois).toHaveLength(1);
    expect(payload.pois[0].id).toBe(poi.id);
    expect(payload.waypoints[0].resolvedHeading).toBeCloseTo(90, 2);
    expect(payload.waypoints[0].resolvedGimbalPitch).toBeCloseTo(-35.73, 2);
  });
});
