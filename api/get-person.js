const { saveVisitor } = require("./db");

function setCors(req, res) {
  const allowedOrigins = [
    "https://sprzedaz-mieszkania-kopernika.pl",
    "https://www.sprzedaz-mieszkania-kopernika.pl",
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  console.log("here");


  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    null;

  const browser = req.headers["user-agent"] || null;

  try {
    await saveVisitor({
      ip,
      browser,
    });

    return res.status(200).json({
      success: true,
    });
  } catch (err) {}
};
