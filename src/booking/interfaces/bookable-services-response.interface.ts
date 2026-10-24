export interface BookableService {
  uuid: string;
  name: string;
  description: string;
  minPrice: number;
  maxPrice: number;
  minDuration: number;
  maxDuration: number;
}
