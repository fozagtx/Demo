import { ActionFilter } from "@/components/action-filter";
import { PageShell } from "@/components/page-shell";
import { getActions } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const actions = await getActions();

  return (
    <PageShell title="ACTIONS" eyebrow="every logged Event Contract event">
      <ActionFilter actions={actions} initialQuery={q ?? ""} />
    </PageShell>
  );
}
