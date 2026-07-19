import { supabase } from "./supabase";
import type { Product } from "../app/page";

export type PreviewInput={id:string;url:string;name:string;main:boolean;file?:File;storagePath?:string};
export type ProductInput={name:string;code:string;brand:string;category:string;model:string;normalPrice:number;salePrice:number|null;stock:number;minimumStock:number;description:string;warranty:string;isActive:boolean;isFeatured:boolean;isNew:boolean;isOnSale:boolean;previews:PreviewInput[]};
const slugify=(value:string)=>value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const fail=(message:string,error?:{message:string}|null):never=>{throw new Error(error?`${message}: ${error.message}`:message)};

async function relationId(table:"categories"|"brands",name:string){
  const slug=slugify(name);
  const {data:existing,error:findError}=await supabase.from(table).select("id").eq("slug",slug).maybeSingle();
  if(findError)fail(`No se pudo consultar ${table}`,findError);
  if(existing)return existing.id;
  const payload=table==="categories"?{name,slug,description:"",sort_order:999,is_active:true}:{name,slug,is_active:true};
  const {data,error}=await supabase.from(table).insert(payload).select("id").single();
  if(error)fail(`No se pudo crear ${name}`,error);
  return data.id;
}

export async function saveProduct(current:Product|null,input:ProductInput){
  if(input.salePrice!=null&&input.salePrice>input.normalPrice)fail("El precio promocional no puede superar el precio normal");
  if(input.isOnSale&&input.salePrice==null)fail("Ingresá un precio promocional para activar la oferta");
  const [category_id,brand_id]=await Promise.all([relationId("categories",input.category),relationId("brands",input.brand)]);
  const payload={name:input.name.trim(),code:input.code.trim(),slug:slugify(input.name),model:input.model.trim()||null,description:input.description.trim(),category_id,brand_id,price:input.normalPrice,sale_price:input.salePrice,stock:input.stock,minimum_stock:input.minimumStock,is_active:input.isActive,is_featured:input.isFeatured,is_new:input.isNew,is_on_sale:input.isOnSale,warranty:input.warranty.trim()||null};
  let productId=current?.dbId;
  if(productId){const {error}=await supabase.from("products").update(payload).eq("id",productId);if(error)fail("No se pudo actualizar el producto",error)}
  else{const {data,error}=await supabase.from("products").insert(payload).select("id").single();if(error)fail("No se pudo crear el producto",error);productId=data.id}
  const existing=current?.images||[];
  const keptPaths=new Set(input.previews.filter(p=>!p.file&&p.storagePath).map(p=>p.storagePath!));
  const removed=existing.filter(x=>!keptPaths.has(x.storagePath)&&!x.storagePath.startsWith("demo/")&&!x.storagePath.startsWith("external/"));
  if(removed.length){const {error}=await supabase.storage.from("product-images").remove(removed.map(x=>x.storagePath));if(error)fail("No se pudieron eliminar imágenes anteriores",error)}
  const uploaded:PreviewInput[]=[];
  for(const preview of input.previews){
    if(!preview.file){uploaded.push(preview);continue}
    if(preview.file.size>2*1024*1024)fail(`${preview.name} supera el límite de 2 MB`);
    const ext=preview.file.name.split(".").pop()?.toLowerCase()||"jpg";
    const path=`${productId}/${crypto.randomUUID()}.${ext}`;
    const {error}=await supabase.storage.from("product-images").upload(path,preview.file,{contentType:preview.file.type,upsert:false});
    if(error)fail(`No se pudo subir ${preview.name}`,error);
    const {data}=supabase.storage.from("product-images").getPublicUrl(path);
    uploaded.push({...preview,storagePath:path,url:data.publicUrl});
  }
  const {error:deleteRows}=await supabase.from("product_images").delete().eq("product_id",productId);if(deleteRows)fail("No se pudo actualizar la galería",deleteRows);
  if(uploaded.length){const rows=uploaded.map((p,index)=>({product_id:productId,storage_path:p.storagePath||`external/${productId}/${index}`,public_url:p.url,alt_text:input.name,sort_order:index,is_primary:p.main||(!uploaded.some(x=>x.main)&&index===0)}));const {error}=await supabase.from("product_images").insert(rows);if(error)fail("No se pudo guardar la galería",error)}
  return productId;
}

export async function deleteProduct(product:Product){
  if(!product.dbId)fail("Este producto pertenece al respaldo demo y no existe en Supabase");
  const {error}=await supabase.from("products").update({is_active:false,deleted_at:new Date().toISOString()}).eq("id",product.dbId);
  if(error)fail("No se pudo archivar el producto",error);
}
