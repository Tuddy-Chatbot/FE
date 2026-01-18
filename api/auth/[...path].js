export default async function handler(req, res) {
  const BACKEND_BASE = "http://52.79.139.255:8088";

  try {
    // /api/auth/login -> /auth/login
    const url = new URL(req.url, "http://localhost");
    const backendPath = url.pathname.replace(/^\/api\/auth/, "/auth");
    const targetUrl = `${BACKEND_BASE}${backendPath}${url.search || ""}`;

    const auth = req.headers.authorization || req.headers.Authorization;

    const headers = {
      "content-type": "application/json",
      "accept": "application/json",
    };
    if (auth) headers.authorization = auth;

    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body =
        typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body ?? {});
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const text = await upstream.text();
    res.status(upstream.status);

    try {
      res.json(JSON.parse(text || "{}"));
    } catch {
      res.send(text);
    }
  } catch (e) {
    res
      .status(502)
      .json({ message: "Auth proxy error", error: String(e) });
  }
}
