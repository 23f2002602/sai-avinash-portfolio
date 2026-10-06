import test from "node:test";
import assert from "node:assert/strict";
import { projectWalkthroughs } from "../lib/project-walkthroughs";
import { projects } from "../lib/content";

test("every project has three factual walkthrough stages", () => {
  assert.equal(projectWalkthroughs.length, projects.length);
  for (const steps of projectWalkthroughs) {
    assert.equal(steps.length, 3);
    assert.ok(steps.every(step => step.length > 30));
  }
  assert.match(projectWalkthroughs[2][2], /simulated authentication, not real checkout/);
  assert.match(projectWalkthroughs[3][1], /not a production service/);
});
