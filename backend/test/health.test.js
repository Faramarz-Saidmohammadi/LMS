const request = require("supertest");
const app = require("../app");

describe("Health checks", () => {
  it("GET /health should return 200", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /health/live should return 200", async () => {
    const res = await request(app).get("/health/live");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("live");
  });
});
