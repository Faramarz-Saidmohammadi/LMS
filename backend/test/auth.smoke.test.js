const request = require("supertest");
const app = require("../app");

describe("Auth smoke tests", () => {
  it("POST /auth/login should validate body (expect 400 if missing)", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect([400, 401]).toContain(res.statusCode);
  });
});
