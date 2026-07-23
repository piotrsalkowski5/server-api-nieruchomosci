const { neon } = require("@neondatabase/serverless");

async function createAnnouncement(input) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Brak DATABASE_URL w env");
  }

  const sql = neon(process.env.DATABASE_URL);

  const [announcement] = await sql`
    INSERT INTO announcements (
      "phoneNumber",
      name,
      email,
      message,
      ip,
      browser
    )
    VALUES (
      ${input.phoneNumber},
      ${input.name},
      ${input.email},
      ${input.message},
      ${input.ip ?? null},
      ${input.browser ?? null}
    )
    RETURNING
      id,
      uuid,
      "creationDate",
      "phoneNumber",
      name,
      email,
      message,
      ip,
      browser
  `;

  return announcement;
}

async function saveVisitor(input) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Brak DATABASE_URL w env");
  }

  const sql = neon(process.env.DATABASE_URL);

  if (!input.ip) {
    return null;
  }

  const [existing] = await sql`
    SELECT id
    FROM announcements
    WHERE ip = ${input.ip}
    LIMIT 1
  `;

  if (existing) {
    return null;
  }

  const [visitor] = await sql`
    INSERT INTO announcements (
      ip,
      browser
    )
    VALUES (
      ${input.ip},
      ${input.browser ?? null}
    )
    RETURNING
      id,
      uuid,
      "creationDate",
      ip,
      browser
  `;

  return visitor;
}

module.exports = { createAnnouncement, saveVisitor };
