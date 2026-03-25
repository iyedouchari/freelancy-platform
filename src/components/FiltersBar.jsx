const FiltersBar = ({
  budgetOptions,
  sortOptions,
  typeOptions = [],
  budgetValue,
  sortValue,
  typeValue,
  onBudgetChange,
  onSortChange,
  onTypeChange,
}) => {
  const gridCols = typeOptions.length ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <div className={`glass-card p-5 grid gap-4 ${gridCols} text-base`}>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-slate-500">Filtrer par budget</label>
        <select
          value={budgetValue}
          onChange={(e) => onBudgetChange(e.target.value)}
          className="input"
        >
          {budgetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {typeOptions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-slate-500">Type de projet</label>
          <select
            value={typeValue}
            onChange={(e) => onTypeChange(e.target.value)}
            className="input"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-slate-500">Trier par</label>
        <select value={sortValue} onChange={(e) => onSortChange(e.target.value)} className="input">
          {sortOptions.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FiltersBar;
