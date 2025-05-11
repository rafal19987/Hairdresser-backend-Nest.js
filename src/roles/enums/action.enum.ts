export enum Action {
  NONE = 'none', // Brak uprwanień
  CREATE = 'create', // Tworzenie
  READ = 'read', // Odczyt
  WRITE = 'write', // Edycja
  DELETE = 'delete', // Usuwanie
  ALL = 'all', // Wszystkie uprawnienia - dla admina
  ADMIN = 'admin', // Uprawienie superadmina
}
