"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
      title: "j4",
      salary: 400,
      equity: "0.4",
      companyHandle: "c2"
    };
  
    test("ok for admin users", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            ...newJob
        }
      });
    });
  
    test("unauthorized for non admin users", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send(newJob)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("bad request with missing data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            salary: 500,
            equity: "0.5"
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request with invalid data", async function () {
      const resp = await request(app)
          .post("/jobs")
          .send({
            ...newJob,
            id: "this should be an integer",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  /************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title: "j1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1"
            },
            {
                id: expect.any(Number),
                title: "j2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1"
            },
            {
                id: expect.any(Number),
                title: "j3",
                salary: 300,
                equity: "0",
                companyHandle: "c1",
                companyName: "C1"
            },
          ],
    });
  });

  test("works: filter", async () => {
    const resp = await request(app)
        .get("/jobs")
        .query({ minSalary: 200 });
    expect(resp.body).toEqual({
      jobs: [
        {
            id: expect.any(Number),
            title: "j2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1"
        },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 300,
            equity: "0",
            companyHandle: "c1",
            companyName: "C1"
        }
      ],
    });
  });

  test("works: filtering multiple filters", async () => {
    const resp = await request(app)
        .get("/jobs")
        .query({ title: "j", minSalary: 150 });
    expect(resp.body).toEqual({
      jobs: [
        {
            id: expect.any(Number),
            title: "j2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1"
        },
        {
            id: expect.any(Number),
            title: "j3",
            salary: 300,
            equity: "0",
            companyHandle: "c1",
            companyName: "C1"
        }
      ],
    });
  });


  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});  


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const resp = await request(app).get(`/jobs/${testJobIds[0].id}`);
      expect(resp.body).toEqual({
        job: {
            id: testJobIds[0].id,
            title: "j1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
            company: {
                handle: "c1",
                name: "C1",
                numEmployees: 1,
                description: "Desc1",
                logoUrl: "http://c1.img"
            }
        },
      });
    });
  
    test("not found for no such company", async function () {
      const resp = await request(app).get(`/companies/nope`);
      expect(resp.statusCode).toEqual(404);
    });
  });

  /************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for users", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0].id}`)
          .send({
            title: "j1-new",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            title: "j1-new",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
        },
      });
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0].id}`)
          .send({
            title: "j1-new",
          })
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found on no such job", async function () {
      const resp = await request(app)
          .patch(`/jobs/123456789`)
          .send({
            title: "new nope",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  
    test("bad request on id change attempt", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0].id}`)
          .send({
            id: 10,
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  
    test("bad request on invalid data", async function () {
      const resp = await request(app)
          .patch(`/jobs/${testJobIds[0].id}`)
          .send({
            salary: "should be an integer",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(400);
    });
  });  


/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for users", async function () {
      const resp = await request(app)
          .delete(`/jobs/${testJobIds[0].id}`)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.body).toEqual({ deleted: `${testJobIds[0].id}` });
    });
  
    test("unauth for anon", async function () {
      const resp = await request(app)
          .delete(`/jobs/${testJobIds[0].id}`)
          .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app)
          .delete(`/jobs/123456789`)
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(404);
    });
  });