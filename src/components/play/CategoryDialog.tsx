import React from "react";

type CategoryDialogProps = {
  categories: string[];
  selected: string[];
  isAllSelected: boolean;
  onToggle: (category: string) => void;
  onSelectAll: () => void;
  onClose: () => void;
};

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  categories,
  selected,
  isAllSelected,
  onToggle,
  onSelectAll,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Categorias</h2>
            <p className="text-sm text-slate-500">
              Selecione as categorias que deseja revisar agora.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar painel de categorias"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {categories.length ? (
            <ul className="grid sm:grid-cols-2 gap-2">
              {categories.map((cat) => {
                const active = selected.includes(cat);
                return (
                  <li
                    key={cat}
                    className={`rounded-xl border px-3 py-2 transition-colors ${
                      active ? "border-slate-900 bg-slate-900/5" : "bg-white"
                    }`}
                  >
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => onToggle(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-slate-600">
              Nenhuma categoria cadastrada até o momento.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {!isAllSelected ? (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-sm text-slate-500 underline"
            >
              Limpar seleção
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDialog;

