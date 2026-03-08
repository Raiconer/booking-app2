"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("bookingId") ?? "";
  const specialistName = searchParams.get("specialistName") ?? "";
  const serviceName = searchParams.get("serviceName") ?? "";
  const dayLabel = searchParams.get("dayLabel") ?? "";
  const time = searchParams.get("time") ?? "";
  const email = searchParams.get("email") ?? "";

  const isValid = Boolean(bookingId && specialistName && serviceName && dayLabel && time);

  if (!isValid) {
    return (
      <main className="page-shell">
        <section className="booking-form-panel">
          <h1>Brak danych potwierdzenia</h1>
          <p className="selected-summary">
            Nie udało się odczytać danych rezerwacji. Sprawdź kalendarz lub spróbuj ponownie.
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
        <h1>Krok 3: Potwierdzenie</h1>
        <p className="form-success">Rezerwacja została zapisana pomyślnie.</p>

        <div className="booking-summary-grid">
          <p><strong>Numer rezerwacji:</strong> {bookingId}</p>
          <p><strong>Specjalista:</strong> {specialistName}</p>
          <p><strong>Usługa:</strong> {serviceName}</p>
          <p><strong>Termin:</strong> {dayLabel}, godz. {time}</p>
          <p><strong>Kontakt e-mail:</strong> {email || "-"}</p>
        </div>

        <div className="step-actions">
          <Link className="primary-action link-action" href="/">
            Wróć do kalendarza
          </Link>
        </div>
      </section>
    </main>
  );
}
