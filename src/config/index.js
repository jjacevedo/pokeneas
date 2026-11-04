const port = Number(process.env.PORT) || 80;
const imagesBaseUrl = (process.env.IMAGES_BASE_URL || "/assets/pokeneas").replace(/\/$/, "");

module.exports = { port, imagesBaseUrl };
