const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "LMS API",
      version: "1.0.0",
      description: "Production-ready LMS API (MERN)",
    },
    servers: [
      { url: process.env.API_BASE_URL || "http://localhost:5000", description: "Server" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  // اگر بعداً خواستی docs را در فایل‌های route با JSDoc بنویسی، این را گسترش می‌دهیم
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
