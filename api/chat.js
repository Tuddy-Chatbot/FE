export default async function handler(req, res) {
  // 백엔드 주소
  const targetUrl = "http://52.79.139.255:8088/chat";

  // 1. CORS Preflight 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. 헤더 정리
    const headers = { ...req.headers };
    
    // 프록시 충돌 및 500 에러 유발 헤더 제거
    const dropHeaders = [
      "host",
      "content-length",
      "content-encoding", 
      "connection",
      "keep-alive",
      "transfer-encoding",
      "te",
      "upgrade",
      "content-type" // 우리가 직접 설정할 것이므로 제거
    ];

    dropHeaders.forEach((key) => delete headers[key]);

    // 인증 헤더 보존
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth) {
      headers.authorization = auth;
    }

    // [핵심 변경] JSON, Form-Data 모두 거부되었으므로 'text/plain' 시도
    // 백엔드가 @RequestBody String 혹은 raw data를 원할 때 사용됩니다.
    headers["content-type"] = "text/plain";

    // 3. 바디 구성
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      // 객체인 경우 문자열로 변환하여 전송
      // 백엔드는 이 문자열을 통째로 받게 됩니다.
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
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

    res.status(status);

    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (e) {
    console.error("Proxy Error Details:", e);
    res.status(502).json({ 
      message: "Chat proxy failed", 
      error: String(e) 
    });
  }
}