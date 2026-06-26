const nodemailer = require("nodemailer");
const { z } = require("zod");

function setCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const contactSchema = z.object({
  name: z.string().min(1, "Imię jest wymagane"),
  phone: z.string().min(1, "Telefon jest wymagany"),
  message: z.string().min(1, "Wiadomość jest wymagana"),
});

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message:
        "Endpoint /api/contact-person działa. Wyślij POST z name, phone, message.",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Nieprawidłowe dane formularza",
      details: parsed.error.issues,
    });
  }

  const { name, phone, message } = parsed.data;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const recipientEmail = process.env.CONTACT_EMAIL || gmailUser;

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({
      error: "Serwer nie jest skonfigurowany do wysyłania maili",
    });
  }

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeMessage = escapeHtml(message);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Strona mieszkania" <${gmailUser}>`,
      to: recipientEmail,
      subject: `Nowe zapytanie o mieszkanie od: ${name}`,
      text: `Imię i nazwisko: ${name}\nTelefon: ${phone}\n\nWiadomość:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
            Nowe zapytanie o mieszkanie
          </h2>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">
                Imię i nazwisko:
              </td>
              <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">
                ${safeName}
              </td>
            </tr>

            <tr>
              <td style="padding: 8px 0; color: #64748b;">
                Telefon:
              </td>
              <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">
                ${safePhone}
              </td>
            </tr>
          </table>

          <div style="margin-top: 16px;">
            <p style="color: #64748b; margin-bottom: 8px;">Wiadomość:</p>
            <div style="background: #f8fafc; border-left: 4px solid #334155; padding: 12px 16px; color: #1e293b; white-space: pre-wrap;">
              ${safeMessage}
            </div>
          </div>

          <p style="margin-top: 24px; color: #94a3b8; font-size: 12px;">
            Wiadomość wysłana ze strony ogłoszenia mieszkania.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.error("Błąd wysyłania maila:", err);

    return res.status(500).json({
      error: "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
    });
  }
};
