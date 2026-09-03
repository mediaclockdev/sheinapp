// Run: node src/lib/auth.test.js
import assert from "node:assert";

const store = {};
globalThis.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => (store[k] = v),
};

const { getRole, isAdmin, landingPath } = await import("./auth.js");

const set = (v) => (store.user = v);

set(null);
assert.equal(getRole(), null, "no user -> no role");
assert.equal(isAdmin(), false);

set("not json{");
assert.equal(getRole(), null, "corrupt user -> no role, no throw");

set(JSON.stringify({ id: 1, name: "A" }));
assert.equal(getRole(), null, "user without role -> no role");
assert.equal(isAdmin(), false);

set(JSON.stringify({ id: 1, name: "A", role: "agent" }));
assert.equal(isAdmin(), false, "agent is not admin");

set(JSON.stringify({ id: 1, name: "A", role: "Admin" }));
assert.equal(isAdmin(), true, "role match is case-insensitive");

assert.equal(landingPath(), "/admin", "admin lands on admin panel");

set(JSON.stringify({ role: "agent" }));
assert.equal(landingPath(), "/dashboard", "agent lands on dashboard");

console.log("auth ok");
