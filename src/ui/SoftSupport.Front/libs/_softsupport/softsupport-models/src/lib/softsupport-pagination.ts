export function paginationTotalPages(totalCount: number, pageSize: number): number {
  if (pageSize < 1) {
    return 1;
  }
  return Math.max(1, Math.ceil(totalCount / pageSize) || 1);
}

export function paginationRange(page: number, pageSize: number, totalCount: number): { from: number; to: number } {
  if (totalCount === 0) {
    return { from: 0, to: 0 };
  }
  return {
    from: (page - 1) * pageSize + 1,
    to: Math.min(page * pageSize, totalCount),
  };
}

export function paginationPageNumbers(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: (number | '...')[] = [1];
  if (page > 3) {
    pages.push('...');
  }
  for (let index = Math.max(2, page - 1); index <= Math.min(totalPages - 1, page + 1); index++) {
    pages.push(index);
  }
  if (page < totalPages - 2) {
    pages.push('...');
  }
  pages.push(totalPages);
  return pages;
}
