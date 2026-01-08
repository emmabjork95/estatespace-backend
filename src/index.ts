import "dotenv/config";
import crypto from "crypto";
import cors from "cors";
import express from "express";
import { supabase } from "./supabase";
import { mg, mgDomain } from "./mailgun";
import { requireUser, requireSpaceOwner } from "./permissions";

const app = express();

/*CONFIG*/

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const allowedOrigins = [
  "http://localhost:5173",
  "https://estatespace.vercel.app",
];

function isAllowedOrigin(origin: string) {
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}

/*MIDDLEWARE*/

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (isAllowedOrigin(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/*ROUTES*/

app.get("/", (_req, res) => {
  return res.send("API is running");
});

app.get("/health", (_req, res) => {
  return res.status(200).json({ ok: true });
});

app.post("/spaces/:spacesId/invite-email", async (req, res) => {
  try {
    const { spacesId } = req.params;
    const { email } = req.body as { email?: string };

    if (!email?.trim()) {
      return res.status(400).json({ ok: false, error: "Missing email" });
    }

    const auth = await requireUser(req.headers.authorization);
    if (!auth.ok || !auth.user) {
      return res.status(auth.status).json({ ok: false, error: auth.error });
    }

    const access = await requireSpaceOwner(spacesId, auth.user.id);
    if (!access.ok) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    const invitedEmail = email.trim().toLowerCase();
    const token = crypto.randomUUID();

    const { error: insertError } = await supabase.from("invitations").insert({
      spaces_id: spacesId,
      profiles_id: auth.user.id,
      invited_email: invitedEmail,
      token,
      status: "pending",
      used: false,
    });

    if (insertError) {
      return res.status(500).json({ ok: false, error: insertError.message });
    }

    const link = `${FRONTEND_URL}/auth/invite/${token}`;

    let mailOk = true;

    try {
      await mg.messages.create(mgDomain, {
        from: `EstateSpace <postmaster@${mgDomain}>`,
        to: [invitedEmail],
        subject: "Du är inbjuden till ett Space i EstateSpace",
        text:
          `Du har blivit inbjuden till ett Space.\n\n` +
          `Logga in med ${invitedEmail} och klicka på länken:\n` +
          `${link}\n`,
      });
    } catch (err) {
      mailOk = false;
      console.error("Mailgun blocked/failed (invite still created):", err);
    }

    return res.json({
      ok: true,
      mailOk,
      message: mailOk
        ? "Invite created and email sent"
        : "Invite created, but email could not be sent in test environment",
    });
  } catch (err: any) {
    console.error("invite-email error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Server error",
    });
  }
});

app.post("/mail/test", async (req, res) => {
  try {
    const { to } = req.body as { to?: string };

    if (!to?.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Du måste skicka med 'to'",
      });
    }

    const result = await mg.messages.create(mgDomain, {
      from: `EstateSpace <mailgun@${mgDomain}>`,
      to: [to.trim()],
      subject: "Mailgun test från EstateSpace",
      text: "Om du får detta mail fungerar Mailgun via din backend.",
    });

    return res.json({ ok: true, result });
  } catch (err: any) {
    console.error("Mailgun error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Mail error",
    });
  }
});

/*START SERVER*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});