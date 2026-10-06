import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { characterAssets, characterDimensions, type CharacterPose } from "../lib/character-assets";
import { coffeeAssets, interestAssets, interestAssetsReady, musicAssets, themedAssetsReady, type CoffeeStage, type InterestAssetKey, type RasterAsset } from "../lib/themed-assets";
import { projects } from "../lib/content";

const stages: readonly CoffeeStage[] = ["beans", "grind", "brew", "milk", "stir", "enjoy"];

test("typed theme maps declare six square props and preserve character portrait dimensions", () => {
  const coffee: Readonly<Record<CoffeeStage, RasterAsset>> = coffeeAssets;
  const music: Readonly<Record<"headphones" | "tuningDial", RasterAsset>> = musicAssets;
  assert.deepEqual(Object.keys(coffee), stages);
  assert.deepEqual(Object.keys(music), ["headphones", "tuningDial"]);
  assert.equal(typeof themedAssetsReady, "boolean");
  assert.deepEqual(music.headphones, { src: "/theme-3d/headphones.webp", width: 2048, height: 2048 });
  assert.deepEqual(music.tuningDial, { src: "/theme-3d/tuning-dial.webp", width: 2048, height: 2048 });
  for (const stage of ["beans", "brew", "milk", "stir"] as const) {
    assert.deepEqual(coffee[stage], { src: `/theme-3d/${stage}.webp`, width: 2048, height: 2048 });
  }
  assert.deepEqual(coffee.grind, { src: characterAssets.grind, ...characterDimensions });
  assert.deepEqual(coffee.enjoy, { src: characterAssets.coffee, ...characterDimensions });
  assert.deepEqual(characterDimensions, { width: 1536, height: 2048 });
  const props = [...Object.values(music), ...Object.values(coffee).filter(asset => asset.src.startsWith("/theme-3d/"))];
  assert.equal(new Set(props.map(asset => asset.src)).size, 6);
  for (const asset of [...Object.values(music), ...Object.values(coffee)]) {
    assert.ok(Number.isSafeInteger(asset.width) && asset.width > 0);
    assert.ok(Number.isSafeInteger(asset.height) && asset.height > 0);
    assert.match(asset.src, /^\/(theme-3d|avinash-3d)\/[a-z-]+\.webp$/);
  }
});

test("all seven original character paths remain available regardless of prop readiness", () => {
  const expected: readonly CharacterPose[] = ["wave", "hold", "open", "sip", "enjoy", "grind", "coffee"];
  assert.deepEqual(Object.keys(characterAssets), expected);
  for (const pose of expected) assert.equal(characterAssets[pose], `/avinash-3d/${pose}.webp`);
  assert.equal(new Set(Object.values(characterAssets)).size, 7);
});

test("the polymath orbit declares eleven independent 4K raster masters", () => {
  const names: readonly InterestAssetKey[] = ["tech", "business", "editing", "design", "photo", "video", "writing", "cooking", "travel", "finance", "economics"];
  assert.equal(typeof interestAssetsReady, "boolean");
  assert.deepEqual(Object.keys(interestAssets), names);
  assert.equal(new Set(Object.values(interestAssets).map(asset => asset.src)).size, names.length);
  for (const name of names) {
    assert.deepEqual(interestAssets[name], { src: `/interests-3d/${name}.webp`, width: 3840, height: 2160 });
  }
});

test("four projects include Team185 as project three with accurate marketplace metadata", () => {
  assert.deepEqual(projects.map(project => project.title), ["InternAssess", "PlaceMe", "Team185 — Odoo Hackathon", "Crop Advisory"]);
  assert.deepEqual(projects.map(project => project.number), ["01", "02", "03", "04"]);
  const marketplace = projects[2];
  assert.equal(marketplace.href, "https://github.com/23f2002602/Team185");
  assert.match(marketplace.eyebrow, /Web app.*Odoo Hackathon/);
  assert.deepEqual(marketplace.tags, ["Next.js", "TypeScript", "Tailwind CSS", "Hackathon"]);
  for (const phrase of ["second-hand marketplace", "Team185", "Odoo Hackathon", "searchable listings", "listing management", "category filters", "shopping cart"]) {
    assert.ok(marketplace.description.includes(phrase), `Team185 description includes ${phrase}`);
  }
  assert.doesNotMatch(JSON.stringify(projects), /Gyaan/i);
});

// Details are private to ProjectGallery. Read only that literal via the TS parser;
// importing the client component would also load CSS and require a DOM.
function galleryDetails() {
  const filename = resolve(__dirname, "../components/project-gallery.tsx");
  const source = ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = source.statements.filter(ts.isVariableStatement).flatMap(statement => [...statement.declarationList.declarations]);
  const declaration = declarations.find(node => ts.isIdentifier(node.name) && node.name.text === "details");
  assert.ok(declaration?.initializer, "project details literal exists");
  let initializer = declaration.initializer;
  while (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer)) initializer = initializer.expression;
  assert.ok(ts.isArrayLiteralExpression(initializer), "project details are an array literal");
  return initializer.elements.map(element => {
    assert.ok(ts.isObjectLiteralExpression(element), "each project detail is an object literal");
    const detail: Record<string, string | string[]> = {};
    for (const property of element.properties) {
      assert.ok(ts.isPropertyAssignment(property));
      assert.ok(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name));
      if (ts.isStringLiteral(property.initializer)) detail[property.name.text] = property.initializer.text;
      else if (ts.isArrayLiteralExpression(property.initializer)) detail[property.name.text] = property.initializer.elements.map(item => {
        assert.ok(ts.isStringLiteral(item));
        return item.text;
      });
    }
    return detail;
  });
}

test("Team185 dialog describes listings, rupee prices, cart totals and prototype limitations", () => {
  const details = galleryDetails();
  assert.equal(details.length, projects.length);
  assert.deepEqual(details.map(detail => detail.category), ["AI", "Full stack", "Web apps", "AI"]);
  const marketplace = details[2];
  assert.deepEqual(marketplace.steps, ["Create a listing", "Search & filter", "Add to cart"]);
  assert.equal(typeof marketplace.text, "string");
  const description = marketplace.text as string;
  for (const phrase of ["Team185", "second-hand marketplace", "Odoo Hackathon", "create, edit, and delete listings", "images", "descriptions", "categories", "rupee prices", "search by keyword", "filter by category", "running total", "local storage", "simulated authentication"]) {
    assert.ok(description.includes(phrase), `Team185 dialog includes ${phrase}`);
  }
  assert.doesNotMatch(JSON.stringify(details), /Gyaan/i);
});
