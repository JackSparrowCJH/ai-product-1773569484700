import { query, initDB } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initDB();
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return Response.json({ error: "user_id is required" }, { status: 400 });
    }

    const result = await query(
      `SELECT id, delta, client_timestamp, server_timestamp
       FROM merit_sync_log
       WHERE user_id = $1
       ORDER BY server_timestamp DESC
       LIMIT 50`,
      [userId]
    );

    return Response.json({ ok: true, logs: result.rows });
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
