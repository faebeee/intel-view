import type { PaginateQuery } from 'nestjs-paginate';

/**
 * Builds a minimal `PaginateQuery` for use by MCP tools, which don't go
 * through the `@Paginate()` HTTP query decorator. `path` is only used by
 * `nestjs-paginate` to build `links` in the HTTP response envelope, which
 * MCP tool results don't expose, so an empty string is fine here.
 */
export function buildMcpPaginateQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
}): PaginateQuery {
  return {
    path: '',
    page: params.page,
    limit: params.limit,
    search: params.search,
  };
}
