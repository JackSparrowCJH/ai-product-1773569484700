import { query, initDB } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await initDB();
    const body = await req.json();
    const { user_id, nickname, is_guest } = body;

    if (!user_id) {
      return Response.json({ error: "user_id is required" }, { status: 400 });
    }

    const guest = is_guest === true;
    const name = nickname || (guest ? "guest" : "user");

    // Upsert: create user if not exists, otherwise return existing
    const result = await query(
      `INSERT INTO users (id, nickname, is_guest)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         nickname = CASE WHEN users.is_guest AND NOT $3 THEN $2 ELSE users.nickname END,
         is_guest = CASE WHEN users.is_guest AND NOT $3 THEN $3 ELSE users.is_guest END,
         updated_at = NOW()
       RETURNING id, nickname, merit, is_guest, created_at, updated_at`,
      [user_id, name, guest]
    );

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
