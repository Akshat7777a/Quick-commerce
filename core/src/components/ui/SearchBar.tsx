import { Search, X } from "lucide-react";
import type { FormEvent } from "react";

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search for atta, rice, soap",
  label = "Search products",
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form role="search" onSubmit={submit} className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        enterKeyHint="search"
        className="input h-12 pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-[var(--lm-radius-control)] text-ink-soft transition hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
