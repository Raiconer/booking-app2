export type Service = {
  id: string;
  name: string;
  durationMin: number;
  bufferMin: number;
  pricePln: number;
};

export type Specialist = {
  id: string;
  fullName: string;
  role: string;
  city: string;
  serviceIds: string[];
};

export type WorkingHours = {
  specialistId: string;
  weekday: number;
  start: string;
  end: string;
  breaks: Array<{ start: string; end: string }>;
};

export type Booking = {
  id: string;
  specialistId: string;
  serviceId: string;
  startIso: string;
  endIso: string;
  status: "new" | "confirmed" | "cancelled" | "no_show";
};