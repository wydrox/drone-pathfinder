import { describe, it, expect, beforeAll } from 'vitest';
import { exportKmz } from '../kmzGenerator';
import * as fixtures from './fixtures/reference-missions';

// Helper to capture blob content
async function captureKmlContent(waypoints: any[], config: any): Promise<string> {
  let capturedBlob: Blob | null = null;
  
  // Mock saveAs to capture the blob
  const originalSaveAs = (globalThis as any).saveAs;
  (globalThis as any).saveAs = (blob: Blob) => {
    capturedBlob = blob;
  };
  
  try {
    await exportKmz(waypoints, config);
    if (!capturedBlob) throw new Error('No blob captured');
    
    // Extract KML from KMZ (ZIP)
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(capturedBlob);
    const kmlFile = zip.file(/\.kml$|\.wpml$/i)[0];
    if (!kmlFile) throw new Error('No KML file in KMZ');
    
    return await kmlFile.async('string');
  } finally {
    (globalThis as any).saveAs = originalSaveAs;
  }
}

describe('KMZ Export Contract', () => {
  it('should generate KMZ for simple grid mission', async () => {
    const kml = await captureKmlContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config
    );
    
    expect(kml).toContain('<?xml version="1.0"');
    expect(kml).toContain('waylines.wpml');
    expect(kml).toContain('wpml:missionConfig');
    expect(kml).toContain('Placemark');
  });
  
  it('should preserve all waypoint coordinates', async () => {
    const kml = await captureKmlContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config
    );
    
    // Check each waypoint is in the KML
    for (const wp of fixtures.simpleGridMission.waypoints) {
      expect(kml).toContain(wp.lat.toString());
      expect(kml).toContain(wp.lng.toString());
      expect(kml).toContain(wp.altitude.toString());
    }
  });
  
  it('should include action metadata', async () => {
    const kml = await captureKmlContent(
      fixtures.photoCaptureMission.waypoints,
      fixtures.photoCaptureMission.config
    );
    
    expect(kml).toContain('photo');
  });
  
  it('should include speed and drone model', async () => {
    const kml = await captureKmlContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config
    );
    
    expect(kml).toContain(fixtures.DEFAULT_CONFIG.speed.toString());
    expect(kml).toContain(fixtures.DEFAULT_CONFIG.droneModel);
  });
  
  it('should be deterministic (same input = same output)', async () => {
    const kml1 = await captureKmlContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config
    );
    const kml2 = await captureKmlContent(
      fixtures.simpleGridMission.waypoints,
      fixtures.simpleGridMission.config
    );
    
    expect(kml1).toBe(kml2);
  });
});
