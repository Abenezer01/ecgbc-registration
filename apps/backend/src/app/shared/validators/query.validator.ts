import { query } from 'express-validator';

const validateAbstractQuery = [
  query('_page')
    .optional()
    .isInt({ min: 1 }).withMessage('_page must be a positive integer')
    .toInt(), 
  query('_limit')
    .optional()
    .isInt({ min: 1 }).withMessage('_limit must be a positive integer')
    .toInt(), 
  query('_search')
    .optional()
    .isString().withMessage('_search must be a string')
];

export default validateAbstractQuery;
