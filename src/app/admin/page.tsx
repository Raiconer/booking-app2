"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  services as fallbackServices,
  specialists as fallbackSpecialists,
  workingHours as fallbackWorkingHours
} from "@/lib/mock-data";
import { Service, Specialist, WorkingHours } from "@/lib/types";

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Niedziela" },
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" }
];

export default function AdminPage() {
  type BreakDraft = {
    start: string;
    end: string;
  };

  const [catalog, setCatalog] = useState<{
    services: Service[];
    specialists: Specialist[];
    workingHours: WorkingHours[];
  }>({
    services: fallbackServices,
    specialists: fallbackSpecialists,
    workingHours: fallbackWorkingHours
  });

  const [specialistForm, setSpecialistForm] = useState({
    fullName: "",
    role: "",
    city: "",
    serviceIds: [] as string[]
  });

  const [hoursForm, setHoursForm] = useState({
    specialistId: "",
    weekday: 1,
    start: "09:00",
    end: "17:00",
    breaks: [{ start: "", end: "" }] as BreakDraft[]
  });

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const refreshCatalog = async () => {
    const response = await fetch("/api/catalog", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Nie udało się odświeżyć katalogu");
    }

    const data = (await response.json()) as {
      services: Service[];
      specialists: Specialist[];
      workingHours: WorkingHours[];
    };

    setCatalog(data);
    setHoursForm((current) => ({
      ...current,
      specialistId: current.specialistId || data.specialists[0]?.id || ""
    }));
  };

  useEffect(() => {
    void refreshCatalog().catch(() => {
      // Keep fallback data if API fails.
    });
  }, []);

  const selectedHours = useMemo(() => {
    if (!hoursForm.specialistId) {
      return [];
    }

    return catalog.workingHours
      .filter((item) => item.specialistId === hoursForm.specialistId)
      .sort((a, b) => a.weekday - b.weekday);
  }, [catalog.workingHours, hoursForm.specialistId]);

  const handleCreateSpecialist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/specialists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(specialistForm)
      });

      const data = (await response.json()) as { error?: string; specialist?: Specialist };
      if (!response.ok) {
        setErrorMessage(data.error ?? "Nie udało się dodać specjalisty");
        return;
      }

      setSpecialistForm({
        fullName: "",
        role: "",
        city: "",
        serviceIds: []
      });
      setStatusMessage(`Dodano specjalistę: ${data.specialist?.fullName ?? ""}`.trim());
      await refreshCatalog();
    } catch {
      setErrorMessage("Błąd sieci podczas dodawania specjalisty");
    }
  };

  const handleSaveHours = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hoursForm)
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setErrorMessage(data.error ?? "Nie udało się zapisać godzin pracy");
        return;
      }

      setStatusMessage("Zapisano godziny pracy.");
      await refreshCatalog();
    } catch {
      setErrorMessage("Błąd sieci podczas zapisu godzin pracy");
    }
  };

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Panel administratora</p>
        <h1>Zarządzanie specjalistami i grafikiem</h1>
        <p>
          To wersja MVP bez logowania. Dane zapisują się lokalnie w plikach JSON i są od razu widoczne
          w kalendarzu rezerwacji.
        </p>
        <div className="step-actions">
          <Link href="/admin/rezerwacje" className="secondary-action link-action">
            Przegląd rezerwacji specjalisty
          </Link>
          <Link href="/" className="primary-action link-action">
            Wróć do kalendarza
          </Link>
        </div>
      </section>

      {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <section className="admin-grid">
        <article className="booking-form-panel">
          <h2>Dodaj specjalistę</h2>
          <form className="booking-form" onSubmit={handleCreateSpecialist}>
            <label>
              Imię i nazwisko
              <input
                required
                type="text"
                value={specialistForm.fullName}
                onChange={(event) => {
                  setSpecialistForm((current) => ({ ...current, fullName: event.target.value }));
                }}
              />
            </label>

            <label>
              Rola
              <input
                required
                type="text"
                value={specialistForm.role}
                onChange={(event) => {
                  setSpecialistForm((current) => ({ ...current, role: event.target.value }));
                }}
              />
            </label>

            <label>
              Miasto
              <input
                required
                type="text"
                value={specialistForm.city}
                onChange={(event) => {
                  setSpecialistForm((current) => ({ ...current, city: event.target.value }));
                }}
              />
            </label>

            <label>
              Usługi
              <div className="services-checklist">
                {catalog.services.map((service) => {
                  const checked = specialistForm.serviceIds.includes(service.id);
                  return (
                    <label key={service.id} className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setSpecialistForm((current) => {
                            const next = event.target.checked
                              ? [...current.serviceIds, service.id]
                              : current.serviceIds.filter((item) => item !== service.id);

                            return { ...current, serviceIds: Array.from(new Set(next)) };
                          });
                        }}
                      />
                      {service.name}
                    </label>
                  );
                })}
              </div>
            </label>

            <button type="submit" className="primary-action">
              Dodaj specjalistę
            </button>
          </form>
        </article>

        <article className="booking-form-panel">
          <h2>Ustaw godziny pracy</h2>
          <form className="booking-form" onSubmit={handleSaveHours}>
            <label>
              Specjalista
              <select
                required
                value={hoursForm.specialistId}
                onChange={(event) => {
                  setHoursForm((current) => ({ ...current, specialistId: event.target.value }));
                }}
              >
                <option value="" disabled>
                  Wybierz specjalistę
                </option>
                {catalog.specialists.map((specialist) => (
                  <option key={specialist.id} value={specialist.id}>
                    {specialist.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Dzień tygodnia
              <select
                value={hoursForm.weekday}
                onChange={(event) => {
                  setHoursForm((current) => ({
                    ...current,
                    weekday: Number(event.target.value)
                  }));
                }}
              >
                {WEEKDAY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-time-grid">
              <label>
                Od
                <input
                  required
                  type="time"
                  value={hoursForm.start}
                  onChange={(event) => {
                    setHoursForm((current) => ({ ...current, start: event.target.value }));
                  }}
                />
              </label>

              <label>
                Do
                <input
                  required
                  type="time"
                  value={hoursForm.end}
                  onChange={(event) => {
                    setHoursForm((current) => ({ ...current, end: event.target.value }));
                  }}
                />
              </label>
            </div>

            {hoursForm.breaks.map((breakItem, index) => (
              <div key={`break-${index}`} className="admin-break-row">
                <div className="admin-time-grid">
                  <label>
                    Przerwa od (opcjonalnie)
                    <input
                      type="time"
                      value={breakItem.start}
                      onChange={(event) => {
                        setHoursForm((current) => ({
                          ...current,
                          breaks: current.breaks.map((item, idx) =>
                            idx === index ? { ...item, start: event.target.value } : item
                          )
                        }));
                      }}
                    />
                  </label>

                  <label>
                    Przerwa do (opcjonalnie)
                    <input
                      type="time"
                      value={breakItem.end}
                      onChange={(event) => {
                        setHoursForm((current) => ({
                          ...current,
                          breaks: current.breaks.map((item, idx) =>
                            idx === index ? { ...item, end: event.target.value } : item
                          )
                        }));
                      }}
                    />
                  </label>
                </div>

                {hoursForm.breaks.length > 1 ? (
                  <button
                    type="button"
                    className="text-action"
                    onClick={() => {
                      setHoursForm((current) => ({
                        ...current,
                        breaks: current.breaks.filter((_, idx) => idx !== index)
                      }));
                    }}
                  >
                    Usuń tę przerwę
                  </button>
                ) : null}
              </div>
            ))}

            <button
              type="button"
              className="secondary-action"
              onClick={() => {
                setHoursForm((current) => ({
                  ...current,
                  breaks: [...current.breaks, { start: "", end: "" }]
                }));
              }}
            >
              Dodaj kolejną przerwę
            </button>

            <button type="submit" className="primary-action" disabled={!hoursForm.specialistId}>
              Zapisz godziny
            </button>
          </form>

          <div className="hours-list">
            <h3>Aktualny grafik specjalisty</h3>
            {selectedHours.length === 0 ? (
              <p className="selected-summary">Brak zapisanych godzin.</p>
            ) : (
              <ul>
                {selectedHours.map((item) => {
                  const weekdayLabel = WEEKDAY_OPTIONS.find((option) => option.value === item.weekday)?.label;
                  const breakText =
                    item.breaks.length > 0
                      ? `, przerwy ${item.breaks.map((entry) => `${entry.start}-${entry.end}`).join("; ")}`
                      : "";

                  return (
                    <li key={`${item.specialistId}-${item.weekday}`}>
                      {weekdayLabel}: {item.start}-{item.end}
                      {breakText}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
