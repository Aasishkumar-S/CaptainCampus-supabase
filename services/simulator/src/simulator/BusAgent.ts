import { SimRoute, SimStop } from '../data/routeData';
import { gpsPublisher } from './GpsPublisher';

export type BusScenario = 'normal' | 'delayed' | 'signal_loss' | 'stopped';

export interface BusAgentConfig {
  busId: string;
  busNumber: string;
  deviceId: string;
  route: SimRoute;
  startStopIndex?: number;
  scenario?: BusScenario;
  updateIntervalMs?: number;
  speedMultiplier?: number;
}

export class BusAgent {
  private currentStopIndex: number;
  private progressFraction: number; // 0.0-1.0 between current and next stop
  private currentScenario: BusScenario;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private config: Required<BusAgentConfig>;
  private skipPublishCount: number = 0; // for signal_loss scenario

  constructor(config: BusAgentConfig) {
    this.config = {
      startStopIndex: 0,
      scenario: 'normal',
      updateIntervalMs: Number(process.env.SIMULATOR_UPDATE_INTERVAL_MS) || 5000,
      speedMultiplier: Number(process.env.SIMULATOR_SPEED_MULTIPLIER) || 1.0,
      ...config,
    };
    this.currentStopIndex = this.config.startStopIndex % this.config.route.stops.length;
    this.progressFraction = 0;
    this.currentScenario = this.config.scenario;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(
      `[BusAgent] Started agent for ${this.config.busNumber} (${this.config.busId}) on route ${this.config.route.routeCode}`
    );

    // Initial immediate tick, then repeat periodically
    this.tick().catch((err) =>
      console.error(`[BusAgent ${this.config.busNumber}] Error on initial tick:`, err)
    );

    this.timer = setInterval(async () => {
      if (!this.isRunning) return;
      try {
        await this.tick();
      } catch (err) {
        console.error(`[BusAgent ${this.config.busNumber}] Error during tick:`, err);
      }
    }, this.config.updateIntervalMs);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log(`[BusAgent] Stopped agent for ${this.config.busNumber} (${this.config.busId})`);
  }

  public setScenario(scenario: BusScenario): void {
    const previous = this.currentScenario;
    this.currentScenario = scenario;
    this.skipPublishCount = 0;
    console.log(
      `[BusAgent] ${this.config.busNumber} scenario transitioned: ${previous} -> ${scenario}`
    );
  }

  public getScenario(): BusScenario {
    return this.currentScenario;
  }

  public getConfig(): Required<BusAgentConfig> {
    return this.config;
  }

  private async tick(): Promise<void> {
    const stops = this.config.route.stops;
    if (stops.length < 2) {
      console.warn(`[BusAgent ${this.config.busNumber}] Route has fewer than 2 stops.`);
      return;
    }

    const currentStop = stops[this.currentStopIndex];
    const nextStopIndex = this.getNextStopIndex();
    const nextStop = stops[nextStopIndex];

    const segmentDistanceM = Math.max(1, this.haversineDistanceM(currentStop, nextStop));
    const speedKmh = this.calculateSpeed();
    const intervalSec = this.config.updateIntervalMs / 1000;
    const speedMps = (speedKmh * 1000) / 3600;

    // Advance progress fraction based on speed & multiplier
    if (this.currentScenario !== 'stopped') {
      const distanceMovedM = speedMps * intervalSec * this.config.speedMultiplier;
      this.progressFraction += distanceMovedM / segmentDistanceM;
    }

    // Wrap over to next stop if segment reached
    if (this.progressFraction >= 1.0) {
      this.currentStopIndex = nextStopIndex;
      this.progressFraction = Math.max(0, this.progressFraction - 1.0);
    }

    const activeFromStop = stops[this.currentStopIndex];
    const activeToStop = stops[this.getNextStopIndex()];
    const interpolatedPos = this.interpolatePosition(
      activeFromStop,
      activeToStop,
      this.progressFraction
    );
    const heading = this.calculateHeading(
      { lat: activeFromStop.latitude, lng: activeFromStop.longitude },
      { lat: activeToStop.latitude, lng: activeToStop.longitude }
    );
    const accuracy = this.getAccuracy();

    // Signal loss handling
    if (this.currentScenario === 'signal_loss') {
      this.skipPublishCount++;
      console.log(
        `[${this.config.busNumber}] ${this.config.route.routeCode}: SIGNAL LOSS (Tick #${this.skipPublishCount} skipped) | Near ${activeFromStop.name}`
      );
      return;
    }

    // Publish telemetry to backend
    const payload = {
      busId: this.config.busId,
      deviceId: this.config.deviceId,
      latitude: Number(interpolatedPos.lat.toFixed(6)),
      longitude: Number(interpolatedPos.lng.toFixed(6)),
      speed: Math.round(speedKmh * 10) / 10,
      heading: Math.round(heading),
      accuracy: Math.round(accuracy * 10) / 10,
      timestamp: Date.now(),
      source: 'simulator' as const,
    };

    await gpsPublisher.publishLocation(payload);

    // Calculate estimated time remaining for current segment
    const remainingSegmentDistanceM = segmentDistanceM * Math.max(0, 1 - this.progressFraction);
    const etaMinutes =
      speedMps > 0 ? (remainingSegmentDistanceM / speedMps / 60).toFixed(1) : 'Stopped';

    const progressPct = Math.round(this.progressFraction * 100);
    console.log(
      `[${this.config.busNumber}] ${this.config.route.routeCode}: ${activeFromStop.name} -> ${activeToStop.name} | ${progressPct}% | ${speedKmh.toFixed(0)} km/h | ETA ~${etaMinutes}min`
    );
  }

  private interpolatePosition(
    from: SimStop,
    to: SimStop,
    progress: number
  ): { lat: number; lng: number } {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const lat = from.latitude + (to.latitude - from.latitude) * clampedProgress;
    const lng = from.longitude + (to.longitude - from.longitude) * clampedProgress;
    return { lat, lng };
  }

  private calculateHeading(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);
    const dLng = toRad(to.lng - from.lng);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  }

  private haversineDistanceM(from: SimStop, to: SimStop): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(to.latitude - from.latitude);
    const dLng = toRad(to.longitude - from.longitude);
    const lat1 = toRad(from.latitude);
    const lat2 = toRad(to.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private getNextStopIndex(): number {
    const totalStops = this.config.route.stops.length;
    return (this.currentStopIndex + 1) % totalStops;
  }

  private calculateSpeed(): number {
    const jitter = (Math.random() - 0.5) * 4; // +/- 2 km/h jitter

    switch (this.currentScenario) {
      case 'stopped':
        return 0;
      case 'delayed':
        // 8-15 km/h with jitter
        return Math.max(5, Math.min(18, 11 + jitter));
      case 'signal_loss':
      case 'normal':
      default:
        // 25-45 km/h with jitter
        return Math.max(20, Math.min(50, 35 + jitter * 2));
    }
  }

  private getAccuracy(): number {
    // 3 - 15 meters with random jitter
    return 3 + Math.random() * 12;
  }
}
