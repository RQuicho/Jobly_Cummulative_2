const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/** Helper function that updates existing data
 *
 * dataToUpdate => {firstName: 'Aliya', age: 32, ...}
 * jsToSql => js data to sql. {firstName: "first_name", age: "age"}
 * 
 * returns: {jsToSql, dataToUpdate}
 * {firstName: 'Aliya', age: 32} => 
 *    {setCols: 'first_name"=$1, "age"=$2',
 *     values: ['Aliya', 32]}
 *
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
