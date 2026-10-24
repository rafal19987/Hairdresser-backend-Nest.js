import { MailTemplates } from './mail-templates';
import { MailBranding } from '@/mail/interfaces/mail.interface';

const mailData = {
  clientName: 'Jan Kowalski',
  employeeName: 'Anna Nowak',
  serviceName: 'Strzyżenie',
  scheduledAt: new Date('2026-11-02T10:00:00.000Z'),
  scheduledEndAt: new Date('2026-11-02T11:00:00.000Z'),
  price: 120,
};

const branding: MailBranding = {
  salonName: 'Rêve',
  timeZone: 'Europe/Warsaw',
  email: 'kontakt@reve.pl',
  phone: '+48 600 000 000',
};

describe('MailTemplates', () => {
  it('formats dates in salon time zone', () => {
    const { html } = MailTemplates.appointmentCreatedToClient(
      mailData,
      branding,
    );

    expect(html).toContain('11:00');
    expect(html).toContain('12:00');
    expect(html).not.toContain('10:00');
  });

  it('formats summer dates with daylight saving time', () => {
    const { html } = MailTemplates.appointmentCreatedToClient(
      {
        ...mailData,
        scheduledAt: new Date('2026-07-01T10:00:00.000Z'),
        scheduledEndAt: new Date('2026-07-01T11:00:00.000Z'),
      },
      branding,
    );

    expect(html).toContain('12:00');
    expect(html).toContain('13:00');
  });

  it('uses time zone from salon settings', () => {
    const { html } = MailTemplates.appointmentCreatedToClient(mailData, {
      ...branding,
      timeZone: 'Europe/London',
    });

    expect(html).toContain('10:00');
    expect(html).not.toContain('12:00');
  });

  it('uses salon name in subject and content', () => {
    const template = MailTemplates.clientEmailVerification(
      'https://app.example/verify/token',
      { ...branding, salonName: 'Studio Fryzur' },
    );

    expect(template.subject).toBe('Potwierdź swój adres email — Studio Fryzur');
    expect(template.html).toContain('Witaj w Studio Fryzur!');
    expect(template.html).not.toContain('Rêve');
  });

  it('adds salon contact to client mails', () => {
    const { html } = MailTemplates.appointmentConfirmedToClient(
      mailData,
      branding,
    );

    expect(html).toContain('+48 600 000 000 · kontakt@reve.pl');
  });

  it('omits missing contact details', () => {
    const { html } = MailTemplates.appointmentConfirmedToClient(mailData, {
      ...branding,
      email: null,
      phone: null,
    });

    expect(html).toContain('<strong>Rêve</strong></p>');
  });

  it('includes reschedule reason when provided', () => {
    const { html } = MailTemplates.appointmentRescheduledToClient(
      {
        ...mailData,
        previousScheduledAt: new Date('2026-11-01T10:00:00.000Z'),
        previousScheduledEndAt: new Date('2026-11-01T11:00:00.000Z'),
        rescheduledBy: 'staff',
        rescheduleReason: 'Choroba pracownika',
      },
      branding,
    );

    expect(html).toContain('Choroba pracownika');
  });

  it('omits reschedule reason row when not provided', () => {
    const { html } = MailTemplates.appointmentRescheduledToEmployee(
      {
        ...mailData,
        previousScheduledAt: new Date('2026-11-01T10:00:00.000Z'),
        previousScheduledEndAt: new Date('2026-11-01T11:00:00.000Z'),
        rescheduledBy: 'client',
      },
      branding,
    );

    expect(html).not.toContain('Powód');
  });

  it('escapes user-provided values', () => {
    const { html } = MailTemplates.appointmentCreatedToEmployee(
      {
        ...mailData,
        clientName: '<b>Jan</b>',
        note: '<a href="https://evil.example">Kliknij</a>',
      },
      branding,
    );

    expect(html).not.toContain('<a href');
    expect(html).not.toContain('<b>Jan</b>');
    expect(html).toContain('&lt;b&gt;Jan&lt;&#x2F;b&gt;');
    expect(html).toContain(
      '&lt;a href=&quot;https:&#x2F;&#x2F;evil.example&quot;&gt;',
    );
  });

  it('escapes reasons in cancellation mail', () => {
    const { html } = MailTemplates.appointmentCancelledToClient(
      {
        ...mailData,
        cancelledBy: 'staff',
        cancellationReason: '<script>alert(1)</script>',
      },
      branding,
    );

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes salon name in content', () => {
    const { html } = MailTemplates.appointmentConfirmedToClient(mailData, {
      ...branding,
      salonName: '<i>Salon</i>',
    });

    expect(html).not.toContain('<i>Salon</i>');
  });
});
