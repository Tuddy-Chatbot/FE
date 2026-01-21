export default async function handler(req, res) {
  // 백엔드 주소 (하드코딩)
  const targetUrl = "http://52.79.139.255:8088/chat";

  // 1. CORS Preflight (OPTIONS) 처리
  // 브라우저가 보내는 예비 요청에 대해 백엔드 없이 바로 성공 응답
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. 요청 헤더 클린업 (500 에러 방지 핵심)
    // 브라우저 헤더 중 프록시 통신에 충돌을 일으키는 헤더들 제거
    const headers = { ...req.headers };
    
    const dropHeaders = [
      "host",
      "content-length",
      "content-encoding", // 이미 디코딩된 데이터를 또 압축 해제하려다 500 에러 발생 방지
      "connection",
      "keep-alive",
      "transfer-encoding",
      "te",
      "upgrade"
    ];

    dropHeaders.forEach((key) => delete headers[key]);

    // 인증 헤더(토큰)는 명시적으로 보존
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth) {
      headers.authorization = auth;
    }

    // 컨텐츠 타입은 JSON으로 고정
    headers["content-type"] = "application/json";

    // 3. 요청 바디 구성
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      // req.body가 객체면 문자열화, 없으면 빈 객체 {}
      body = JSON.stringify(req.body ?? {});
    }

    // 4. 백엔드로 요청 전달
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    // 5. 응답 처리
    const status = upstream.status;
    const text = await upstream.text(); // 텍스트로 먼저 수신

    res.status(status);

    // JSON 형식이면 파싱해서 반환, 아니면 텍스트 그대로 반환
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