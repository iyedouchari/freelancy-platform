const CategorySelector = ({ categories, selected, onChange }) => {
  const toggle = (category) => {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else {
      onChange([...selected, category]);
    }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">Choisissez vos catégories</p>
        <button
          onClick={() => onChange([])}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          Réinitialiser
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = selected.includes(category);
          return (
            <button
              key={category}
              onClick={() => toggle(category)}
              className={`px-4 py-2 rounded-full text-base font-medium border transition ${
                active
                  ? "bg-primary-600 text-white border-primary-600 shadow-glow"
                  : "bg-white text-slate-700 border-slate-200 hover:border-primary-200"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;
