import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../../config/error.config";
import { IFilter } from "../../../shared/interfaces/filter.interface";

export const getDataLookups = catchAsync(
  async (req: Request, _: Response, next: NextFunction) => {
    const query = req.query || {};
    let filter: IFilter = {};
console.log(`query`,query);

    for (const key in query) {
      filter = {
        ...filter,
        [key]: query[key],
      };
    }
    if (Object.keys(filter).length > 0) {
      req.filters = filter;
    } else {
      req.filters = {};
    }
    next();
  }
);
