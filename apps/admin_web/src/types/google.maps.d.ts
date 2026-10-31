/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace google {
  export namespace maps {
    export interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    export class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    export class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    export class Size {
      constructor(width: number, height: number);
      width: number;
      height: number;
    }

    export interface MapOptions {
      center?: LatLngLiteral | LatLng;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      styles?: any[];
      [key: string]: any;
    }

    export class Map {
      constructor(mapDiv: HTMLElement | null, opts?: MapOptions);
      panTo(latLng: LatLngLiteral | LatLng): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      getCenter(): LatLng;
    }

    export interface MarkerLabel {
      text: string;
      color?: string;
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: string;
      className?: string;
    }

    export interface Icon {
      url: string;
      scaledSize?: Size;
      size?: Size;
      origin?: Point;
      anchor?: Point;
    }

    export interface MarkerOptions {
      position: LatLngLiteral | LatLng;
      map?: Map | null;
      title?: string;
      label?: string | MarkerLabel;
      icon?: string | Icon;
      [key: string]: any;
    }

    export class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latLng: LatLngLiteral | LatLng): void;
      setIcon(icon: string | Icon): void;
      setTitle(title: string): void;
    }

    export interface PolylineOptions {
      path?: LatLngLiteral[] | LatLng[];
      geodesic?: boolean;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      map?: Map | null;
      [key: string]: any;
    }

    export class Polyline {
      constructor(opts?: PolylineOptions);
      setMap(map: Map | null): void;
      setPath(path: LatLngLiteral[] | LatLng[]): void;
    }
  }
}

interface Window {
  google?: typeof google;
}
