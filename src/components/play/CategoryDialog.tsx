import React from "react";

type CategoryDialogProps = {
  books: string[];
  selectedBooks: string[];
  isAllBooksSelected: boolean;
  onToggleBook: (book: string) => void;
  onSelectAllBooks: () => void;
  categories: string[];
  selectedCategories: string[];
  isAllCategoriesSelected: boolean;
  onToggleCategory: (category: string) => void;
  onSelectAllCategories: () => void;
  onClose: () => void;
};

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  books,
  selectedBooks,
  isAllBooksSelected,
  onToggleBook,
  onSelectAllBooks,
  categories,
  selectedCategories,
  isAllCategoriesSelected,
  onToggleCategory,
  onSelectAllCategories,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl shadow-slate-300/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Livros e categorias
            </h2>
            <p className="text-sm text-slate-600">
              Selecione os filtros que deseja revisar agora.
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
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                Livros
              </div>
              {books.length ? (
                <ul className="grid sm:grid-cols-2 gap-2">
                  {books.map((book) => {
                    const active = selectedBooks.includes(book);
                    return (
                      <li
                        key={book}
                        className={`rounded-xl border px-3 py-2 transition-colors ${
                          active
                            ? "border-orange-300 bg-orange-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <label className="flex items-center gap-3 text-sm text-slate-900">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => onToggleBook(book)}
                          />
                          <span>{book}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-slate-600">
                  Nenhum livro cadastrado até o momento.
                </div>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                Categorias
              </div>
              {categories.length ? (
                <ul className="grid sm:grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const active = selectedCategories.includes(cat);
                    return (
                      <li
                        key={cat}
                        className={`rounded-xl border px-3 py-2 transition-colors ${
                          active
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <label className="flex items-center gap-3 text-sm text-slate-900">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => onToggleCategory(cat)}
                          />
                          <span>{cat}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-slate-600">
                  Nenhuma categoria cadastrada para os livros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            {!isAllBooksSelected ? (
              <button
                type="button"
                onClick={onSelectAllBooks}
                className="text-sm text-slate-600 underline"
              >
                Limpar livros
              </button>
            ) : null}
            {!isAllCategoriesSelected ? (
              <button
                type="button"
                onClick={onSelectAllCategories}
                className="text-sm text-slate-600 underline"
              >
                Limpar categorias
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-sm font-semibold shadow-md"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDialog;
