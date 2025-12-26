import "dotenv/config";
import express from "express";
import { supabase } from "./supabase";
import cors from "cors";
import { mg, mgDomain } from "./mailgun";



const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://estatespace.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Tillåt requests utan origin (t.ex. Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/supabase-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("estates")
      .select("*")
      .limit(5);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    res.json({ ok: true, data });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

const PORT = Number(process.env.PORT) || 3000;

app.post("/mail/test", async (req, res) => {
  try {
    const { to } = req.body as { to?: string };

    if (!to) {
      return res.status(400).json({
        ok: false,
        error: "Du måste skicka med 'to' i body",
      });
    }

    const result = await mg.messages.create(mgDomain, {
      from: `EstateSpace <mailgun@${mgDomain}>`,
      to: [to],
      subject: "Mailgun test från EstateSpace ✅",
      text: "Om du får detta mail fungerar Mailgun via din backend.",
    });

    res.json({ ok: true, result });
  } catch (err: any) {
    console.error("Mailgun error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});