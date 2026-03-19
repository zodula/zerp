import { useParams } from "react-router";
import { useState, useEffect } from "react";
import { zodula } from "@/zodula/client";
import { Link } from "@/zodula/ui/components/router";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  PackageSearch,
} from "lucide-react";

const SOCIAL_FIELDS: { key: string; Icon: typeof Facebook }[] = [
  { key: "facebook_url", Icon: Facebook },
  { key: "twitter_url", Icon: Twitter },
  { key: "linkedin_url", Icon: Linkedin },
  { key: "instagram_url", Icon: Instagram },
  { key: "youtube_url", Icon: Youtube },
];

function ensureUrl(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  return s.startsWith("http") ? s : `https://${s}`;
}

export default function OrgNameCardPage() {
  const [orgData, setOrgData] = useState<{ org: Record<string, unknown> | null } | null>(null);
  const [showTrackDelivery, setShowTrackDelivery] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setShowTrackDelivery(false);
    const orgPromise = zodula.get_action("zodula.org.getInfo" as Zodula.ActionPath, {});
    const menuPromise = zodula.get_action("zerp.website.get_additional_menu" as Zodula.ActionPath, {});
    orgPromise
      .then((data: { org: Record<string, unknown> | null }) => {
        setOrgData(data ?? { org: null });
      })
      .catch((e: { message?: string }) => {
        setError(e?.message ?? "Failed to load organization");
        setOrgData({ org: null });
      })
      .finally(() => setLoading(false));
    menuPromise
      .then((menu: { additional_menu_delivery_note_tracking?: boolean }) => {
        setShowTrackDelivery(menu?.additional_menu_delivery_note_tracking === true);
      })
      .catch(() => setShowTrackDelivery(false));
  }, []);

  const doc = orgData?.org ?? null;

  if (loading) {
    return (
      <div className="auth-page-bg zd:min-h-screen zd:flex zd:items-center zd:justify-center zd:relative">
        <p className="zd:relative zd:z-10 zd:text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="auth-page-bg zd:min-h-screen zd:flex zd:items-center zd:justify-center zd:relative">
        <p className="zd:relative zd:z-10 zd:text-muted-foreground">{error ?? "Organization not found."}</p>
      </div>
    );
  }

  const o = doc as unknown as Record<string, unknown>;
  const logoUrl = o.logo ?? null
  const name = (o.organization_name as string) ?? o.id;
  const address = (o.address as string)?.trim() || null;
  const phone = (o.phone as string)?.trim() || null;
  const email = (o.email as string)?.trim() || null;
  const website = ensureUrl((o.website as string) ?? "");

  const hasContact = address || phone || email || website;
  const socialLinks = SOCIAL_FIELDS.filter(({ key }) => ensureUrl(o[key] as string));

  return (
    <div className="auth-page-bg zd:min-h-screen zd:flex zd:items-center zd:justify-center zd:p-4 zd:relative">
      <div className="zd:relative zd:z-10 zd:w-full zd:max-w-4xl zd:rounded-2xl zd:border zd:bg-background/95 zd:shadow-xl zd:shadow-black/10 zd:backdrop-blur-sm zd:overflow-hidden">
        <div className="zd:bg-gradient-to-r zd:from-primary/10 zd:via-primary/5 zd:to-transparent zd:px-8 zd:py-6 zd:flex zd:flex-col md:zd:flex-row md:zd:items-center md:zd:justify-between zd:gap-4">
          <div className="zd:flex zd:items-center zd:gap-4">
            {logoUrl && (
              <div className="zd:flex zd:justify-center">
                <img
                  src={typeof logoUrl === "string" ? logoUrl : ""}
                  alt="Logo"
                  className="zd:h-16 zd:w-16 md:zd:h-20 md:zd:w-20 zd:object-contain zd:rounded-xl zd:ring-1 zd:ring-border/60 zd:bg-background"
                />
              </div>
            )}
            <div>
              <h1 className="zd:text-2xl md:zd:text-3xl zd:font-semibold zd:text-foreground zd:tracking-tight">
                {name}
              </h1>
              {(o.abbr as string) && (
                <p className="zd:mt-1 zd:text-sm zd:text-muted-foreground zd:font-medium">
                  {o.abbr as string}
                </p>
              )}
            </div>
          </div>
          {showTrackDelivery && (
            <Link
              to={`/org/track`}
              className="zd:inline-flex zd:items-center zd:justify-center zd:gap-2 zd:py-2.5 zd:px-4 zd:rounded-full zd:text-sm zd:font-medium zd:bg-primary zd:text-primary-foreground hover:zd:opacity-90 zd:transition-opacity"
            >
              <PackageSearch className="zd:w-4 zd:h-4" />
              Track delivery
            </Link>
          )}
        </div>

        <div className="zd:px-8 zd:py-6 zd:grid zd:grid-cols-1 md:zd:grid-cols-[1.2fr,1fr] zd:gap-8">
          {/* Bio + contact */}
          <div className="zd:space-y-4">
            {(o.bio as string)?.trim() && (
              <p className="zd:text-sm zd:text-muted-foreground zd:leading-relaxed zd:whitespace-pre-line">
                {(o.bio as string).trim()}
              </p>
            )}

            {hasContact && (
              <div className="zd:space-y-2">
                <h2 className="zd:text-xs zd:font-semibold zd:uppercase zd:tracking-wide zd:text-muted-foreground">
                  Contact
                </h2>
                <div className="zd:space-y-2">
                  {address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="zd:flex zd:items-start zd:gap-3 zd:rounded-lg zd:border zd:bg-muted/40 zd:px-3 zd:py-2.5 zd:text-sm zd:text-muted-foreground hover:zd:bg-muted hover:zd:text-foreground zd:transition-colors"
                    >
                      <div className="zd:flex zd:h-8 zd:w-8 zd:items-center zd:justify-center zd:rounded-full zd:bg-background">
                        <MapPin className="zd:w-4 zd:h-4 zd:text-primary" />
                      </div>
                      <span className="zd:break-words">{address}</span>
                    </a>
                  )}
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="zd:flex zd:items-center zd:gap-3 zd:rounded-lg zd:border zd:bg-muted/40 zd:px-3 zd:py-2.5 zd:text-sm zd:text-muted-foreground hover:zd:bg-muted hover:zd:text-foreground zd:transition-colors"
                    >
                      <div className="zd:flex zd:h-8 zd:w-8 zd:items-center zd:justify-center zd:rounded-full zd:bg-background">
                        <Phone className="zd:w-4 zd:h-4 zd:text-primary" />
                      </div>
                      <span>{phone}</span>
                    </a>
                  )}
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="zd:flex zd:items-center zd:gap-3 zd:rounded-lg zd:border zd:bg-muted/40 zd:px-3 zd:py-2.5 zd:text-sm zd:text-muted-foreground hover:zd:bg-muted hover:zd:text-foreground zd:transition-colors"
                    >
                      <div className="zd:flex zd:h-8 zd:w-8 zd:items-center zd:justify-center zd:rounded-full zd:bg-background">
                        <Mail className="zd:w-4 zd:h-4 zd:text-primary" />
                      </div>
                      <span className="zd:break-all">{email}</span>
                    </a>
                  )}
                  {website && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="zd:flex zd:items-center zd:gap-3 zd:rounded-lg zd:border zd:bg-muted/40 zd:px-3 zd:py-2.5 zd:text-sm zd:text-muted-foreground hover:zd:bg-muted hover:zd:text-foreground zd:transition-colors"
                    >
                      <div className="zd:flex zd:h-8 zd:w-8 zd:items-center zd:justify-center zd:rounded-full zd:bg-background">
                        <Globe className="zd:w-4 zd:h-4 zd:text-primary" />
                      </div>
                      <span className="zd:break-all">{website}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Social + meta */}
          <div className="zd:space-y-4">
            {socialLinks.length > 0 && (
              <div>
                <h2 className="zd:text-xs zd:font-semibold zd:uppercase zd:tracking-wide zd:text-muted-foreground">
                  Social
                </h2>
                <div className="zd:mt-2 zd:flex zd:flex-wrap zd:gap-2">
                  {SOCIAL_FIELDS.map(({ key, Icon }) => {
                    const url = ensureUrl(o[key] as string);
                    if (!url) return null;
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="zd:p-2 zd:rounded-full zd:bg-muted/60 zd:text-muted-foreground hover:zd:bg-muted hover:zd:text-foreground zd:transition-colors"
                        aria-label={key.replace("_url", "")}
                      >
                        <Icon className="zd:w-4 zd:h-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
