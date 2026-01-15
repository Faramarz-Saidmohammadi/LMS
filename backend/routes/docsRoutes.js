const router = require("express").Router();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../docs/swagger");

// ✅ OpenAPI JSON
router.get("/openapi.json", (req, res) => {
  return res.json(swaggerSpec);
});

// ✅ Swagger UI
router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "LMS API Docs",
  })
);

module.exports = router;
