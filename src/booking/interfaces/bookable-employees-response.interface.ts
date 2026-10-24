export interface BookableEmployee {
  userServiceId: string;
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  price: number;
  duration: number;
}

export interface BookableEmployeesResponse {
  serviceId: string;
  employees: BookableEmployee[];
}
