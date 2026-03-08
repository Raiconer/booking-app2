"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { slotToIso } from "@/lib/date";
import {
  services as fallbackServices,
  specialists as fallbackSpecialists
} from "@/lib/mock-data";
import { Booking, Service, Specialist } from "@/lib/types";

export default function BookingStepPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const specialistId = searchParams.get("specialistId") ?? "";
  const dateKey = searchParams.get("dateKey") ?? "";
  const dayLabel = searchParams.get("dayLabel") ?? "";
  const hourMinute = searchParams.get("time") ?? "";
  const availableMinutes = Number(searchParams.get("availableMinutes") ?? "0");
  const preferredServiceId = searchParams.get("preferredServiceId") ?? "all";

  const [catalog, setCatalog] = useState<{
    services: Service[];
    specialists: Specialist[];
  }>({
    services: fallbackServices,
    specialists: fallbackSpecialists
  });

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          services: Service[];
          specialists: Specialist[];
        };

        if (!Array.isArray(data.services) || !Array.isArray(data.specialists)) {
          return;
        }

        setCatalog({
          services: data.services,
          specialists: data.specialists
        });
      } catch {
        // Keep fallback catalog when network request fails.
      }
    };

    void loadCatalog();
  }, []);

  const specialist = catalog.specialists.find((item) => item.id === specialistId);
  const specialistServices = useMemo(() => {
    if (!specialist) {
      return [];
    }
    return catalog.services.filter((item) => specialist.serviceIds.includes(item.id));
  }, [catalog.services, specialist]);

  const [bookingServiceId, setBookingServiceId] = useState<string>("");

  useEffect(() => {
    if (!specialist) {
      setBookingServiceId("");
      return;
    }

    if (bookingServiceId && specialist.serviceIds.includes(bookingServiceId)) {
      return;
    }

    if (preferredServiceId !== "all" && specialist.serviceIds.includes(preferredServiceId)) {
      setBookingServiceId(preferredServiceId);
      return;
    }

    setBookingServiceId(specialistServices[0]?.id ?? "");
  }, [bookingServiceId, preferredServiceId, specialist, specialistServices]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    phone: "",
    termsConsent: false,
    marketingConsent: false
  });

  const selectedService = catalog.services.find((item) => item.id === bookingServiceId);
  const canFitService =
    !selectedService || availableMinutes >= selectedService.durationMin;

  const isContextValid =
    Boolean(specialist) && Boolean(dateKey) && Boolean(hourMinute) && availableMinutes > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!isContextValid || !selectedService || !specialist) {
      setErrorMessage("Brakuje danych terminu. Wróć i wybierz termin ponownie.");
      return;
    }

    if (!canFitService) {
      setErrorMessage(
        `Wybrany termin ma tylko ${availableMinutes} min dostępnego czasu. Ta usługa wymaga ${selectedService.durationMin} min.`
      );
      return;
    }

    if (!formState.termsConsent) {
      setErrorMessage("Zaakceptuj wymaganą zgodę, aby kontynuować.");
      return;
    }

    setIsSubmitting(true);

    try {
      const startIso = slotToIso(dateKey, hourMinute);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId,
          serviceId: selectedService.id,
          startIso,
          fullName: formState.fullName,
          email: formState.email,
          phone: formState.phone,
          termsConsent: formState.termsConsent,
          marketingConsent: formState.marketingConsent
        })
      });

      const rawResponse = await response.text();
      let data: { booking?: Booking; error?: string } = {};
      if (rawResponse) {
        try {
          data = JSON.parse(rawResponse) as { booking?: Booking; error?: string };
        } catch {
          data = { error: "Nieoczekiwana odpowiedź serwera podczas zapisu rezerwacji." };
        }
      }

      if (!response.ok || !data.booking) {
        setErrorMessage(data.error ?? "Nie udało się zapisać rezerwacji.");
        return;
      }

      const booking = data.booking;
      const confirmParams = new URLSearchParams({
        bookingId: booking.id,
        specialistName: specialist.fullName,
        serviceName: selectedService.name,
        dayLabel,
        time: hourMinute,
        email: formState.email
      });
      router.push(`/rezerwacja/potwierdzenie?${confirmParams.toString()}`);
    } catch {
      setErrorMessage("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isContextValid || !specialist) {
    return (
      <main className="page-shell">
        <section className="booking-form-panel">
          <h1>Brak danych rezerwacji</h1>
          <p className="selected-summary">
            Nie udało się odczytać wybranego terminu. Wróć do listy specjalistów i wybierz godzinę ponownie.
          </p>
          <Link className="primary-action link-action" href="/">
            Wróć do kalendarza
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="booking-form-panel">
        <h1>Krok 2: Dane do rezerwacji</h1>
        <p className="selected-summary">
          {specialist.fullName} • {dayLabel} • {hourMinute} • {availableMinutes} min dostępne
        </p>

        <form onSubmit={handleSubmit} className="booking-form">
          <label>
            Usługa
            <select
              required
              value={bookingServiceId}
              onChange={(event) => {
                setBookingServiceId(event.target.value);
                setErrorMessage("");
              }}
            >
              <option value="" disabled>
                Wybierz usługę
              </option>
              {specialistServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.durationMin} min)
                </option>
              ))}
            </select>
          </label>

          {!canFitService && selectedService ? (
            <p className="form-error">
              Wybrany termin ma tylko {availableMinutes} min dostępnego czasu, a usługa "{selectedService.name}"
              wymaga {selectedService.durationMin} min.
            </p>
          ) : null}

          <label>
            Imię i nazwisko
            <input
              required
              type="text"
              value={formState.fullName}
              onChange={(event) => {
                setFormState((current) => ({ ...current, fullName: event.target.value }));
              }}
            />
          </label>

          <label>
            E-mail
            <input
              required
              type="email"
              value={formState.email}
              onChange={(event) => {
                setFormState((current) => ({ ...current, email: event.target.value }));
              }}
            />
          </label>

          <label>
            Telefon
            <input
              required
              type="tel"
              value={formState.phone}
              onChange={(event) => {
                setFormState((current) => ({ ...current, phone: event.target.value }));
              }}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={formState.termsConsent}
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  termsConsent: event.target.checked
                }));
              }}
            />
            Akceptuję regulamin rezerwacji (wymagane)
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={formState.marketingConsent}
              onChange={(event) => {
                setFormState((current) => ({
                  ...current,
                  marketingConsent: event.target.checked
                }));
              }}
            />
            Zgadzam się na okazjonalne informacje (opcjonalnie)
          </label>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <div className="step-actions">
            <Link className="primary-action link-action" href="/">
              Wstecz
            </Link>
            <button
              type="submit"
              className="primary-action"
              disabled={isSubmitting || !bookingServiceId || !canFitService}
            >
              {isSubmitting ? "Zapisywanie..." : "Potwierdź rezerwację"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
