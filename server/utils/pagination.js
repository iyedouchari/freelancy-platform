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

