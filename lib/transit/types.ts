export type TransitMode = string;

export type MotisPlace = {
  name?: string;
  stopId?: string;
  lat: number;
  lon: number;
  tz?: string;
  departure?: string;
  scheduledDeparture?: string;
  arrival?: string;
  scheduledArrival?: string;
  track?: string;
  platform?: string;
  description?: string;
  vertexType?: string;
  modes?: string[];
};

export type MotisEncodedPolyline = {
  points: string;
  precision?: number;
  length?: number;
};

export type MotisStep = {
  relativeDirection?: string;
  distance?: number;
  streetName?: string;
  polyline?: MotisEncodedPolyline;
};

export type MotisLeg = {
  mode: TransitMode;
  from: MotisPlace;
  to: MotisPlace;
  duration?: number;
  startTime?: string;
  endTime?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  realTime?: boolean;
  distance?: number;
  headsign?: string;
  routeShortName?: string;
  routeDisplayName?: string;
  routeColor?: string;
  routeTextColor?: string;
  agencyName?: string;
  tripId?: string;
  legGeometry?: MotisEncodedPolyline;
  steps?: MotisStep[];
  intermediateStops?: MotisPlace[];
};

export type MotisItinerary = {
  duration: number;
  startTime: string;
  endTime: string;
  transfers: number;
  legs: MotisLeg[];
};

export type MotisPlanResponse = {
  itineraries?: MotisItinerary[];
  direct?: MotisItinerary[];
};

export type TransitStop = {
  name: string;
  coordinate: [number, number];
  arrival?: string;
  departure?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  track?: string;
  platform?: string;
};

export type TransitLeg = {
  id: string;
  mode: TransitMode;
  isWalking: boolean;
  from: TransitStop;
  to: TransitStop;
  startTime: string;
  endTime: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  duration: number;
  distance: number;
  line?: string;
  headsign?: string;
  agency?: string;
  color: string;
  textColor?: string;
  geometry: [number, number][];
  intermediateStops: TransitStop[];
  realTime: boolean;
};

export type TransitItinerary = {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  transfers: number;
  distance: number;
  legs: TransitLeg[];
  timeZone?: string;
  combinedFromVia?: boolean;
};
