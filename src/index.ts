import "dotenv/config";
import express from "express";
import { supabase } from "./supabase";

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

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});