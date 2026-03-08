import { Booking, Service, Specialist, WorkingHours } from "@/lib/types";

export const services: Service[] = [
  {
    id: "therapy-individual",
    name: "Sesja terapii indywidualnej",
    durationMin: 60,
    bufferMin: 0,
    pricePln: 220
  },
  {
    id: "consultation",
    name: "Konsultacja wstępna",
    durationMin: 60,
    bufferMin: 0,
    pricePln: 280
  },
  {
    id: "couples-therapy",
    name: "Terapia par",
    durationMin: 30,
    bufferMin: 0,
    pricePln: 320
  }
];

export const specialists: Specialist[] = [
  {
    id: "spec-aleksandra",
    fullName: "Aleksandra Zielinska",
    role: "Psychoterapeutka",
    city: "Warszawa",
    serviceIds: ["therapy-individual", "consultation"]
  },
  {
    id: "spec-joanna",
    fullName: "Joanna Witkowska",
    role: "Psycholożka",
    city: "Kraków",
    serviceIds: ["therapy-individual", "couples-therapy"]
  },
  {
    id: "spec-marcin",
    fullName: "Marcin Lewandowski",
    role: "Psychoterapeuta",
    city: "Warszawa",
    serviceIds: ["consultation", "couples-therapy"]
  },
  {
    id: "spec-ewa",
    fullName: "Ewa Nowak",
    role: "Psycholożka",
    city: "Gdańsk",
    serviceIds: ["therapy-individual", "consultation", "couples-therapy"]
  }
];

export const workingHours: WorkingHours[] = [
  {
    specialistId: "spec-aleksandra",
    weekday: 0,
    start: "09:00",
    end: "15:00",
    breaks: [{ start: "12:00", end: "12:30" }]
  },
  {
    specialistId: "spec-aleksandra",
    weekday: 1,
    start: "08:00",
    end: "16:00",
    breaks: [{ start: "12:00", end: "12:40" }]
  },
  {
    specialistId: "spec-aleksandra",
    weekday: 2,
    start: "09:00",
    end: "17:00",
    breaks: [{ start: "13:00", end: "13:30" }]
  },
  {
    specialistId: "spec-aleksandra",
    weekday: 3,
    start: "11:00",
    end: "19:00",
    breaks: [{ start: "15:00", end: "15:30" }]
  },
  {
    specialistId: "spec-aleksandra",
    weekday: 4,
    start: "09:00",
    end: "17:00",
    breaks: [{ start: "13:00", end: "13:30" }]
  },
  {
    specialistId: "spec-aleksandra",
    weekday: 5,
    start: "08:00",
    end: "14:00",
    breaks: [{ start: "11:00", end: "11:20" }]
  },
  {
    specialistId: "spec-aleksandra",
    weekday: 6,
    start: "09:00",
    end: "13:00",
    breaks: []
  },
  {
    specialistId: "spec-joanna",
    weekday: 0,
    start: "10:00",
    end: "15:00",
    breaks: [{ start: "12:30", end: "13:00" }]
  },
  {
    specialistId: "spec-joanna",
    weekday: 1,
    start: "12:00",
    end: "18:00",
    breaks: [{ start: "15:00", end: "15:30" }]
  },
  {
    specialistId: "spec-joanna",
    weekday: 2,
    start: "09:00",
    end: "17:00",
    breaks: [{ start: "13:00", end: "13:30" }]
  },
  {
    specialistId: "spec-joanna",
    weekday: 4,
    start: "10:00",
    end: "18:00",
    breaks: [{ start: "14:20", end: "15:00" }]
  },
  {
    specialistId: "spec-joanna",
    weekday: 5,
    start: "10:00",
    end: "16:00",
    breaks: [{ start: "13:00", end: "13:30" }]
  },
  {
    specialistId: "spec-joanna",
    weekday: 6,
    start: "09:00",
    end: "13:00",
    breaks: []
  },
  {
    specialistId: "spec-marcin",
    weekday: 0,
    start: "08:00",
    end: "12:00",
    breaks: []
  },
  {
    specialistId: "spec-marcin",
    weekday: 1,
    start: "10:00",
    end: "18:00",
    breaks: [{ start: "13:00", end: "13:30" }]
  },
  {
    specialistId: "spec-marcin",
    weekday: 2,
    start: "11:00",
    end: "18:00",
    breaks: [{ start: "14:00", end: "14:20" }]
  },
  {
    specialistId: "spec-marcin",
    weekday: 3,
    start: "09:00",
    end: "16:00",
    breaks: [{ start: "12:00", end: "12:30" }]
  },
  {
    specialistId: "spec-marcin",
    weekday: 4,
    start: "09:00",
    end: "17:00",
    breaks: [{ start: "13:00", end: "13:30" }]
  },
  {
    specialistId: "spec-marcin",
    weekday: 5,
    start: "08:00",
    end: "15:00",
    breaks: [{ start: "11:10", end: "11:40" }]
  },
  {
    specialistId: "spec-marcin",
    weekday: 6,
    start: "09:00",
    end: "13:00",
    breaks: []
  },
  {
    specialistId: "spec-ewa",
    weekday: 0,
    start: "12:00",
    end: "17:00",
    breaks: [{ start: "14:30", end: "15:00" }]
  },
  {
    specialistId: "spec-ewa",
    weekday: 1,
    start: "12:00",
    end: "18:00",
    breaks: [{ start: "15:30", end: "16:00" }]
  },
  {
    specialistId: "spec-ewa",
    weekday: 2,
    start: "08:00",
    end: "16:00",
    breaks: [{ start: "11:30", end: "12:00" }]
  },
  {
    specialistId: "spec-ewa",
    weekday: 3,
    start: "12:00",
    end: "20:00",
    breaks: [{ start: "16:00", end: "16:40" }]
  },
  {
    specialistId: "spec-ewa",
    weekday: 4,
    start: "11:00",
    end: "18:00",
    breaks: [{ start: "14:00", end: "14:30" }]
  },
  {
    specialistId: "spec-ewa",
    weekday: 5,
    start: "10:00",
    end: "16:00",
    breaks: [{ start: "13:00", end: "13:30" }]
  },
  {
    specialistId: "spec-ewa",
    weekday: 6,
    start: "09:00",
    end: "14:00",
    breaks: []
  }
];

const now = new Date();
const day = 24 * 60 * 60 * 1000;

export const bookings: Booking[] = [
  {
    id: "b-1",
    specialistId: "spec-aleksandra",
    serviceId: "therapy-individual",
    startIso: new Date(now.getTime() + day + 9 * 60 * 60 * 1000).toISOString(),
    endIso: new Date(now.getTime() + day + 10 * 60 * 60 * 1000).toISOString(),
    status: "confirmed"
  },
  {
    id: "b-2",
    specialistId: "spec-joanna",
    serviceId: "couples-therapy",
    startIso: new Date(now.getTime() + 2 * day + 11 * 60 * 60 * 1000).toISOString(),
    endIso: new Date(now.getTime() + 2 * day + (11 * 60 + 30) * 60 * 1000).toISOString(),
    status: "confirmed"
  },
  {
    id: "b-3",
    specialistId: "spec-ewa",
    serviceId: "consultation",
    startIso: new Date(now.getTime() + 3 * day + 14 * 60 * 60 * 1000).toISOString(),
    endIso: new Date(now.getTime() + 3 * day + 15 * 60 * 60 * 1000).toISOString(),
    status: "new"
  }
];