import { query, initDB } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    await initDB();
    const guestId = `guest_${randomUUID()}`;

    const result = await query(
      `INSERT INTO users (id, nickname, is_guest, merit)
       VALUES ($1, 'guest', true, 0)
       RETURNING id, nickname, merit, is_guest`,
      [guestId]
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
