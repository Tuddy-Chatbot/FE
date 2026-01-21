export default async function handler(req, res) {
  // 에러 방지를 위해 process.env 제거하고 직접 주소 입력
  const targetUrl = "http://52.79.139.255:8088/chat";

  // 1. CORS Preflight (OPTIONS) 요청 처리
  // 브라우저가 본 요청(POST)을 보내기 전에 허용 여부를 묻는 단계
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. 요청 헤더 구성
    // 브라우저 헤더를 복사하되, 충돌 가능성 있는 host 헤더는 제외
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["content-length"];

    // Authorization 헤더 명시적 확인 (대소문자 호환)
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth) {
      headers.authorization = auth;
    }

    // 3. 요청 바디 구성
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body =
        typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body ?? {});
    }

    // 4. 백엔드로 요청 전달
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    // 5. 응답 처리
    const status = upstream.status;
    const text = await upstream.text();
    
    // 백엔드 상태 코드 전달
    res.status(status);

    // JSON 파싱 시도
    try {
      res.json(JSON.parse(text || "{}"));
    } catch {
      res.send(text);
    }
  } catch (e) {
    console.error("Proxy Error:", e);
    res.status(502).json({ message: "Chat proxy error", error: String(e) });
  }
}