import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("includes core storefront and checkout capabilities", () => {
  assert.match(page, /Buscar producto, marca o categoría/);
  assert.match(page, /nlt-cart/);
  assert.match(page, /wa\.me\/595985993848/);
  assert.match(page, /Nombre: \$\{customer\?\.nombre/);
  assert.match(page, /Respet|Math\.min\(p\.stock/);
});

test("includes protected Supabase data model and RLS", () => {
  for (const table of ["products", "categories", "brands", "product_images", "product_specs", "profiles"]) {
    assert.match(schema, new RegExp(`create table public\\.${table}`));
  }
  assert.match(schema, /enable row level security/g);
  assert.match(schema, /public\.is_admin\(\)/);
  assert.doesNotMatch(schema, /SUPABASE_SERVICE_ROLE_KEY|eyJ[a-zA-Z0-9_-]{30,}/);
});
