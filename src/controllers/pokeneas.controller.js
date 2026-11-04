const pokeneasService = require("../services/pokeneas.service");

function home(req, res) {
  res.render("home", {
    total: pokeneasService.getAll().length,
    containerId: pokeneasService.getContainerId()
  });
}

function getPokeneaJson(req, res) {
  const pokenea = pokeneasService.getRandomPokenea();
  res.json({
    id: pokenea.id,
    nombre: pokenea.nombre,
    altura: pokenea.altura,
    habilidad: pokenea.habilidad,
    contenedor: pokeneasService.getContainerId()
  });
}

function showPokenea(req, res) {
  const pokenea = pokeneasService.getRandomPokenea();
  res.render("pokenea", {
    pokenea,
    imageUrl: pokeneasService.getImageUrl(pokenea),
    containerId: pokeneasService.getContainerId()
  });
}

module.exports = { home, getPokeneaJson, showPokenea };
