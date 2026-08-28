export const PAGE_SIZE = 10;

export function pageCount(total: number, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(Math.max(total, 0) / size));
}

export function pageNumbers(total: number, size = PAGE_SIZE): number[] {
  return Array.from({ length: pageCount(total, size) }, (_, i) => i + 1);
}

export function clampPage(page: number, total: number, size = PAGE_SIZE): number {
  return Math.min(Math.max(page, 1), pageCount(total, size));
}

export function pageSlice<T>(items: T[], page: number, size = PAGE_SIZE): T[] {
  const current = clampPage(page, items.length, size);
  const start = (current - 1) * size;
  return items.slice(start, start + size);
}

export function pageRange(total: number, page: number, size = PAGE_SIZE): { from: number; to: number } {
  if (!total) {
    return { from: 0, to: 0 };
  }
  const current = clampPage(page, total, size);
  const from = (current - 1) * size + 1;
  const to = Math.min(current * size, total);
  return { from, to };
}
