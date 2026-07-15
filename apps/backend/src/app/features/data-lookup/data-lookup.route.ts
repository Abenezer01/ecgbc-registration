import express from "express";

import * as DataLookupController from "./controllers/data-lookup.controller";
import * as DataLookupFilter from "./filters/data-lookup.filter";
import * as StaffAuthMiddleware from "../auth/middlewares/auth.middleware";
import { getDataLookupsQueryValidator } from "./validators/get-data-lookups-query.validator";

const router = express.Router();

router
  .route("/")
  .get(
    getDataLookupsQueryValidator,
    DataLookupFilter.getDataLookups,
    DataLookupController.getDataLookups
  )
  .post(
    StaffAuthMiddleware.verifyStaff,
    DataLookupController.createDataLookup
  );

router
  .route("/:id")
  .patch(
    StaffAuthMiddleware.verifyStaff,
    DataLookupController.updateDataLookup
  )
  .delete(
    StaffAuthMiddleware.verifyStaff,
    DataLookupController.deleteDataLookup
  );

export default router;
