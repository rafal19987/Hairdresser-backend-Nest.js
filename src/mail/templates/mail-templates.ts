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
};
