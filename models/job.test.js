"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New",
    salary: 100000,
    equity: "0.5",
    company_handle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
      {
        id: testJobIds[1],
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c1"
      },
      {
        id: testJobIds[2],
        title: "j3",
        salary: 300,
        equity: "0",
        companyHandle: "c1"
      }
    ]);
  });
  test("works: filter by title", async function () {
    let jobs = await Job.findAll({title: "1"});
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      }
    ]);
  });
  test("works: filter by minSalary", async function () {
    let jobs = await Job.findAll({minSalary: 250});
    expect(jobs).toEqual([
      {
        id: testJobIds[2],
        title: "j3",
        salary: 300,
        equity: "0",
        companyHandle: "c1"
      }
    ]);
  });
  test("works: filter by maxSalary", async function () {
    let jobs = await Job.findAll({maxSalary: 250});
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
      {
        id: testJobIds[1],
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c1"
      }
    ]);
  });
  test("works: filter by equity", async function () {
    let jobs = await Job.findAll({hasEquity: true});
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "j1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1"
      },
      {
        id: testJobIds[1],
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c1"
      }
    ]);
  });
  test("works: filter by salary and equity", async function () {
    let jobs = await Job.findAll({minSalary: 150, hasEquity: true});
    expect(jobs).toEqual([
      {
        id: testJobIds[1],
        title: "j2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c1"
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let jobs = await Job.get(testJobIds[0]);
    expect(jobs).toEqual({
      id: testJobIds[0],
      title: "j1",
      salary: 100,
      equity: "0.1",
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 400,
    equity: "0.4"
  };

  test("works", async function () {
    let job = await Job.update(testJobIds[0], updateData);
    expect(job).toEqual({
      id: testJobIds[0],
      companyHandle: "c1",
      ...updateData,
    });
  });

  test("not found if no such job", async function () {
      try {
        await Job.update(0, {title: "test"});
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });  
    
  test("bad request if no data", async function () {
      try {
        await Job.update(testJobIds[0], {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    }); 
});

/************************************** remove */

describe("delete", function () {
  test("works", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [testJobIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
