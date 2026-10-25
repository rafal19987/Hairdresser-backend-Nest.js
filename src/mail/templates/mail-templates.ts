import {
  AppointmentMailData,
  AppointmentCancelledMailData,
  AppointmentRescheduledMailData,
  MailBranding,
} from '@/mail/interfaces/mail.interface';
import { escape as escapeHtml } from 'validator';

const formatDate = (date: Date, timeZone: string): string =>
  new Date(date).toLocaleString('pl-PL', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  });

const footer = ({ salonName, email, phone }: MailBranding): string => {
  const contact = [phone, email].filter(Boolean).map(escapeHtml).join(' · ');

  return `
      <hr />
      <p><strong>${escapeHtml(salonName)}</strong>${contact ? `<br />${contact}` : ''}</p>
    `;
};

const manageLinks = ({ manageUrl, accountUrl }: AppointmentMailData): string =>
  [
    manageUrl &&
      `<p><a href="${escapeHtml(manageUrl)}">Zarządzaj swoimi wizytami</a> — tutaj sprawdzisz, przełożysz lub anulujesz wizytę.</p>`,
    accountUrl &&
      `<p><a href="${escapeHtml(accountUrl)}">Przejdź do swojego konta</a></p>`,
  ]
    .filter(Boolean)
    .join('');

