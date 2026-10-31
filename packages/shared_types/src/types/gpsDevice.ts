export type GpsDeviceType = 'esp32' | 'android_phone' | 'dedicated_tracker' | 'simulator';
export type GpsDeviceStatus = 'active' | 'inactive' | 'offline' | 'maintenance';

export interface GpsDevice {
  deviceId: string;
  deviceType: GpsDeviceType;
  assignedBusId?: string;
  status: GpsDeviceStatus;
  lastSeenAt?: number;      // Unix ms
  firmwareVersion?: string;
  imei?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
