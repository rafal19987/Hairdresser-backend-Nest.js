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
};