const nodemailer = require("nodemailer");
const { z } = require("zod");
const { createAnnouncement } = require("./db");

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
  email: z.string().min(1, "Email jest wymagany"),
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

  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    null;

  const browser = req.headers["user-agent"] || null;

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Nieprawidłowe dane formularza",
      details: parsed.error.issues,
    });
  }

  const { name, phone, message, email } = parsed.data;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const recipientEmail = process.env.CONTACT_EMAIL || gmailUser;

  console.log(gmailUser, gmailPass);

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({
      error: "Serwer nie jest skonfigurowany do wysyłania maili",
    });
  }

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  try {
    await createAnnouncement({
      phoneNumber: safePhone,
      name: safeName,
      email: safeEmail,
      message: safeMessage,
      ip,
      browser,
    });

    await transporter.sendMail({
      from: `"Mieszkanie Kopernika 5" <${gmailUser}>`,
      to: recipientEmail,
      subject: `Nowe zapytanie o mieszkanie od: ${name}`,
      text: `Imię i nazwisko: ${name}\nTelefon: ${phone}\nEmail: ${email}\n\nWiadomość:\n${message}`,
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

            <tr>
              <td style="padding: 8px 0; color: #64748b;">
                Email:
              </td>
              <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">
                ${safeEmail}
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

    await transporter.sendMail({
      from: `"Mieszkanie Kopernika 5" <${gmailUser}>`,
      to: safeEmail,
      subject: "Dziękujemy za kontakt w sprawie mieszkania",
      text: `Dzień dobry ${name},

      dziękujemy za kontakt i zainteresowanie mieszkaniem.

      Otrzymaliśmy Twoją wiadomość i odezwiemy się niebawem, aby odpowiedzieć na pytania oraz ustalić ewentualne szczegóły.

      Podsumowanie zgłoszenia:
      Imię i nazwisko: ${name}
      Telefon: ${phone}
      Email: ${email}

      Wiadomość:
      ${message}

      Pozdrawiamy,
      Piotr Sałkowski

      To jest automatyczne potwierdzenie otrzymania wiadomości.`,
      html: `
          <div style="margin: 0; padding: 0; background: #f1f5f9; font-family: Arial, sans-serif;">
            <div style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">
              <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">

                <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 28px 32px;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; line-height: 1.3;">
                    Dziękujemy za kontakt
                  </h1>
                  <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 15px; line-height: 1.5;">
                    Otrzymaliśmy Twoje zapytanie dotyczące mieszkania.
                  </p>
                </div>

                <div style="padding: 32px;">
                  <p style="margin: 0 0 16px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                    Dzień dobry <strong>${safeName}</strong>,
                  </p>

                  <p style="margin: 0 0 16px; color: #334155; font-size: 15px; line-height: 1.7;">
                    dziękujemy za przesłanie wiadomości i zainteresowanie ofertą mieszkania.
                    Twoje zgłoszenie zostało poprawnie odebrane.
                  </p>

                  <p style="margin: 0 0 24px; color: #334155; font-size: 15px; line-height: 1.7;">
                    Odezwę się niebawem, aby odpowiedzieć na pytania oraz ustalić szczegóły kontaktu.
                  </p>

                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">
                      Podsumowanie zgłoszenia
                    </h2>

                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; width: 150px; font-size: 14px;">
                          Imię i nazwisko:
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: bold; font-size: 14px;">
                          ${safeName}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                          Telefon:
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: bold; font-size: 14px;">
                          ${safePhone}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
                          Email:
                        </td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: bold; font-size: 14px;">
                          ${safeEmail}
                        </td>
                      </tr>
                    </table>
                  </div>

                  <div style="margin-top: 24px;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                      Treść przesłanej wiadomości:
                    </p>

                    <div style="background: #ffffff; border-left: 4px solid #334155; padding: 14px 16px; color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                      ${safeMessage}
                    </div>
                  </div>

                  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
                      Pozdrawiam,<br />
                      <strong>Piotr Sałkowski</strong>
                    </p>
                  </div>
                </div>

                <div style="background: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                    To jest automatyczne potwierdzenie otrzymania wiadomości.
                    Nie musisz odpowiadać na tego maila.
                  </p>
                </div>

              </div>
            </div>
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
