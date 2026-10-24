export interface AvailableSlot {
  time: string;
  startsAt: string;
  userServiceIds: string[];
}

export interface AvailableSlotsResponse {
  date: string;
  slots: AvailableSlot[];
}
