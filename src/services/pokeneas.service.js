const os = require("os");
const pokeneas = require("../data/pokeneas");
const { imagesBaseUrl } = require("../config");

function getRandomPokenea() {
  const index = Math.floor(Math.random() * pokeneas.length);
  return pokeneas[index];
}

function getContainerId() {
  return os.hostname();
}

function getImageUrl(pokenea) {
  return `${imagesBaseUrl}/${pokenea.imagen}`;
}

function getAll() {
  return pokeneas;
}

module.exports = { getRandomPokenea, getContainerId, getImageUrl, getAll };
