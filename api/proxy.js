export default async function handler(req, res) {
  // 백엔드 기본 주소
  const BASE_URL = "http://52.79.139.255:8088";
  
  // 프론트엔드 요청 URL을 백엔드 URL로 결합 (예: /s3/put -> http://.../s3/put)
  const targetUrl = BASE_URL + req.url;

  // 1. CORS Preflight 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 2. 헤더 정리 (500 에러 방지)
    const headers = { ...req.headers };
    const dropHeaders = [
      "host", "content-length", "content-encoding", "connection", 
      "keep-alive", "transfer-encoding", "te", "upgrade", "content-type"
    ];
    dropHeaders.forEach((key) => delete headers[key]);

    // 인증 헤더 유지
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth) headers.authorization = auth;

    // 3. 바디 변환 (JSON -> x-www-form-urlencoded)
    // 백엔드 컨트롤러(@RequestParam) 호환을 위해 폼 데이터로 변환
    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      // 프론트가 JSON을 보냈어도, 백엔드는 Form Data를 원할 수 있음 (특히 UploadController)
      const params = new URLSearchParams();
      const data = req.body || {};
      
      for (const key in data) {
        const value = data[key];
        const paramValue = typeof value === 'object' ? JSON.stringify(value) : value;
        params.append(key, paramValue);
      }
      body = params;
      // fetch가 body를 보고 자동으로 content-type: application/x-www-form-urlencoded 설정함
    }

    // 4. 백엔드 요청 전송
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
    console.error("General Proxy Error:", e);
    res.status(502).json({ message: "Proxy Request Failed", error: String(e) });
  }
}