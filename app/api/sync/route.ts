import { query, initDB } from "@/lib/db";

// POST: Submit merit increment (delta-based sync)
export async function POST(req: Request) {
  try {
    await initDB();
    const body = await req.json();
    const { user_id, delta, client_timestamp } = body;

    if (!user_id || delta === undefined) {
      return Response.json(
        { error: "user_id and delta are required" },
        { status: 400 }
      );
    }

    const numDelta = Number(delta);
    if (!Number.isInteger(numDelta) || numDelta < 0) {
      return Response.json(
        { error: "delta must be a non-negative integer" },
        { status: 400 }
      );
    }

    const clientTs = client_timestamp || new Date().toISOString();

    // Check for duplicate/conflict: if a sync with same user_id and client_timestamp exists, skip
    const dup = await query(
      `SELECT id FROM merit_sync_log WHERE user_id = $1 AND client_timestamp = $2`,
      [user_id, clientTs]
    );

    if (dup.rows.length > 0) {
      // Idempotent: return current merit without re-applying
      const current = await query(`SELECT merit FROM users WHERE id = $1`, [user_id]);
      const merit = current.rows.length > 0 ? Number(current.rows[0].merit) : 0;
      return Response.json({
        ok: true,
        merit,
        conflict: "duplicate_ignored",
      });
    }

    // Log the sync event
    await query(
      `INSERT INTO merit_sync_log (user_id, delta, client_timestamp)
       VALUES ($1, $2, $3)`,
      [user_id, numDelta, clientTs]
    );

    // Apply delta atomically
    const result = await query(
      `UPDATE users SET merit = merit + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING merit`,
      [numDelta, user_id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "user not found" }, { status: 404 });
    }

    return Response.json({
      ok: true,
      merit: Number(result.rows[0].merit),
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// GET: Fetch current merit for a user
export async function GET(req: Request) {
  try {
    await initDB();
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return Response.json({ error: "user_id is required" }, { status: 400 });
    }

    const result = await query(
      `SELECT id, nickname, merit, is_guest FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: "user not found" }, { status: 404 });
    }

    const user = result.rows[0];
    return Response.json({
      ok: true,
      user: {
        id: user.id,
        nickname: user.nickname,
        merit: Number(user.merit),
        is_guest: user.is_guest,
      },
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
