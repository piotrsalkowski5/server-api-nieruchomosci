module.exports = function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: "API działa",
    method: req.method,
    time: new Date().toISOString(),
  });
};
