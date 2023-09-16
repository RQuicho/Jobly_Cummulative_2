"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterShcema = require("../schemas/jobFilter.json");
const { underline } = require("colors");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: login
 */

router.post("/", ensureAdmin, async (req, res, next) => {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
    
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
      } catch (err) {
        return next(err);
      }    
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle,              companyName }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity 
 *
 * Authorization required: none
 */

router.get("/", async (req, res, next) => {
    const q = req.query;

    // convert string to integer
    if (q.minSalary !== undefined) {
        q.minSalary = +q.minSalary;
    }

    try {
        const validator = jsonschema.validate(q, jobFilterShcema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
        const jobs = await Job.findAll(q);
        return res.json({jobs});
    } catch(e) {
        return next(e);
    }
});


/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle,              companyName }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { id, title, salary, equity, companyHandle,              companyName }
 *
 * Returns { id, title, salary, equity, companyHandle,              companyName }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
      await Job.delete(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  });
  


module.exports = router;