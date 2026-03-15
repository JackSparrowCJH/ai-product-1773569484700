import { query, initDB } from "@/lib/db";

// Conflict merge: client sends its local merit total + server resolves
// Strategy: last-write-wins with max(client_merit, server_merit) for conflict
export async function POST(req: Request) {
  try {
    await initDB();
    const body = await req.json();
    const { user_id, client_merit, client_timestamp } = body;

    if (!user_id || client_merit === undefined) {
      return Response.json(
        { error: "user_id and client_merit are required" },
        { status: 400 }
      );
    }

    const clientMerit = Number(client_merit);
    if (!Number.isInteger(clientMerit) || clientMerit < 0) {
      return Response.json(
        { error: "client_merit must be a non-negative integer" },
        { status: 400 }
      );
    }

    // Get server merit
    const result = await query(`SELECT merit FROM users WHERE id = $1`, [user_id]);
    if (result.rows.length === 0) {
      return Response.json({ error: "user not found" }, { status: 404 });
    }

    const serverMerit = Number(result.rows[0].merit);

    // Conflict resolution: take the max to avoid data loss
    const resolved = Math.max(serverMerit, clientMerit);
    const hadConflict = serverMerit !== clientMerit;

    if (resolved !== serverMerit) {
      await query(
        `UPDATE users SET merit = $1, updated_at = NOW() WHERE id = $2`,
        [resolved, user_id]
      );
    }

    // Log the merge event
    await query(
      `INSERT INTO merit_sync_log (user_id, delta, client_timestamp)
       VALUES ($1, $2, $3)`,
      [user_id, resolved - serverMerit, client_timestamp || new Date().toISOString()]
    );

    return Response.json({
      ok: true,
      merit: resolved,
      server_merit: serverMerit,
      client_merit: clientMerit,
      conflict: hadConflict,
      resolution: hadConflict ? "max_wins" : "no_conflict",
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
