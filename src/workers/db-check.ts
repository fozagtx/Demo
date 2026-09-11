import "dotenv/config";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

  const rows = await sql`
    select 'markets' as t, count(*)::int as c from markets
    union all select 'actors', count(*)::int from actors
    union all select 'actions', count(*)::int from actions
    union all select 'settlements', count(*)::int from settlements
    union all select 'scores', count(*)::int from scores
  `;

  console.log(rows.map((row) => `${row.t}: ${row.c}`).join("\n"));

  const scored = await sql`
    select a.id, a.display_name, count(*)::int as scored, round(avg(s.risk_adjusted_score)::numeric, 1) as avg_score
    from scores s join actors a on a.id = s.actor_id
    group by a.id, a.display_name order by avg_score desc nulls last limit 5
  `;

  console.log("--- top actors by avg score ---");
  console.log(scored.map((r) => `${r.display_name ?? r.id}: n=${r.scored} avg=${r.avg_score}`).join("\n"));

  await sql.end({ timeout: 5 });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
