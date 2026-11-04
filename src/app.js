const path = require("path");
const express = require("express");
const pokeneasRoutes = require("./routes/pokeneas.routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));
app.use(pokeneasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

module.exports = app;
