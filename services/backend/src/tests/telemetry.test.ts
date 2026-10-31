import { telemetryPayloadSchema } from '../validation/telemetrySchemas';

describe('telemetryPayloadSchema', () => {
  const getValidPayload = () => ({
    busId: 'bus-cc-01',
    latitude: 12.9716,
    longitude: 77.5946,
    timestamp: Date.now() - 1000, // 1 second ago
    source: 'simulator' as const,
    speed: 30,
    heading: 180,
    accuracy: 5,
  });

  it('accepts valid payload', () => {
    const payload = getValidPayload();
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects latitude > 90', () => {
    const payload = { ...getValidPayload(), latitude: 90.001 };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('latitude'))).toBe(true);
    }
  });

  it('rejects latitude < -90', () => {
    const payload = { ...getValidPayload(), latitude: -90.001 };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('latitude'))).toBe(true);
    }
  });

  it('rejects longitude > 180', () => {
    const payload = { ...getValidPayload(), longitude: 180.001 };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('longitude'))).toBe(true);
    }
  });

  it('rejects longitude < -180', () => {
    const payload = { ...getValidPayload(), longitude: -180.001 };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('longitude'))).toBe(true);
    }
  });

  it('rejects missing busId', () => {
    const payload: any = getValidPayload();
    delete payload.busId;
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('busId'))).toBe(true);
    }
  });

  it('rejects speed > 200', () => {
    const payload = { ...getValidPayload(), speed: 205 };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('speed'))).toBe(true);
    }
  });

  it('rejects heading > 360', () => {
    const payload = { ...getValidPayload(), heading: 361 };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('heading'))).toBe(true);
    }
  });

  it('rejects future timestamp', () => {
    // 2 minutes into future exceeds the 1 minute future allowance
    const payload = { ...getValidPayload(), timestamp: Date.now() + 2 * 60 * 1000 };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('timestamp'))).toBe(true);
    }
  });

  it('rejects timestamp older than 5 minutes', () => {
    // 6 minutes in the past exceeds 5 minutes
    const payload = { ...getValidPayload(), timestamp: Date.now() - 6 * 60 * 1000 };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('timestamp'))).toBe(true);
    }
  });

  it('accepts simulator as source', () => {
    const payload = { ...getValidPayload(), source: 'simulator' as const };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts esp32 as source', () => {
    const payload = { ...getValidPayload(), source: 'esp32' as const };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts gps_device as source', () => {
    const payload = { ...getValidPayload(), source: 'gps_device' as const };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts phone_gps as source', () => {
    const payload = { ...getValidPayload(), source: 'phone_gps' as const };
    const result = telemetryPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
