import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const cartContext = await readFile(new URL("../app/cart-context.tsx", import.meta.url), "utf8");
const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const globalHeader = await readFile(new URL("../app/global-header.tsx", import.meta.url), "utf8");
const productDetail = await readFile(new URL("../app/producto/[slug]/product-detail-client.tsx", import.meta.url), "utf8");
const categoryCatalog = await readFile(new URL("../app/categoria/[slug]/category-catalog.tsx", import.meta.url), "utf8");
const supabaseClient = await readFile(new URL("../lib/supabase.ts", import.meta.url), "utf8");
const schema = await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("includes global storefront header and cart capabilities", () => {
  assert.match(globalHeader, /Buscar producto, marca o categoría/);
  assert.match(globalHeader, /data-global-header/);
  assert.match(globalHeader, /Envíos a todo Paraguay/);
  assert.match(cartContext, /STORAGE_KEY="nlt-cart"/);
  assert.match(cartContext, /if\(!hydrated\)return/);
  assert.match(layout, /<GlobalHeader\/>/);
  assert.match(layout, /<CartProvider>/);
  assert.doesNotMatch(page, /data-global-header/);
  assert.doesNotMatch(productDetail, /<CartButton/);
  assert.doesNotMatch(categoryCatalog, /<header>/);
  assert.match(page, /wa\.me\/595985993848/);
  assert.match(cartContext, /Math\.min\(item\.stock\|\|Infinity/);
});

test("includes protected Supabase data model and RLS", () => {
  for (const table of ["products", "categories", "brands", "product_images", "product_specs", "profiles"]) assert.match(schema, new RegExp(`create table public\\.${table}`));
  assert.match(schema, /enable row level security/g);
  assert.match(schema, /public\.is_admin\(\)/);
  assert.doesNotMatch(schema, /SUPABASE_SERVICE_ROLE_KEY|eyJ[a-zA-Z0-9_-]{30,}/);
});

test("keeps admin auth scoped to the active panel tab", () => {
  assert.match(supabaseClient, /persistSession:\s*true/);
  assert.match(supabaseClient, /window\.sessionStorage/);
  assert.match(supabaseClient, /storageKey:\s*getAdminAuthStorageKey\(\)/);
  assert.match(supabaseClient, /navigation\?\.type === "reload"/);
  assert.doesNotMatch(supabaseClient, /window\.localStorage/);
  assert.match(page, /ADMIN_PANEL_ACTIVE_KEY/);
  assert.match(page, /handleExitAdmin=async[\s\S]*await supabase\.auth\.signOut\(\)/);
  assert.match(page, /validateAdminAccess=async[\s\S]*profiles[\s\S]*role/);
});
