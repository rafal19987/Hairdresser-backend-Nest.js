// owner: own calendar, shared: shared with the user, all: visible through the `all` calendar action
export type CalendarAccess = 'owner' | 'shared' | 'all';

export interface VisibleCalendar {
  uuid: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  access: CalendarAccess;
  permission: string;
  owner: {
    uuid: string;
    firstName: string;
    lastName: string;
  };
}
