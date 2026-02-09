// 호출하려는 HTTP API 서버의 '기본' 주소만 남깁니다.
const API_BASE_URL = 'http://202.20.84.65:8083/api/v1';

export default async function handler(req, res) {
  try {
    // req.url에서 '/api/proxy' 부분을 제거하여 실제 목표 경로를 추출합니다.
    // 예: '/api/proxy/chat/scenarios/1000/DEV' -> '/chat/scenarios/1000/DEV'
    const path = req.url.replace('/api/proxy', '');
    
    // 기본 주소와 목표 경로를 합쳐 올바른 전체 API URL을 만듭니다.
    const apiUrl = `${API_BASE_URL}${path}`;

    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    // API 서버의 응답이 JSON이 아닐 수도 있으므로, content-type을 확인합니다.
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      // JSON이 아닌 경우(예: 텍스트 스트림), 그대로 응답을 전달합니다.
      res.status(response.status).send(await response.text());
    }

  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({ error: 'API request failed through proxy.' });
  }
}