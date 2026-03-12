import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportKmz } from '../kmzGenerator';
import * as fixtures from './fixtures/reference-missions';
import type { MissionConfig, POI, Waypoint } from '@/types/mission';

const { saveAsMock } = vi.hoisted(() => ({
  saveAsMock: vi.fn(),
}));

vi.mock('file-saver', () => ({
  saveAs: saveAsMock,
}));

async function captureKmzEntryContent(
  waypoints: Waypoint[],
  config: MissionConfig,
  entryPath: string,
  pois: POI[] = [],
): Promise<string> {
  let capturedBlob: Blob | null = null;

  saveAsMock.mockImplementation((blob: Blob) => {
    capturedBlob = blob;
  });

  await exportKmz(waypoints, config, pois);
  if (!capturedBlob) throw new Error('No blob captured');

  const JSZip = (await import('jszip')).default;
  const zipData = capturedBlob instanceof Blob ? await capturedBlob.arrayBuffer() : capturedBlob;
  const zip = await JSZip.loadAsync(zipData);
  const file = zip.file(entryPath);
  if (!file) throw new Error(`No ${entryPath} in KMZ`);

  return await file.async('string');
}

beforeEach(() => {
  saveAsMock.mockReset();
});

describe('KMZ Export Contract', () => {
  it('should generate KMZ for simple grid mission', async () => {
    const kml = await captureKmzEntryContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config,
      'wpmz/waylines.wpml',
    );

    expect(kml).toContain('<?xml version="1.0"');
    expect(kml).toContain('wpml:missionConfig');
    expect(kml).toContain('Placemark');
  });

  it('should preserve all waypoint coordinates', async () => {
    const kml = await captureKmzEntryContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config,
      'wpmz/waylines.wpml',
    );

    for (const wp of fixtures.simpleGridMission.waypoints) {
      expect(kml).toContain(wp.lat.toString());
      expect(kml).toContain(wp.lng.toString());
      expect(kml).toContain(wp.altitude.toString());
    }
  });

  it('should include action metadata', async () => {
    const kml = await captureKmzEntryContent(
      fixtures.photoCaptureMission.waypoints,
      fixtures.photoCaptureMission.config,
      'wpmz/waylines.wpml',
    );

    expect(kml).toContain('takePhoto');
  });

  it('should include speed and drone model', async () => {
    const kml = await captureKmzEntryContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config,
      'wpmz/template.kml',
    );

    expect(kml).toContain(fixtures.DEFAULT_CONFIG.speed.toString());
    expect(kml).toContain('<wpml:droneEnumValue>77</wpml:droneEnumValue>');
  });

  it('should be deterministic (same input = same output)', async () => {
    const kml1 = await captureKmzEntryContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config,
      'wpmz/waylines.wpml',
    );
    const kml2 = await captureKmzEntryContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config,
      'wpmz/waylines.wpml',
    );

    expect(kml1).toBe(kml2);
  });

  it('should emit towardPOI heading and derived gimbal pitch for POI orientation mode', async () => {
    const poi: POI = {
      id: 'poi-1',
      name: 'Tower',
      lat: 51.505,
      lng: -0.09,
      altitude: 20,
      category: 'structure',
      radiusMeters: 10,
    };
    const config: MissionConfig = {
      ...fixtures.DEFAULT_CONFIG,
      waypointOrientationMode: 'poi',
      waypointOrientationPoiId: poi.id,
    };

    const waylines = await captureKmzEntryContent(fixtures.simpleGridMission.waypoints, config, 'wpmz/waylines.wpml', [poi]);
    const template = await captureKmzEntryContent(fixtures.simpleGridMission.waypoints, config, 'wpmz/template.kml', [poi]);

    expect(waylines).toContain('<wpml:waypointHeadingMode>towardPOI</wpml:waypointHeadingMode>');
    expect(waylines).toContain(`<wpml:waypointPoiPoint>${poi.lat.toFixed(6)},${poi.lng.toFixed(6)},0.000000</wpml:waypointPoiPoint>`);
    expect(waylines).toContain('gimbalRotate');
    expect(template).toContain('<wpml:gimbalPitchMode>usePointSetting</wpml:gimbalPitchMode>');
    expect(template).toContain('<wpml:gimbalPitchAngle>');
  });
});
