import {
  AppointmentMailData,
  AppointmentCancelledMailData,
  AppointmentRescheduledMailData,
} from '@/mail/interfaces/mail.interface';

const formatDate = (date: Date): string =>
  new Date(date).toLocaleString('pl-PL', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

export const MailTemplates = {
  invitation: (link: string) => ({
    subject: 'Zaproszenie do systemu Rêve',
    html: `
      <h2>Witaj!</h2>
      <p>Zostałeś zaproszony do systemu Rêve.</p>
      <p>Kliknij poniższy link aby ustawić hasło i aktywować konto:</p>
      <a href="${link}">${link}</a>
      <p>Link jest ważny przez 48 godzin.</p>
      <p>Jeśli nie spodziewałeś się tego zaproszenia, zignoruj tę wiadomość.</p>
    `,
  }),

  clientEmailVerification: (link: string) => ({
    subject: 'Potwierdź swój adres email — Rêve',
    html: `
      <h2>Witaj w Rêve!</h2>
      <p>Dziękujemy za rejestrację. Kliknij poniższy link aby potwierdzić swój adres email:</p>
      <a href="${link}">${link}</a>
      <p>Link jest ważny przez 24 godziny.</p>
      <p>Jeśli nie zakładałeś konta w systemie Rêve, zignoruj tę wiadomość.</p>
    `,
  }),

  appointmentCreatedToClient: (data: AppointmentMailData) => ({
    subject: 'Potwierdzenie rezerwacji — Rêve',
    html: `
      <h2>Dziękujemy za rezerwację!</h2>
      <p>Twoja wizyta została przyjęta i oczekuje na potwierdzenie przez salon.</p>
      <table>
        <tr><td><strong>Usługa:</strong></td><td>${data.serviceName}</td></tr>
        <tr><td><strong>Pracownik:</strong></td><td>${data.employeeName}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt)}</td></tr>
        <tr><td><strong>Czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt)}</td></tr>
        <tr><td><strong>Cena:</strong></td><td>${data.price} zł</td></tr>
        ${data.note ? `<tr><td><strong>Notatka:</strong></td><td>${data.note}</td></tr>` : ''}
      </table>
      <p>O potwierdzeniu wizyty poinformujemy Cię osobnym mailem.</p>
    `,
  }),

  appointmentCreatedToEmployee: (data: AppointmentMailData) => ({
    subject: 'Nowa rezerwacja — Rêve',
    html: `
      <h2>Masz nową rezerwację!</h2>
      <table>
        <tr><td><strong>Klient:</strong></td><td>${data.clientName}</td></tr>
        <tr><td><strong>Usługa:</strong></td><td>${data.serviceName}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt)}</td></tr>
        <tr><td><strong>Czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt)}</td></tr>
        <tr><td><strong>Cena:</strong></td><td>${data.price} zł</td></tr>
        ${data.note ? `<tr><td><strong>Notatka klienta:</strong></td><td>${data.note}</td></tr>` : ''}
      </table>
      <p>Zaloguj się do systemu aby potwierdzić lub anulować wizytę.</p>
    `,
  }),

  appointmentConfirmedToClient: (data: AppointmentMailData) => ({
    subject: 'Wizyta potwierdzona — Rêve',
    html: `
      <h2>Twoja wizyta została potwierdzona!</h2>
      <table>
        <tr><td><strong>Usługa:</strong></td><td>${data.serviceName}</td></tr>
        <tr><td><strong>Pracownik:</strong></td><td>${data.employeeName}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt)}</td></tr>
        <tr><td><strong>Czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt)}</td></tr>
        <tr><td><strong>Cena:</strong></td><td>${data.price} zł</td></tr>
      </table>
      <p>Do zobaczenia!</p>
    `,
  }),

  appointmentCancelledToClient: (data: AppointmentCancelledMailData) => ({
    subject: 'Wizyta anulowana — Rêve',
    html: `
      <h2>Wizyta została anulowana</h2>
      <table>
        <tr><td><strong>Usługa:</strong></td><td>${data.serviceName}</td></tr>
        <tr><td><strong>Pracownik:</strong></td><td>${data.employeeName}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt)}</td></tr>
        <tr><td><strong>Anulowano przez:</strong></td><td>${data.cancelledBy === 'client' ? 'Klienta' : 'Salon'}</td></tr>
        ${data.cancellationReason ? `<tr><td><strong>Powód:</strong></td><td>${data.cancellationReason}</td></tr>` : ''}
      </table>
      <p>Jeśli chcesz umówić nową wizytę, zapraszamy na naszą stronę.</p>
    `,
  }),

  appointmentCancelledToEmployee: (data: AppointmentCancelledMailData) => ({
    subject: 'Wizyta anulowana — Rêve',
    html: `
      <h2>Wizyta została anulowana</h2>
      <table>
        <tr><td><strong>Klient:</strong></td><td>${data.clientName}</td></tr>
        <tr><td><strong>Usługa:</strong></td><td>${data.serviceName}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt)}</td></tr>
        <tr><td><strong>Anulowano przez:</strong></td><td>${data.cancelledBy === 'client' ? 'Klienta' : 'Salon'}</td></tr>
        ${data.cancellationReason ? `<tr><td><strong>Powód:</strong></td><td>${data.cancellationReason}</td></tr>` : ''}
      </table>
    `,
  }),

  appointmentRescheduledToClient: (data: AppointmentRescheduledMailData) => ({
    subject: 'Wizyta przełożona — Rêve',
    html: `
      <h2>Twoja wizyta została przełożona</h2>
      <table>
        <tr><td><strong>Usługa:</strong></td><td>${data.serviceName}</td></tr>
        <tr><td><strong>Pracownik:</strong></td><td>${data.employeeName}</td></tr>
        <tr><td><strong>Poprzedni termin:</strong></td><td>${formatDate(data.previousScheduledAt)}</td></tr>
        <tr><td><strong>Nowy termin:</strong></td><td>${formatDate(data.scheduledAt)}</td></tr>
        <tr><td><strong>Nowy czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt)}</td></tr>
        <tr><td><strong>Przełożono przez:</strong></td><td>${data.rescheduledBy === 'client' ? 'Klienta' : 'Salon'}</td></tr>
      </table>
    `,
  }),

  appointmentRescheduledToEmployee: (data: AppointmentRescheduledMailData) => ({
    subject: 'Wizyta przełożona — Rêve',
    html: `
      <h2>Wizyta została przełożona</h2>
      <table>
        <tr><td><strong>Klient:</strong></td><td>${data.clientName}</td></tr>
        <tr><td><strong>Usługa:</strong></td><td>${data.serviceName}</td></tr>
        <tr><td><strong>Poprzedni termin:</strong></td><td>${formatDate(data.previousScheduledAt)}</td></tr>
        <tr><td><strong>Nowy termin:</strong></td><td>${formatDate(data.scheduledAt)}</td></tr>
        <tr><td><strong>Nowy czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt)}</td></tr>
        <tr><td><strong>Przełożono przez:</strong></td><td>${data.rescheduledBy === 'client' ? 'Klienta' : 'Salon'}</td></tr>
      </table>
    `,
  }),
};
