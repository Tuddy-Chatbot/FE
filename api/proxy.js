export default async function handler(req, res) {
  const targetBase = "http://52.79.139.255:8088";

  // 들어온 URL에서 path 쿼리 추출: /api/proxy?path=chat
  const url = new URL(req.url, "http://localhost");
  const path = url.searchParams.get("path") || "";
  const targetUrl = `${targetBase}/${path}`;

  try {
    // 헤더 복사
    const headers = { ...req.headers };

    // 프록시할 때 문제될 수 있는 헤더 제거
    delete headers.host;
    delete headers.connection;
    delete headers["content-length"];

    // JSON body 처리
    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body ?? {});

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...headers,
        // content-type이 없으면 JSON 기본값
        "content-type": headers["content-type"] || "application/json",
      },
      body,
    });

    // 상태 코드 및 응답 전달
    res.status(upstream.status);
    upstream.headers.forEach((v, k) => {
      if (k.toLowerCase() === "transfer-encoding") return;
      res.setHeader(k, v);
    });

    const text = await upstream.text();
    res.send(text);
  } catch (e) {
    res.status(502).json({ message: "Proxy error", error: String(e) });
  }
}
