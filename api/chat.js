export default async function handler(req, res) {
  const targetUrl = "http://52.79.139.255:8088/chat";

  try {
    // Authorization 강제 전달
    const auth = req.headers.authorization || req.headers.Authorization;

    const headers = {
      "content-type": req.headers["content-type"] || "application/json",
      "accept": req.headers["accept"] || "application/json",
    };

    if (auth) headers["authorization"] = auth;

    // 바디 처리 (JSON)
    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body ?? {});

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const text = await upstream.text();
    res.status(upstream.status);

    // JSON이면 JSON으로 반환, 아니면 text로
    const ct = upstream.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        res.json(JSON.parse(text || "{}"));
      } catch {
        res.send(text);
      }
    } else {
      res.send(text);
    }
  } catch (e) {
    res.status(502).json({ message: "Chat proxy error", error: String(e) });
  }
}
