import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { zodula } from "@/zodula/client";
import { PackageSearch, Truck, ArrowRight, Calendar, User } from "lucide-react";
import { previewFile } from "@/zodula/ui/components/custom/file-preview";

export default function OrgTrackIdPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{
    delivery_note: Record<string, unknown> | null;
    trips: Record<string, unknown>[];
    installation_notes: Record<string, unknown>[];
    installation_percentage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    zodula
      .get_action("zodula.core.delivery_note_tracking" as Zodula.ActionPath, {
        params: { delivery_note_id: decodeURIComponent(id) },
      })
      .then((res: {
        delivery_note: Record<string, unknown> | null;
        trips: Record<string, unknown>[];
        installation_notes: Record<string, unknown>[];
        installation_percentage: number;
      }) => {
        setData(
          res ?? {
            delivery_note: null,
            trips: [],
            installation_notes: [],
            installation_percentage: 0,
          },
        );
      })
      .catch((e: { message?: string }) => {
        setError(e?.message ?? "Failed to load tracking.");
        setData({
          delivery_note: null,
          trips: [],
          installation_notes: [],
          installation_percentage: 0,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return (
      <div className="auth-page-bg zd:min-h-screen zd:flex zd:items-center zd:justify-center zd:relative">
        <p className="zd:relative zd:z-10 zd:text-muted-foreground">Missing Delivery Note ID.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-page-bg zd:min-h-screen zd:flex zd:items-center zd:justify-center zd:relative">
        <p className="zd:relative zd:z-10 zd:text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !data?.delivery_note) {
    return (
      <div className="auth-page-bg zd:min-h-screen zd:flex zd:items-center zd:justify-center zd:p-4 zd:relative">
        <div className="zd:relative zd:z-10 zd:text-center">
          <p className="zd:text-muted-foreground">{error ?? "Delivery Note not found."}</p>
          <Link to={`/org/track`} className="zd:mt-4 zd:inline-block zd:text-sm zd:text-primary hover:zd:underline">
            ← Try another ID
          </Link>
        </div>
      </div>
    );
  }

  const do_ = data.delivery_note;
  const trips = data.trips || [];
  const installationNotes = data.installation_notes || [];
  const installationPercentage = data.installation_percentage ?? 0;

  return (
    <div className="auth-page-bg zd:min-h-screen zd:flex zd:flex-col zd:items-center zd:px-4 zd:py-8 zd:relative zd:pb-12">
      <div className="zd:relative zd:z-10 zd:w-full zd:max-w-3xl zd:space-y-6">
        {/* Delivery Note header */}
        <div className="zd:rounded-2xl zd:border zd:bg-background/95 zd:shadow-xl zd:shadow-black/10 zd:backdrop-blur-sm zd:p-6 md:zd:p-7">
          <div className="zd:flex zd:flex-col md:zd:flex-row md:zd:items-center md:zd:justify-between zd:gap-3">
            <div className="zd:flex zd:items-center zd:gap-3">
              <div className="zd:inline-flex zd:h-9 zd:w-9 zd:items-center zd:justify-center zd:rounded-xl zd:bg-primary/10">
                <PackageSearch className="zd:w-4 zd:h-4 zd:text-primary" />
              </div>
              <div>
                <h1 className="zd:text-lg md:zd:text-xl zd:font-semibold zd:text-foreground">
                  {do_.id as string}
                </h1>
                {(do_.posting_date as string) && (
                  <p className="zd:text-xs zd:text-muted-foreground">
                    Order date {do_.posting_date as string}
                  </p>
                )}
              </div>
            </div>
            {typeof installationPercentage === "number" && (
              <div className="zd:w-full md:zd:w-56 zd:mt-2 md:zd:mt-0">
                <p className="zd:text-xs zd:font-medium zd:text-muted-foreground zd:mb-1">
                  Installation progress
                </p>
                <div className="zd:h-2.5 zd:w-full zd:rounded-full zd:bg-muted">
                  <div
                    className="zd:h-2.5 zd:rounded-full zd:bg-emerald-500 zd:transition-all"
                    style={{ width: `${Math.max(0, Math.min(installationPercentage, 100))}%` }}
                  />
                </div>
                <div className="zd:mt-1 zd:flex zd:items-center zd:justify-between">
                  {installationPercentage === 100 ? (
                    <span className="zd:inline-flex zd:items-center zd:px-2 zd:py-0.5 zd:rounded-full zd:text-[11px] zd:font-medium zd:bg-emerald-100 zd:text-emerald-800">
                      Completed
                    </span>
                  ) : (
                    <span className="zd:text-xs zd:text-muted-foreground">
                      {installationPercentage.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer history (Delivery Trips) */}
        <h2 className="zd:text-xs zd:font-semibold zd:uppercase zd:tracking-wide zd:text-muted-foreground">
          Transfer history
        </h2>
        {trips.length === 0 ? (
          <div className="zd:rounded-xl zd:border zd:bg-background/95 zd:p-6 zd:text-center zd:text-muted-foreground zd:text-sm">
            No delivery trips yet for this order.
          </div>
        ) : (
          <ul className="zd:space-y-4">
            {trips.map((m, idx) => (
              <li
                key={(m.id as string) ?? idx}
                className="zd:rounded-xl zd:border zd:bg-background/95 zd:shadow zd:p-5 zd:flex zd:flex-col zd:gap-3"
              >
                <div className="zd:flex zd:items-center zd:gap-2">
                  <Truck className="zd:w-4 zd:h-4 zd:text-muted-foreground zd:shrink-0" />
                  <span className="zd:font-medium zd:text-foreground">{m.id as string}</span>
                </div>
                <div className="zd:flex zd:items-center zd:gap-2 zd:text-sm zd:text-muted-foreground zd:flex-wrap">
                  {(m.posting_date as string) && (
                    <span className="zd:flex zd:items-center zd:gap-1">
                      <Calendar className="zd:w-3.5 zd:h-3.5" />
                      {m.posting_date as string}
                      {(m.posting_time as string) && ` ${m.posting_time}`}
                    </span>
                  )}
                  {(m.driver_name as string) && (
                    <span className="zd:flex zd:items-center zd:gap-1">
                      <User className="zd:w-3.5 zd:h-3.5" />
                      {m.driver_name as string}
                    </span>
                  )}
                </div>
                <div className="zd:flex zd:items-center zd:gap-2 zd:text-sm">
                  <span className="zd:truncate zd:max-w-[120px] zd:text-muted-foreground" title={String(m.source_warehouse ?? "")}>
                    {m.source_warehouse as string}
                  </span>
                  <ArrowRight className="zd:w-4 zd:h-4 zd:text-muted-foreground zd:shrink-0" />
                  <span className="zd:truncate zd:max-w-[120px] zd:text-muted-foreground" title={String(m.target_warehouse ?? "")}>
                    {m.target_warehouse as string}
                  </span>
                </div>
                {(m.vehicle_plate as string) && (
                  <p className="zd:text-xs zd:text-muted-foreground">Vehicle: {m.vehicle_plate as string}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Installation notes */}
        <h2 className="zd:text-xs zd:font-semibold zd:uppercase zd:tracking-wide zd:text-muted-foreground zd:mt-6">
          Installation notes
        </h2>
        {installationNotes.length === 0 ? (
          <div className="zd:rounded-xl zd:border zd:bg-background/95 zd:p-6 zd:text-center zd:text-muted-foreground zd:text-sm">
            No installation notes yet for this order.
          </div>
        ) : (
          <ul className="zd:space-y-4">
            {installationNotes.map((n, idx) => (
              <li
                key={(n.id as string) ?? idx}
                className="zd:rounded-xl zd:border zd:bg-background/95 zd:shadow zd:p-5 zd:flex zd:flex-col zd:gap-3"
              >
                <div className="zd:flex zd:items-center zd:gap-2 zd:text-sm zd:text-muted-foreground zd:flex-wrap">
                  {(n.installation_date as string) && (
                    <span className="zd:flex zd:items-center zd:gap-1">
                      <Calendar className="zd:w-3.5 zd:h-3.5" />
                      {n.installation_date as string}
                      {(n.installation_time as string) && ` ${n.installation_time}`}
                    </span>
                  )}
                </div>
                {typeof n.installation_proof === "string" && n.installation_proof && (
                  <div className="zd:mt-2 zd:flex zd:justify-center">
                    <button
                      type="button"
                      className="zd:inline-flex zd:items-center zd:justify-center zd:rounded-lg zd:border zd:bg-muted/40 hover:zd:bg-muted zd:p-1"
                      onClick={() =>
                        previewFile(n.installation_proof as string, {
                          title: "Installation proof",
                        })
                      }
                    >
                      <img
                        src={n.installation_proof as string}
                        alt="Installation proof"
                        className="zd:h-24 zd:w-auto zd:rounded-md zd:object-cover"
                      />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="zd:mt-4 zd:text-sm zd:text-center">
          <Link to={`/org/track`} className="zd:text-muted-foreground hover:zd:text-foreground">
            Track another order
          </Link>
          {" · "}
          <Link to={`/about-us`} className="zd:text-muted-foreground hover:zd:text-foreground">
            About Us
          </Link>
        </p>
      </div>
    </div>
  );
}
