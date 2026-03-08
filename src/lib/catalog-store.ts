import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { services, specialists as mockSpecialists, workingHours as mockWorkingHours } from "@/lib/mock-data";
import { Service, Specialist, WorkingHours } from "@/lib/types";

const DATA_DIR = join(process.cwd(), "data");
const SPECIALISTS_FILE = join(DATA_DIR, "specialists.json");
const WORKING_HOURS_FILE = join(DATA_DIR, "working-hours.json");

type RuntimeCatalog = {
  services: Service[];
  specialists: Specialist[];
  workingHours: WorkingHours[];
};

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray<T>(filePath: string, rows: T[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

export async function getRuntimeCatalog(): Promise<RuntimeCatalog> {
  const storedSpecialists = await readJsonArray<Specialist>(SPECIALISTS_FILE);
  const storedWorkingHours = await readJsonArray<WorkingHours>(WORKING_HOURS_FILE);

  const specialistsMap = new Map<string, Specialist>();
  for (const row of mockSpecialists) {
    specialistsMap.set(row.id, row);
  }
  for (const row of storedSpecialists) {
    specialistsMap.set(row.id, row);
  }

  const hoursMap = new Map<string, WorkingHours>();
  for (const row of mockWorkingHours) {
    const key = `${row.specialistId}:${row.weekday}`;
    hoursMap.set(key, row);
  }
  for (const row of storedWorkingHours) {
    const key = `${row.specialistId}:${row.weekday}`;
    hoursMap.set(key, row);
  }

  return {
    services,
    specialists: Array.from(specialistsMap.values()),
    workingHours: Array.from(hoursMap.values())
  };
}

export async function addRuntimeSpecialist(newSpecialist: Specialist): Promise<void> {
  const storedSpecialists = await readJsonArray<Specialist>(SPECIALISTS_FILE);
  const next = [...storedSpecialists, newSpecialist];
  await writeJsonArray(SPECIALISTS_FILE, next);
}

export async function upsertRuntimeWorkingHours(newHours: WorkingHours): Promise<void> {
  const storedWorkingHours = await readJsonArray<WorkingHours>(WORKING_HOURS_FILE);
  const index = storedWorkingHours.findIndex(
    (item) => item.specialistId === newHours.specialistId && item.weekday === newHours.weekday
  );

  if (index >= 0) {
    storedWorkingHours[index] = newHours;
  } else {
    storedWorkingHours.push(newHours);
  }

  await writeJsonArray(WORKING_HOURS_FILE, storedWorkingHours);
}
