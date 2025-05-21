import { PaginatedResultDto } from '../dto/paginated-result.dto';
import { PaginationParamsDto } from '../dto/pagination-params.dto';

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  paginationParams: PaginationParamsDto,
): PaginatedResultDto<T> {
  const { page, limit } = paginationParams;
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      total,
      count: items.length,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    },
  };
}
