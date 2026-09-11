"use client";

import { useMemo, useState } from "react";
import type { ExplorerAction } from "@/lib/types";
import { ActionTable } from "./action-table";

export function ActionFilter({
  actions,
  initialQuery = "",
}: {
  actions: ExplorerAction[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState<"all" | "trades" | "resolutions">("all");
  const [outcome, setOutcome] = useState<"all" | "YES" | "NO">("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return actions.filter((action) => {
      if (
        kind === "trades" &&
        !action.actionType.startsWith("buy") &&
        !action.actionType.startsWith("sell")
      ) {
        return false;
      }
      if (kind === "resolutions" && action.actionType !== "resolution") {
        return false;
      }
      if (outcome !== "all" && action.outcome !== outcome) {
        return false;
      }
      if (
        needle &&
        !`${action.id} ${action.txHash ?? ""} ${action.actorId} ${action.marketId} ${action.marketSymbol}`
          .toLowerCase()
          .includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [actions, query, kind, outcome]);

  const chipClass = (active: boolean) =>
    `pxl-btn-thin pxl-btn border-2 px-2.5 py-0.5 font-crt text-base leading-snug ${
      active
        ? "border-accent bg-accent text-surface"
        : "border-line text-muted hover:border-ink hover:text-ink"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="> search tx / address / market"
          className="w-72 border-2 border-line bg-surface px-3 py-1.5 font-crt text-lg text-ink placeholder:text-faint focus:border-accent focus:outline-none"
        />
        {(
          [
            ["all", "ALL"],
            ["trades", "TRADES"],
            ["resolutions", "RESOLUTIONS"],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setKind(value)} className={chipClass(kind === value)}>
            {label}
          </button>
        ))}
        {(
          [
            ["all", "ANY"],
            ["YES", "WON YES"],
            ["NO", "WON NO"],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setOutcome(value)} className={chipClass(outcome === value)}>
            {label}
          </button>
        ))}
        <span className="ml-auto font-crt text-lg text-muted">
          {filtered.length}/{actions.length} ROWS
        </span>
      </div>
      <ActionTable actions={filtered} />
    </div>
  );
}
