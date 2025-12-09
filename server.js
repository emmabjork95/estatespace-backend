console.log("🔥 server.js is running at all");

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(3000, () => console.log("Server running on port 3000"));
