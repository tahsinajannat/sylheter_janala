/**
 * Validate request parts with zod. Parsed (and coerced) values are placed on
 * `req.valid` because Express 5 makes `req.query` read-only.
 *
 *   router.get('/', validate({ query: schema }), (req, res) => { req.valid.query ... })
 */
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  for (const part of ['params', 'query', 'body']) {
    if (schemas[part]) req.valid[part] = schemas[part].parse(req[part] ?? {});
  }
  next();
};
