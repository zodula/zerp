import { useParams } from "react-router";
import { useState, useCallback } from "react";
import { Link, useRouter } from "@/zodula/ui/components/router";
import { PackageSearch } from "lucide-react";

export default function OrgTrackPage() {
  const router = useRouter()
  const [id, setId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = id.trim();
      if (!trimmed) {
        setError("Enter a Delivery Note ID.");
        return;
      }
      setError(null);
      router.push(`/track/${encodeURIComponent(trimmed)}`);
    },
    [id]
  );

  return (
    <div className="auth-page-bg zd:min-h-screen zd:flex zd:items-center zd:justify-center zd:px-4 zd:py-10 zd:relative">
      <div className="zd:relative zd:z-10 zd:w-full zd:max-w-lg zd:rounded-2xl zd:border zd:bg-background/95 zd:shadow-xl zd:shadow-black/10 zd:backdrop-blur-sm zd:px-8 zd:py-7">
        <div className="zd:flex zd:flex-col zd:items-start zd:gap-2 zd:mb-6">
          <div className="zd:inline-flex zd:h-10 zd:w-10 zd:items-center zd:justify-center zd:rounded-xl zd:bg-primary/10">
            <PackageSearch className="zd:w-5 zd:h-5 zd:text-primary" />
          </div>
          <div>
            <h1 className="zd:text-2xl zd:font-semibold zd:text-foreground">Track delivery</h1>
            <p className="zd:mt-1 zd:text-sm zd:text-muted-foreground">
              Enter your Delivery Note ID to see its trip history and installation progress.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="zd:space-y-4">
          <div>
            <label htmlFor="do-id" className="zd:block zd:text-sm zd:font-medium zd:text-foreground zd:mb-1.5">
              Delivery Note ID
            </label>
            <input
              id="do-id"
              type="text"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setError(null);
              }}
              placeholder="e.g. DO-0001"
              className="zd:w-full zd:px-3 zd:py-2.5 zd:rounded-lg zd:border zd:bg-background zd:text-foreground zd:placeholder:text-muted-foreground focus:zd:outline-none focus:zd:ring-2 focus:zd:ring-ring"
            />
            {error && <p className="zd:mt-1.5 zd:text-sm zd:text-destructive">{error}</p>}
          </div>
          <button
            type="submit"
            className="zd:w-full zd:py-2.5 zd:px-4 zd:rounded-lg zd:text-sm zd:font-medium zd:bg-primary zd:text-primary-foreground hover:zd:opacity-90 zd:transition-opacity"
          >
            Track delivery
          </button>
        </form>
        <p className="zd:mt-6 zd:text-sm zd:text-center">
          <Link to={`/about-us`} className="zd:text-muted-foreground hover:zd:text-foreground">
            ← About Us
          </Link>
        </p>
      </div>
    </div>
  );
}
