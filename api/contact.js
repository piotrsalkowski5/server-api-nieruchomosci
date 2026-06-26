function setCors(req, res) {
  // Na start najprościej: pozwól wszystkim. Do produkcji możesz zawęzić do swojej domeny.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  // Bardzo ważne dla przeglądarki: preflight CORS musi zwrócić 204/200, nie 500.
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      message: 'Endpoint /api/contact działa. Wyślij POST z name, phone, message.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const { name, phone, message } = body;

  if (!name || !phone || !message) {
    return res.status(400).json({
      error: 'Brakuje pól: name, phone, message',
      received: body
    });
  }

  // Tu później podepniesz nodemailer / bazę / webhook.
  return res.status(200).json({
    ok: true,
    message: 'Formularz odebrany poprawnie',
    data: { name, phone, message }
  });
};
