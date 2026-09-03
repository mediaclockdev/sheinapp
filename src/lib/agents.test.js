// Run: node src/lib/agents.test.js
import assert from "node:assert";
import { filterAgents } from "./agents.js";

const rows = [
  { id: 1, region: "Beirut Central", status: "VERIFIED", rating: 4.9 },
  { id: 2, region: "Tripoli North", status: "PENDING", rating: null },
  { id: 3, region: "Sidon South", status: "SUSPENDED", rating: 2.4 },
  { id: 4, region: "Beirut Central", status: "VERIFIED", rating: 4.8 },
];
const ids = (o) => filterAgents(rows, o).map((a) => a.id);

assert.deepEqual(ids(), [1, 2, 3, 4], "no filters -> everything");
assert.deepEqual(ids({ region: "All", status: "All", minRating: 0 }), [1, 2, 3, 4]);
assert.deepEqual(ids({ region: "Beirut Central" }), [1, 4]);
assert.deepEqual(ids({ status: "PENDING" }), [2]);
assert.deepEqual(ids({ minRating: 4 }), [1, 4], "unrated must not pass minRating (null >= 4 is true in JS)");
assert.deepEqual(ids({ minRating: 1 }), [1, 2, 3, 4], "floor value 1 = no minimum, unrated stay visible");
assert.deepEqual(ids({ minRating: 2 }), [1, 3, 4], "above the floor, unrated drop out");
assert.deepEqual(ids({ region: "Beirut Central", status: "VERIFIED", minRating: 4.85 }), [1]);
assert.deepEqual(ids({ region: "Nowhere" }), [], "no matches -> empty");

console.log("agents ok");
