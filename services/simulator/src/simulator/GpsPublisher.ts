export interface TelemetryPayload {
  busId: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
  source: 'simulator';
}

export class GpsPublisher {
  constructor(private apiUrl: string, private deviceSecret: string) {}

  async publishLocation(payload: TelemetryPayload): Promise<boolean> {
    try {
      const url = `${this.apiUrl.replace(/\/$/, '')}/telemetry/location`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Token': this.deviceSecret,
          'X-Device-Id': payload.deviceId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[GpsPublisher] Failed to publish location for ${payload.busId} (${response.status}): ${errorText}`
        );
        return false;
      }

      return true;
    } catch (error: any) {
      console.error(
        `[GpsPublisher] Network error publishing location for ${payload.busId}:`,
        error?.message || error
      );
      return false;
    }
  }
}

export const gpsPublisher = new GpsPublisher(
  process.env.BACKEND_API_URL || 'http://localhost:4000/api/v1',
  process.env.GPS_DEVICE_SECRET || 'change_this_to_a_long_random_secret_in_production'
);
