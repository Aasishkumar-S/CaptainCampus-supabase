import { Bus, BusSummary } from '../types/bus';
import { Route, RouteSummary } from '../types/route';
import { Stop, StopWithDistance } from '../types/stop';
import { Trip, TripSummary } from '../types/trip';
import { ETAResult, LiveLocationWithStatus } from '../types/liveLocation';

/**
 * Standard structured API envelope returned by backend endpoints.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  timestamp: string; // ISO 8601
}

/**
 * Standardized error payload representation.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown> | Array<unknown> | string;
}

/**
 * Generic paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Response for bus fleet listing with live location and state.
 */
export interface BusWithLiveState extends Bus {
  liveLocation?: LiveLocationWithStatus;
  driverName?: string;
  routeName?: string;
}

export type BusListResponse = ApiResponse<BusWithLiveState[]>;

export interface BusDetailResponseData {
  bus: Bus;
  liveLocation?: LiveLocationWithStatus;
  currentTrip?: Trip;
  assignedDriver?: {
    driverId: string;
    name: string;
    phone: string;
  };
  assignedRoute?: Route;
}

export type BusDetailResponse = ApiResponse<BusDetailResponseData>;

/**
 * Responses for route endpoints.
 */
export type RouteListResponse = ApiResponse<RouteSummary[]>;

export interface RouteDetailResponseData {
  route: Route;
  stops: Stop[];
  activeBuses?: BusSummary[];
}

export type RouteDetailResponse = ApiResponse<RouteDetailResponseData>;

/**
 * Responses for bus stop endpoints.
 */
export type StopListResponse = ApiResponse<Stop[]>;
export type StopDetailResponse = ApiResponse<Stop>;

/**
 * Dynamic stop arrival ETA calculation response.
 */
export interface ETAResponseData {
  stopId: string;
  etas: ETAResult[];
}

export type ETAResponse = ApiResponse<ETAResponseData>;

/**
 * Missed bus alternative recommendation item.
 */
export interface MissedBusRecommendation {
  type: 'next_bus_same_stop' | 'alternative_stop_same_route' | 'alternative_route';
  busId: string;
  busNumber: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  departureStopId: string;
  departureStopName: string;
  etaMinutes: number;
  estimatedDepartureTime: string; // ISO 8601
  walkingDistanceMeters?: number;
  walkingMinutes?: number;
  advice: string;
}

export interface MissedBusResponseData {
  originalStopId: string;
  recommendations: MissedBusRecommendation[];
  nearbyStops: StopWithDistance[];
}

export type MissedBusResponse = ApiResponse<MissedBusResponseData>;

/**
 * Administrative fleet summary metrics.
 */
export interface DashboardStatsResponseData {
  totalBuses: number;
  activeBusesOnTrip: number;
  inMaintenanceBuses: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  totalStops: number;
  activeTripsCount: number;
  delayedTripsCount: number;
  recentAlertsCount: number;
}

export type DashboardStatsResponse = ApiResponse<DashboardStatsResponseData>;

/**
 * Trip endpoints responses.
 */
export type TripListResponse = ApiResponse<PaginatedResponse<TripSummary>>;
export type TripDetailResponse = ApiResponse<Trip>;
