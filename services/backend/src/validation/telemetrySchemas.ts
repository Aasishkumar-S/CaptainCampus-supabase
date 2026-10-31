import { z } from 'zod';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_MINUTE_FUTURE_MS = 60 * 1000;

export const telemetryPayloadSchema = z.object({
  busId: z.string().min(1, 'Bus ID is required'),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  speed: z
    .number()
    .min(0, 'Speed must be positive')
    .max(200, 'Speed cannot exceed 200 km/h')
    .optional(),
  heading: z
    .number()
    .min(0, 'Heading must be between 0 and 360')
    .max(360, 'Heading must be between 0 and 360')
    .optional(),
  accuracy: z.number().positive('Accuracy must be positive meters').optional(),
  altitude: z.number().optional(),
  timestamp: z
    .number()
    .int('Timestamp must be unix epoch milliseconds')
    .refine(
      (ts) => {
        const now = Date.now();
        // Not older than 5 minutes, not more than 1 minute in the future (clock skew allowance)
        return ts >= now - FIVE_MINUTES_MS && ts <= now + ONE_MINUTE_FUTURE_MS;
      },
      {
        message: 'Timestamp must be recent (within the last 5 minutes and not in the future)',
      }
    ),
  source: z.enum(['gps_device', 'phone_gps', 'esp32', 'simulator']),
  deviceId: z.string().optional(),
  tripId: z.string().optional(),
});

export type TelemetryPayloadInput = z.infer<typeof telemetryPayloadSchema>;
