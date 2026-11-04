const { Router } = require("express");
const pokeneasController = require("../controllers/pokeneas.controller");

const router = Router();

router.get("/", pokeneasController.home);
router.get("/api/pokenea", pokeneasController.getPokeneaJson);
router.get("/pokenea", pokeneasController.showPokenea);

module.exports = router;
