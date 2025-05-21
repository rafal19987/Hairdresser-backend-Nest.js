export class PaginatedResultDto<T> {
  items: T[];
  pagination: {
    total: number;
    count: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
