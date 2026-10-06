import test from "node:test";
import assert from "node:assert/strict";
import { coffeeActions, interestActions } from "../lib/object-actions";
import { interestAssets } from "../lib/themed-assets";

test("every interest has a meaningful action and an existing chapter destination", () => {
  assert.deepEqual(Object.keys(interestActions), Object.keys(interestAssets));
  const destinations = new Set(["#work", "#experience", "#reels", "#about", "#coffee"]);
  for (const action of Object.values(interestActions)) {
    assert.ok(destinations.has(action.href));
    assert.ok(action.label.length > 10);
    assert.ok(action.motion.length > 0);
  }
});

test("all six coffee stages describe their own replay action", () => {
  assert.equal(coffeeActions.length, 6);
  assert.equal(new Set(coffeeActions).size, 6);
  assert.match(coffeeActions[2], /water/);
  assert.match(coffeeActions[3], /milk/);
  assert.match(coffeeActions[4], /Stir/);
});
