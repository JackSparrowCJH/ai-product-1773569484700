export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>🪵 敲木鱼</h1>
      <p>功德无量</p>
      <section style={{ marginTop: "2rem", textAlign: "left", maxWidth: 600, margin: "2rem auto" }}>
        <h2>API Endpoints</h2>
        <ul>
          <li><code>POST /api/auth/login</code> — 授权登录</li>
          <li><code>POST /api/auth/guest</code> — 游客模式</li>
          <li><code>POST /api/sync</code> — 功德增量同步</li>
          <li><code>GET /api/sync?user_id=xxx</code> — 查询功德</li>
          <li><code>POST /api/sync/merge</code> — 冲突合并</li>
          <li><code>GET /api/sync/history?user_id=xxx</code> — 同步日志</li>
          <li><code>GET /api/health</code> — 健康检查</li>
        </ul>
      </section>
    </main>
  );
}
