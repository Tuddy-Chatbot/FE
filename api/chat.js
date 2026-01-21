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
    
    // Multipart 요청은 브라우저/fetch가 자동으로 Boundary를 포함한 Content-Type을 생성해야 합니다.
    // 따라서 기존 Content-Type을 포함하여 방해가 되는 헤더들을 모두 제거합니다.
    const dropHeaders = [
      "host",
      "content-length",
      "content-encoding",
      "connection",
      "keep-alive",
      "transfer-encoding",
      "te",
      "upgrade",
      "content-type" // 중요: 제거해야 fetch가 자동으로 multipart/form-data; boundary=... 를 설정함
    ];

    dropHeaders.forEach((key) => delete headers[key]);

    // 인증 헤더(Bearer Token)는 필수이므로 유지
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth) {
      headers.authorization = auth;
    }

    // 3. 바디 재조립 (JSON -> Multipart)
    // 백엔드는 'req' 파트에 JSON을, 'files' 파트에 파일을 원합니다.
    const formData = new FormData();

    if (req.method !== "GET" && req.method !== "HEAD") {
      // 프론트에서 온 JSON 데이터를 가져옵니다.
      const originalBody = req.body || {};

      // [핵심] 'req' 파트 추가
      // 백엔드 요구사항: 파트의 Content-Type이 'application/json'이어야 함
      // Blob을 사용하여 Content-Type을 명시적으로 지정합니다.
      const jsonString = JSON.stringify(originalBody);
      const jsonBlob = new Blob([jsonString], { type: "application/json" });
      formData.append("req", jsonBlob);

      // 'files' 파트 추가 (옵션인 경우를 대비해 빈 파일 전송 시도)
      // curl 예제에 'files=string'이 있으므로, 빈 파일이라도 보내는 것이 안전할 수 있음
      // 필요 없다면 이 부분은 주석 처리해도 됩니다.
      // formData.append("files", new Blob([], { type: "application/octet-stream" }), "empty.txt");
    }

    // 4. 백엔드로 요청 전달
    // body에 formData를 넣으면 fetch가 알아서 올바른 Content-Type 헤더를 생성합니다.
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: formData,
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