export const MailTemplates = {
  bookingManageLink: (manageUrl: string, branding: MailBranding) => ({
    subject: `Twoje wizyty — ${branding.salonName}`,
    html: `
      <h2>Twoje wizyty</h2>
      <p>Poniższy link prowadzi do strony z Twoimi wizytami. Możesz tam sprawdzić historię oraz przełożyć lub anulować nadchodzące wizyty.</p>
      <p><a href="${escapeHtml(manageUrl)}">Zobacz swoje wizyty</a></p>
      <p>Jeśli nie prosiłeś o ten link, zignoruj tę wiadomość.</p>
      ${footer(branding)}
    `,
  }),

  invitation: (link: string, branding: MailBranding) => ({
    subject: `Zaproszenie do systemu ${branding.salonName}`,
    html: `
      <h2>Witaj!</h2>
      <p>Zostałeś zaproszony do systemu ${escapeHtml(branding.salonName)}.</p>
      <p>Kliknij poniższy link aby ustawić hasło i aktywować konto:</p>
      <a href="${escapeHtml(link)}">${escapeHtml(link)}</a>
      <p>Link jest ważny przez 48 godzin.</p>
      <p>Jeśli nie spodziewałeś się tego zaproszenia, zignoruj tę wiadomość.</p>
      ${footer(branding)}
    `,
  }),

  clientEmailVerification: (link: string, branding: MailBranding) => ({
    subject: `Potwierdź swój adres email — ${branding.salonName}`,
    html: `
      <h2>Witaj w ${escapeHtml(branding.salonName)}!</h2>
      <p>Dziękujemy za rejestrację. Kliknij poniższy link aby potwierdzić swój adres email:</p>
      <a href="${escapeHtml(link)}">${escapeHtml(link)}</a>
      <p>Link jest ważny przez 24 godziny.</p>
      <p>Jeśli nie zakładałeś konta w systemie ${escapeHtml(branding.salonName)}, zignoruj tę wiadomość.</p>
      ${footer(branding)}
    `,
  }),

  clientPasswordReset: (link: string, branding: MailBranding) => ({
    subject: `Zmiana hasła — ${branding.salonName}`,
    html: `
      <h2>Zmiana hasła</h2>
      <p>Otrzymaliśmy prośbę o zmianę hasła do Twojego konta w ${escapeHtml(branding.salonName)}. Kliknij poniższy link, aby ustawić nowe hasło:</p>
      <a href="${escapeHtml(link)}">${escapeHtml(link)}</a>
      <p>Link jest ważny przez 60 minut. Po zmianie hasła zostaniesz wylogowany na wszystkich urządzeniach.</p>
      <p>Jeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość — obecne hasło pozostanie bez zmian.</p>
      ${footer(branding)}
    `,
  }),

  appointmentCreatedToClient: (
    data: AppointmentMailData,
    branding: MailBranding,
  ) => ({
    subject: `Potwierdzenie rezerwacji — ${branding.salonName}`,
    html: `
      <h2>Dziękujemy za rezerwację!</h2>
      <p>Twoja wizyta została przyjęta i oczekuje na potwierdzenie przez salon.</p>
      <table>
        <tr><td><strong>Usługa:</strong></td><td>${escapeHtml(data.serviceName)}</td></tr>
        <tr><td><strong>Pracownik:</strong></td><td>${escapeHtml(data.employeeName)}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Cena:</strong></td><td>${data.price} zł</td></tr>
        ${data.note ? `<tr><td><strong>Notatka:</strong></td><td>${escapeHtml(data.note)}</td></tr>` : ''}
      </table>
      <p>O potwierdzeniu wizyty poinformujemy Cię osobnym mailem.</p>
      ${manageLinks(data)}
      ${footer(branding)}
    `,
  }),

  appointmentCreatedToEmployee: (
    data: AppointmentMailData,
    branding: MailBranding,
  ) => ({
    subject: `Nowa rezerwacja — ${branding.salonName}`,
    html: `
      <h2>Masz nową rezerwację!</h2>
      <table>
        <tr><td><strong>Klient:</strong></td><td>${escapeHtml(data.clientName)}</td></tr>
        <tr><td><strong>Usługa:</strong></td><td>${escapeHtml(data.serviceName)}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Cena:</strong></td><td>${data.price} zł</td></tr>
        ${data.note ? `<tr><td><strong>Notatka klienta:</strong></td><td>${escapeHtml(data.note)}</td></tr>` : ''}
      </table>
      <p>Zaloguj się do systemu aby potwierdzić lub anulować wizytę.</p>
    `,
  }),

  appointmentConfirmedToClient: (
    data: AppointmentMailData,
    branding: MailBranding,
  ) => ({
    subject: `Wizyta potwierdzona — ${branding.salonName}`,
    html: `
      <h2>Twoja wizyta została potwierdzona!</h2>
      <table>
        <tr><td><strong>Usługa:</strong></td><td>${escapeHtml(data.serviceName)}</td></tr>
        <tr><td><strong>Pracownik:</strong></td><td>${escapeHtml(data.employeeName)}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Cena:</strong></td><td>${data.price} zł</td></tr>
      </table>
      <p>Do zobaczenia!</p>
      ${manageLinks(data)}
      ${footer(branding)}
    `,
  }),

  appointmentCancelledToClient: (
    data: AppointmentCancelledMailData,
    branding: MailBranding,
  ) => ({
    subject: `Wizyta anulowana — ${branding.salonName}`,
    html: `
      <h2>Wizyta została anulowana</h2>
      <table>
        <tr><td><strong>Usługa:</strong></td><td>${escapeHtml(data.serviceName)}</td></tr>
        <tr><td><strong>Pracownik:</strong></td><td>${escapeHtml(data.employeeName)}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Anulowano przez:</strong></td><td>${data.cancelledBy === 'client' ? 'Klienta' : 'Salon'}</td></tr>
        ${data.cancellationReason ? `<tr><td><strong>Powód:</strong></td><td>${escapeHtml(data.cancellationReason)}</td></tr>` : ''}
      </table>
      <p>Jeśli chcesz umówić nową wizytę, zapraszamy na naszą stronę.</p>
      ${manageLinks(data)}
      ${footer(branding)}
    `,
  }),

  appointmentCancelledToEmployee: (
    data: AppointmentCancelledMailData,
    branding: MailBranding,
  ) => ({
    subject: `Wizyta anulowana — ${branding.salonName}`,
    html: `
      <h2>Wizyta została anulowana</h2>
      <table>
        <tr><td><strong>Klient:</strong></td><td>${escapeHtml(data.clientName)}</td></tr>
        <tr><td><strong>Usługa:</strong></td><td>${escapeHtml(data.serviceName)}</td></tr>
        <tr><td><strong>Data:</strong></td><td>${formatDate(data.scheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Anulowano przez:</strong></td><td>${data.cancelledBy === 'client' ? 'Klienta' : 'Salon'}</td></tr>
        ${data.cancellationReason ? `<tr><td><strong>Powód:</strong></td><td>${escapeHtml(data.cancellationReason)}</td></tr>` : ''}
      </table>
    `,
  }),

  appointmentRescheduledToClient: (
    data: AppointmentRescheduledMailData,
    branding: MailBranding,
  ) => ({
    subject: `Wizyta przełożona — ${branding.salonName}`,
    html: `
      <h2>Twoja wizyta została przełożona</h2>
      <table>
        <tr><td><strong>Usługa:</strong></td><td>${escapeHtml(data.serviceName)}</td></tr>
        <tr><td><strong>Pracownik:</strong></td><td>${escapeHtml(data.employeeName)}</td></tr>
        <tr><td><strong>Poprzedni termin:</strong></td><td>${formatDate(data.previousScheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Nowy termin:</strong></td><td>${formatDate(data.scheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Nowy czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Przełożono przez:</strong></td><td>${data.rescheduledBy === 'client' ? 'Klienta' : 'Salon'}</td></tr>
        ${data.rescheduleReason ? `<tr><td><strong>Powód:</strong></td><td>${escapeHtml(data.rescheduleReason)}</td></tr>` : ''}
      </table>
      ${manageLinks(data)}
      ${footer(branding)}
    `,
  }),

  appointmentRescheduledToEmployee: (
    data: AppointmentRescheduledMailData,
    branding: MailBranding,
  ) => ({
    subject: `Wizyta przełożona — ${branding.salonName}`,
    html: `
      <h2>Wizyta została przełożona</h2>
      <table>
        <tr><td><strong>Klient:</strong></td><td>${escapeHtml(data.clientName)}</td></tr>
        <tr><td><strong>Usługa:</strong></td><td>${escapeHtml(data.serviceName)}</td></tr>
        <tr><td><strong>Poprzedni termin:</strong></td><td>${formatDate(data.previousScheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Nowy termin:</strong></td><td>${formatDate(data.scheduledAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Nowy czas zakończenia:</strong></td><td>${formatDate(data.scheduledEndAt, branding.timeZone)}</td></tr>
        <tr><td><strong>Przełożono przez:</strong></td><td>${data.rescheduledBy === 'client' ? 'Klienta' : 'Salon'}</td></tr>
        ${data.rescheduleReason ? `<tr><td><strong>Powód:</strong></td><td>${escapeHtml(data.rescheduleReason)}</td></tr>` : ''}
      </table>
    `,
  }),
};
