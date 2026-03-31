export const getPagination = ({ page = 1, pageSize = 10 } = {}) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safePageSize = Math.min(Math.max(Number.parseInt(pageSize, 10) || 10, 1), 100);

  return {
    page: safePage,
    pageSize: safePageSize,
    offset: (safePage - 1) * safePageSize,
    limit: safePageSize,
  };
};

export const paginate = (rows = [], total = 0, page = 1, limit = 10) => {
  const { page: safePage, pageSize } = getPagination({ page, pageSize: limit });
  const safeTotal = Number.parseInt(total, 10) || 0;

  return {
    data: rows,
    pagination: {
      total: safeTotal,
      page: safePage,
      limit: pageSize,
      totalPages: Math.max(Math.ceil(safeTotal / pageSize), 1),
    },
  };
};

