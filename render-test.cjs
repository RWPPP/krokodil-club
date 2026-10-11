const http = require('node:http');
const BASE = 'https://vfuhtmpjcshnsjticuzu.supabase.co';
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const path = new URL(req.url, 'http://localhost').pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); res.end('Используйте GET'); return;
  }
  if (path === '/' || path === '/health') {
    res.writeHead(200); res.end('Сервер Render доступен 💚\n\nТеперь открой этот же адрес с /supabase-test в конце, чтобы проверить соединение сервера с рабочей базой.'); return;
  }
  if (path === '/supabase-test') {
    try {
      const result = await fetch(BASE + '/auth/v1/health', {redirect:'error', signal:AbortSignal.timeout(15000)});
      await result.body?.cancel();
      res.writeHead(200);
      res.end('Render получил ответ Supabase 💚\nHTTP: ' + result.status + '\n\nДаже 401 означает, что адрес доступен: запрос специально отправлен без ключа. Запись и авторизация пока не проверялись.');
    } catch {
      res.writeHead(502); res.end('Render доступен, но не смог получить ответ Supabase за время проверки.');
    }
    return;
  }
  res.writeHead(404); res.end('Страница не найдена');
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Connectivity test server started'));
