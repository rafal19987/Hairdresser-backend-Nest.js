import { MailTemplates } from './mail-templates';

const mailData = {
  clientName: 'Jan Kowalski',
  employeeName: 'Anna Nowak',
  serviceName: 'Strzyżenie',
  scheduledAt: new Date('2026-11-02T10:00:00.000Z'),
  scheduledEndAt: new Date('2026-11-02T11:00:00.000Z'),
  price: 120,
};

describe('MailTemplates', () => {
  it('formats dates in salon time zone', () => {
    const { html } = MailTemplates.appointmentCreatedToClient(mailData);

    expect(html).toContain('11:00');
    expect(html).toContain('12:00');
    expect(html).not.toContain('10:00');
  });

  it('formats summer dates with daylight saving time', () => {
    const { html } = MailTemplates.appointmentCreatedToClient({
      ...mailData,
      scheduledAt: new Date('2026-07-01T10:00:00.000Z'),
      scheduledEndAt: new Date('2026-07-01T11:00:00.000Z'),
    });

    expect(html).toContain('12:00');
    expect(html).toContain('13:00');
  });

  it('includes reschedule reason when provided', () => {
    const { html } = MailTemplates.appointmentRescheduledToClient({
      ...mailData,
      previousScheduledAt: new Date('2026-11-01T10:00:00.000Z'),
      previousScheduledEndAt: new Date('2026-11-01T11:00:00.000Z'),
      rescheduledBy: 'staff',
      rescheduleReason: 'Choroba pracownika',
    });

    expect(html).toContain('Choroba pracownika');
  });

  it('omits reschedule reason row when not provided', () => {
    const { html } = MailTemplates.appointmentRescheduledToEmployee({
      ...mailData,
      previousScheduledAt: new Date('2026-11-01T10:00:00.000Z'),
      previousScheduledEndAt: new Date('2026-11-01T11:00:00.000Z'),
      rescheduledBy: 'client',
    });

    expect(html).not.toContain('Powód');
  });

  it('escapes user-provided values', () => {
    const { html } = MailTemplates.appointmentCreatedToEmployee({
      ...mailData,
      clientName: '<b>Jan</b>',
      note: '<a href="https://evil.example">Kliknij</a>',
    });

    expect(html).not.toContain('<a href');
    expect(html).not.toContain('<b>Jan</b>');
    expect(html).toContain('&lt;b&gt;Jan&lt;&#x2F;b&gt;');
    expect(html).toContain(
      '&lt;a href=&quot;https:&#x2F;&#x2F;evil.example&quot;&gt;',
    );
  });

  it('escapes reasons in cancellation mail', () => {
    const { html } = MailTemplates.appointmentCancelledToClient({
      ...mailData,
      cancelledBy: 'staff',
      cancellationReason: '<script>alert(1)</script>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
