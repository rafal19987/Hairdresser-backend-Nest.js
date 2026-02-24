export enum AppointmentStatus {
  PENDING = 'pending', // oczekuje na potwierdzenie
  CONFIRMED = 'confirmed', // potwierdzone przez salon
  RESCHEDULED = 'rescheduled', // ponowne zaplanowanie
  CANCELLED = 'cancelled', // anulowane
  COMPLETED = 'completed', // zakończone
}
