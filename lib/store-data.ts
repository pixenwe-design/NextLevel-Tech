import { supabase } from "./supabase";
import type { Product } from "../app/page";

type ProductRow = {
  id: string;
  name: string;
  code: string;
  slug: string;
  model: string | null;
  description: string;
  price: number;
  sale_price: number | null;
  stock: number;
  minimum_stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  warranty: string | null;
  created_at: string;
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  images: Array<{ id:string; storage_path:string; public_url: string; is_primary: boolean; sort_order: number }>;
  specs: Array<{ name: string; value: string; sort_order: number }>;
};

const numericId = (uuid: string) =>
  uuid.split("").reduce((total, char) => ((total * 31 + char.charCodeAt(0)) >>> 0), 7);

const saleIsActive = (row: ProductRow) => {
  if (!row.is_on_sale || row.sale_price == null) return false;
  const now = Date.now();
  return (!row.sale_starts_at || new Date(row.sale_starts_at).getTime() <= now)
    && (!row.sale_ends_at || new Date(row.sale_ends_at).getTime() > now);
};

export async function fetchStoreProducts(includeInactive = false): Promise<Product[]> {
  let query = supabase
    .from("products")
    .select(`
      id,name,code,slug,model,description,price,sale_price,stock,minimum_stock,
      is_active,is_featured,is_new,is_on_sale,sale_starts_at,sale_ends_at,
      warranty,created_at,
      category:categories(name,slug),
      brand:brands(name,slug),
      images:product_images(id,storage_path,public_url,is_primary,sort_order),
      specs:product_specs(name,value,sort_order)
    `)
    .order("created_at", { ascending: false });

  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as ProductRow[]).map((row) => {
    const images = [...(row.images || [])].sort((a, b) =>
      Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order
    );
    const onSale = saleIsActive(row);
    return {
      id: numericId(row.id),
      dbId: row.id,
      code: row.code,
      slug: row.slug,
      name: row.name,
      model: row.model || undefined,
      brand: row.brand?.name || "Sin marca",
      category: row.category?.name || "Sin categoría",
      price: onSale ? Number(row.sale_price) : Number(row.price),
      oldPrice: onSale ? Number(row.price) : undefined,
      stock: row.stock,
      minimumStock: row.minimum_stock,
      image: images[0]?.public_url || "/file.svg",
      gallery: images.map((image) => image.public_url),
      images: images.map(image=>({id:image.id,storagePath:image.storage_path,url:image.public_url,isPrimary:image.is_primary,sortOrder:image.sort_order})),
      featured: row.is_featured,
      isNew: row.is_new,
      isActive: row.is_active,
      description: row.description,
      specs: Object.fromEntries(
        [...(row.specs || [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((spec) => [spec.name, spec.value])
      ),
      warranty: row.warranty || "Consultar",
      createdAt: row.created_at,
    };
  });
}

export function subscribeToCatalog(onChange:()=>void){
  const channel=supabase.channel(`catalog-${crypto.randomUUID()}`)
    .on("postgres_changes",{event:"*",schema:"public",table:"products"},onChange)
    .on("postgres_changes",{event:"*",schema:"public",table:"product_images"},onChange)
    .on("postgres_changes",{event:"*",schema:"public",table:"product_specs"},onChange)
    .subscribe();
  return ()=>{void supabase.removeChannel(channel)};
}
