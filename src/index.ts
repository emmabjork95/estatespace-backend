import "dotenv/config";
import express from "express";
import { supabase } from "./supabase";

console.log("Booting API...");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const app = express();
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});