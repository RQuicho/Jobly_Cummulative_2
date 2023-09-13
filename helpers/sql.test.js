const { sqlForPartialUpdate } = require("./sql");


describe("sqlForPartialUpdate", () => {
    test("works: updating 1 parameter ", () => {
        const result = sqlForPartialUpdate(
            {firstName: "Alyssa"},
            {firstName: "firstName", age: "age"});
        expect(result).toEqual({
            setCols: "\"firstName\"=$1",
            values: ["Alyssa"]
        });
    });
    test("works: updating 2 parameters ", () => {
        const result = sqlForPartialUpdate(
            {firstName: "Alyssa", age: 35},
            {age: "age"});
        expect(result).toEqual({
            setCols: "\"firstName\"=$1, \"age\"=$2",
            values: ["Alyssa", 35]
        });
    });
});