import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { SearchBar } from "../components/ui/SearchBar";

export function NotFound() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  return (
    <div className="container-page flex flex-col items-center py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-primary-tint text-forest">
        <Compass className="size-6" strokeWidth={1.5} />
      </span>
      <p className="eyebrow mt-4">Page not found</p>
      <h1 className="mt-2 max-w-lg text-[20px] font-semibold leading-7 text-ink sm:text-[28px] sm:leading-9">
        This aisle does not exist
      </h1>
      <p className="mt-2 max-w-sm text-[14px] leading-5 text-ink-soft">
        The page may have moved. Search for what you need, or head back to the store.
      </p>
      <div className="mt-5 w-full max-w-md">
        <SearchBar
          value={term}
          onChange={setTerm}
          onSubmit={(value) => navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search")}
        />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
        <Link to="/shop" className="btn btn-secondary">
          Browse products
        </Link>
      </div>
    </div>
  );
}
