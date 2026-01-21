export default async function handler(req, res) {
  // 백엔드 주소
  const targetUrl = "http://52.79.139.255:8088/chat";

  // 1. CORS Preflight (OPTIONS) 처리
  // 브라우저가 보내는 예비 요청에 대해 백엔드 없이 바로 성공 응답
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. 요청 헤더 클린업 (500 에러 및 충돌 방지)
    const headers = { ...req.headers };
    
    // 프록시 통신에 방해되는 헤더들 제거
    const dropHeaders = [
      "host",
      "content-length",
      "content-encoding", 
      "connection",
      "keep-alive",
      "transfer-encoding",
      "te",
      "upgrade",
      "content-type" // fetch가 자동으로 설정하도록 제거 (중요)
    ];

    dropHeaders.forEach((key) => delete headers[key]);

    // 인증 헤더(토큰)는 명시적으로 보존
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth) {
      headers.authorization = auth;
    }

    // 3. 바디 변환 (JSON -> Form Data)
    // 백엔드가 application/json을 지원하지 않으므로, 
    // 표준 폼 데이터(application/x-www-form-urlencoded)로 변환하여 전송합니다.
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const params = new URLSearchParams();
      const data = req.body || {};
      
      // 데이터 객체를 순회하며 Form Data로 변환
      for (const key in data) {
        const value = data[key];
        // 객체나 배열인 경우 문자열로 변환하여 전송
        const paramValue = typeof value === 'object' ? JSON.stringify(value) : value;
        params.append(key, paramValue);
      }
      body = params;
    }

    // 4. 백엔드로 요청 전달
    // body가 URLSearchParams이면 Content-Type은 자동으로 form-urlencoded가 됩니다.
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