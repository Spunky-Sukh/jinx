/** A single page of server-side paginated results plus the total match count. */
export interface Paged<T> {
  rows: T[];
  count: number;
}

/** Default rows per page — fits the 3-column card grids (4 rows). */
export const PAGE_SIZE = 12;
