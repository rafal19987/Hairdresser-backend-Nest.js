import { Resource } from '@/roles/enums/resource.enum';
import { Action } from '@/roles/enums/action.enum';
import { PermissionDto } from '@/roles/entities/role.entity';

export const DEMO_EMPLOYEE_PASSWORD = 'Pracownik1234!';
export const DEMO_CLIENT_PASSWORD = 'Klient1234!';
export const DEMO_DAYS_BACK = 14;
export const DEMO_DAYS_AHEAD = 14;

export const DEMO_EMPLOYEE_ROLE = {
  name: 'employee',
  displayName: 'Fryzjer',
  permissions: [
    {
      resource: Resource.CALENDAR,
      actions: [Action.CREATE, Action.READ, Action.WRITE],
    },
    { resource: Resource.CLIENTS, actions: [Action.READ] },
    { resource: Resource.SERVICES, actions: [Action.READ] },
    { resource: Resource.SETTINGS, actions: [Action.READ] },
  ] as PermissionDto[],
};

// `all` on calendar lets reception see every employee's calendar
export const DEMO_RECEPTION_ROLE = {
  name: 'reception',
  displayName: 'Recepcja',
  permissions: [
    {
      resource: Resource.CALENDAR,
      actions: [Action.CREATE, Action.READ, Action.WRITE, Action.ALL],
    },
    { resource: Resource.CLIENTS, actions: [Action.READ, Action.WRITE] },
    { resource: Resource.SERVICES, actions: [Action.READ] },
    { resource: Resource.SETTINGS, actions: [Action.READ] },
  ] as PermissionDto[],
};

export const DEMO_RECEPTION_USER = {
  email: 'recepcja@demo.hairdresser.pl',
  firstName: 'Monika',
  lastName: 'Recepcja',
};

// Shows a calendar shared between employees: owner email -> shared with email
export const DEMO_CALENDAR_SHARE = {
  ownerEmail: 'anna.nowak@demo.hairdresser.pl',
  sharedWithEmail: 'tomasz.wisniewski@demo.hairdresser.pl',
  permission: 'read',
};

export const DEMO_SERVICES = {
  womenCut: {
    name: 'Strzyżenie damskie',
    description: 'Mycie, strzyżenie i modelowanie',
  },
  menCut: {
    name: 'Strzyżenie męskie',
    description: 'Strzyżenie maszynką i nożyczkami',
  },
  coloring: { name: 'Koloryzacja', description: 'Farbowanie całych włosów' },
  styling: { name: 'Modelowanie', description: 'Mycie i modelowanie szczotką' },
  beard: {
    name: 'Strzyżenie brody',
    description: 'Trymowanie i konturowanie brody',
  },
  keratin: {
    name: 'Keratynowe prostowanie',
    description: 'Zabieg wygładzający z keratyną',
  },
};

export type DemoServiceKey = keyof typeof DEMO_SERVICES;

export interface DemoEmployee {
  email: string;
  firstName: string;
  lastName: string;
  calendarColor: string;
  // Fixed local start times (minutes from midnight), spaced so services never overlap
  dailyStarts: number[];
  offers: { service: DemoServiceKey; price: number; duration: number }[];
}

export const DEMO_EMPLOYEES: DemoEmployee[] = [
  {
    email: 'anna.nowak@demo.hairdresser.pl',
    firstName: 'Anna',
    lastName: 'Nowak',
    calendarColor: '#E91E63',
    dailyStarts: [9 * 60, 11 * 60, 14 * 60],
    offers: [
      { service: 'womenCut', price: 120, duration: 60 },
      { service: 'coloring', price: 280, duration: 120 },
      { service: 'styling', price: 90, duration: 45 },
      { service: 'keratin', price: 350, duration: 120 },
    ],
  },
  {
    email: 'tomasz.wisniewski@demo.hairdresser.pl',
    firstName: 'Tomasz',
    lastName: 'Wiśniewski',
    calendarColor: '#2196F3',
    dailyStarts: [10 * 60, 13 * 60, 15 * 60 + 30],
    offers: [
      { service: 'menCut', price: 70, duration: 30 },
      { service: 'beard', price: 50, duration: 30 },
      { service: 'womenCut', price: 110, duration: 60 },
    ],
  },
  {
    email: 'katarzyna.zielinska@demo.hairdresser.pl',
    firstName: 'Katarzyna',
    lastName: 'Zielińska',
    calendarColor: '#4CAF50',
    dailyStarts: [9 * 60 + 30, 12 * 60, 16 * 60],
    offers: [
      { service: 'womenCut', price: 130, duration: 60 },
      { service: 'coloring', price: 300, duration: 120 },
      { service: 'styling', price: 100, duration: 45 },
      { service: 'keratin', price: 380, duration: 120 },
    ],
  },
];

export const DEMO_CLIENTS = [
  {
    email: 'ewa.kowalska@example.com',
    firstName: 'Ewa',
    lastName: 'Kowalska',
    phone: '+48 501 111 222',
  },
  {
    email: 'marek.lis@example.com',
    firstName: 'Marek',
    lastName: 'Lis',
    phone: '+48 502 333 444',
  },
];

export const DEMO_GUESTS = [
  {
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48 600 100 200',
  },
  {
    name: 'Maria Lewandowska',
    email: 'maria.lewandowska@example.com',
    phone: null,
  },
  {
    name: 'Piotr Wójcik',
    email: 'piotr.wojcik@example.com',
    phone: '+48 600 300 400',
  },
  {
    name: 'Agnieszka Kamińska',
    email: 'agnieszka.kaminska@example.com',
    phone: '+48 600 500 600',
  },
  {
    name: 'Michał Kaczmarek',
    email: 'michal.kaczmarek@example.com',
    phone: null,
  },
];

export const DEMO_INTERNAL_EVENTS = [
  {
    employee: 0,
    dayOffset: 3,
    start: 18 * 60,
    end: 19 * 60,
    name: 'Szkolenie z koloryzacji',
  },
  {
    employee: 1,
    dayOffset: 5,
    start: 7 * 60,
    end: 8 * 60,
    name: 'Inwentaryzacja',
  },
  {
    employee: 2,
    dayOffset: 2,
    start: 13 * 60,
    end: 13 * 60 + 30,
    name: 'Przerwa',
  },
];
