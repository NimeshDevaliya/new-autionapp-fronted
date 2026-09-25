"use client";

import { useEffect, useState } from "react";
import { Copy, Download, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/admin-shell";
import { Panel } from "@/components/ui/panel";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * The two guides ship as static files under /public/docs — the rendered page
 * for reading in place, and the same content as a PDF for handing out.
 */
const DOCS = [
  {
    value: "admin-guide",
    label: "Admin guide",
    title: "Setting up a season and running the auction",
    description:
      "Sign in, create the tournament, teams and players, build the pool, then run the live console — one screenshot per step.",
    page: "/docs/admin-guide.html",
    pdf: "/docs/MPL-Auction-Admin-Guide.pdf",
    pdfSize: "1.9 MB",
  },
  {
    value: "money-flow",
    label: "Money flow",
    title: "Purse, base price and how bids climb",
    description:
      "What happens to a team's purse from opening bid to sale, when a team can't bid, and the Season 4 figures.",
    page: "/docs/money-flow.html",
    pdf: "/docs/MPL-Auction-Money-Flow.pdf",
    pdfSize: "0.2 MB",
  },
] as const;

type DocValue = (typeof DOCS)[number]["value"];

// plain anchors, not next/link: one is a file download, the other opens a new tab
const FILE_LINK =
  "inline-flex items-center justify-center gap-2 rounded-md border px-4 h-11 text-[15px] font-medium transition-colors";

export default function DocsPage() {
  const [active, setActive] = useState<DocValue>("admin-guide");
  const doc = DOCS.find((item) => item.value === active) ?? DOCS[0];

  // the public links depend on where this panel is being served from (LAN IP, ngrok…)
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const links = [
    { label: "Live board (anyone, no login)", href: `${origin}/live` },
    { label: "Team owner sign in", href: `${origin}/team/login` },
  ];

  return (
    <>
      <PageHeader
        title="Docs"
        description="How the panel and the auction work. Read here, or download the PDF to share."
      />

      <Panel className="mb-5 p-5">
        <h2 className="display text-lg text-text">Share these links</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {links.map((link) => (
            <li
              key={link.label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block text-sm text-text">{link.label}</span>
                <span className="block truncate text-xs text-muted">{link.href}</span>
              </span>
              <button
                type="button"
                className={cn(FILE_LINK, "h-9 border-line-strong text-sm text-text hover:bg-surface-3")}
                onClick={() => navigator.clipboard?.writeText(link.href)}
              >
                <Copy className="size-4" aria-hidden /> Copy
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Tabs
        tabs={DOCS.map((item) => ({ value: item.value, label: item.label }))}
        value={active}
        onChange={(value) => setActive(value as DocValue)}
        className="mb-5"
      />

      <Panel className="flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="display text-xl leading-tight text-text">{doc.title}</h2>
            <p className="mt-1 max-w-prose text-sm text-muted">{doc.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={doc.page}
              target="_blank"
              rel="noreferrer"
              className={cn(
                FILE_LINK,
                "border-line-strong bg-surface-2 text-text hover:bg-surface-3"
              )}
            >
              <ExternalLink className="size-4" aria-hidden />
              Open in new tab
            </a>
            <a
              href={doc.pdf}
              download
              className={cn(
                FILE_LINK,
                "border-amber bg-amber text-ink hover:bg-amber/90"
              )}
            >
              <Download className="size-4" aria-hidden />
              Download PDF
              <span className="text-xs font-normal opacity-70 tabular">{doc.pdfSize}</span>
            </a>
          </div>
        </div>

        <iframe
          key={doc.value}
          src={doc.page}
          title={doc.title}
          className="h-[calc(100vh-19rem)] min-h-[32rem] w-full bg-ink"
        />
      </Panel>
    </>
  );
}
