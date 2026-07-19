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

async function purgeControlledTestProducts(){
  const found=await supabase.from("products").select("id,code,product_images(storage_path)").like("code","PRUEBA-CODEX%");
  if(found.error)fail("No se pudieron localizar residuos temporales",found.error);
  for(const product of found.data){
    const paths=product.product_images.map(image=>image.storage_path).filter(path=>path.startsWith(`${product.id}/`)&&!path.includes("?copy="));
    if(paths.length){const removed=await supabase.storage.from("product-images").remove(paths);if(removed.error)fail(`No se pudieron borrar imágenes de ${product.code}`,removed.error)}
    const purged=await supabase.rpc("purge_test_product",{target_product_id:product.id});if(purged.error)fail(`No se pudo limpiar ${product.code}`,purged.error);
  }
}

async function makeTestImage(){
  const canvas=document.createElement("canvas");canvas.width=640;canvas.height=400;
  const context=canvas.getContext("2d");if(!context)fail("No se pudo generar la imagen de prueba");
  context.fillStyle="#111827";context.fillRect(0,0,640,400);context.fillStyle="#22c55e";context.font="bold 42px sans-serif";context.fillText("PRUEBA CODEX",145,190);context.fillStyle="#ffffff";context.font="24px sans-serif";context.fillText("NextLevel Tech · temporal",165,235);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)fail("No se pudo crear el archivo PNG de prueba");
  return new File([blob],"prueba-codex.png",{type:"image/png"});
}

export async function runControlledAdminTest(){
  let stage="limpieza inicial";
  await purgeControlledTestProducts();
  stage="registro del catálogo inicial";
  const {data:before,error:beforeError}=await supabase.from("products").select("id,code").order("id");
  if(beforeError)fail("No se pudo registrar el catálogo inicial",beforeError);
  if(before.length!==15||before.some(p=>p.code.startsWith("PRUEBA-CODEX")))fail("El catálogo inicial no contiene exactamente los 15 productos esperados");
  const originalIds=before.map(p=>p.id).sort();let sourceId:string|undefined;let copyId:string|undefined;
  try{
    stage="generación de imagen";
    const image=await makeTestImage();
    const base:ProductInput={name:"Producto temporal Codex",code:"PRUEBA-CODEX-001",brand:"NextLevel",category:"Accesorios",model:"TEST-001",normalPrice:100000,salePrice:null,stock:2,minimumStock:1,description:"Registro temporal para validación controlada.",warranty:"Sin garantía",isActive:false,isFeatured:false,isNew:false,isOnSale:false,previews:[{id:crypto.randomUUID(),url:URL.createObjectURL(image),name:image.name,main:true,file:image}]};
    stage="creación";sourceId=await saveProduct(null,base);
    const created=await supabase.from("products").select("id,code,stock").eq("id",sourceId).single();if(created.error||created.data.code!=="PRUEBA-CODEX-001")fail("Falló la verificación de creación",created.error);
    const imageRows=await supabase.from("product_images").select("id,storage_path,public_url").eq("product_id",sourceId);if(imageRows.error||imageRows.data.length!==1)fail("Falló la verificación de imagen",imageRows.error);
    const stored=imageRows.data[0];const sourceProduct:Product={id:0,dbId:sourceId,name:base.name,brand:base.brand,category:base.category,price:base.normalPrice,stock:base.stock,image:stored.public_url,description:base.description,specs:{},warranty:base.warranty,images:[{id:stored.id,storagePath:stored.storage_path,url:stored.public_url,isPrimary:true,sortOrder:0}]};
    stage="edición, stock y descuento";await saveProduct(sourceProduct,{...base,name:"Producto temporal Codex editado",stock:7,normalPrice:120000,salePrice:99000,isOnSale:true,previews:[{id:stored.id,url:stored.public_url,name:"prueba-codex.png",main:true,storagePath:stored.storage_path}]});
    const edited=await supabase.from("products").select("name,stock,price,sale_price,is_on_sale").eq("id",sourceId).single();if(edited.error||edited.data.name!=="Producto temporal Codex editado"||edited.data.stock!==7||Number(edited.data.sale_price)!==99000)fail("Falló la verificación de edición, stock o descuento",edited.error);
    stage="duplicación";const duplicate=await supabase.rpc("duplicate_product",{source_product_id:sourceId});if(duplicate.error)fail("Falló la duplicación",duplicate.error);copyId=duplicate.data;
    const copied=await supabase.from("products").select("id,code").eq("id",copyId).single();if(copied.error||!copied.data.code.startsWith("PRUEBA-CODEX-001-"))fail("Falló la verificación del duplicado",copied.error);
    stage="limpieza final";await purgeControlledTestProducts();
    const {data:after,error:afterError}=await supabase.from("products").select("id,code").order("id");if(afterError)fail("No se pudo verificar la limpieza",afterError);
    if(after.some(p=>p.code.startsWith("PRUEBA-CODEX"))||JSON.stringify(after.map(p=>p.id).sort())!==JSON.stringify(originalIds))fail("La limpieza final no coincide con el catálogo inicial");
    const listed=await supabase.storage.from("product-images").list(sourceId);if(listed.error||listed.data.length)fail("Quedaron imágenes de prueba",listed.error);
    const report={email:(await supabase.auth.getUser()).data.user?.email,login:true,admin_role:true,created:true,edited:true,stock_changed:true,image_uploaded:true,duplicated:true,deleted:true,original_products_before:before.length,original_products_after:after.length,test_products_after:0,test_images_after:0,completed_at:new Date().toISOString()};
    const saved=await supabase.from("store_settings").upsert({setting_key:"codex_admin_e2e_result",setting_value:report,is_public:false},{onConflict:"setting_key"});if(saved.error)fail("La prueba terminó, pero no se pudo guardar el comprobante",saved.error);
    return report;
  }catch(error){
    await purgeControlledTestProducts().catch(()=>undefined);
    throw new Error(`Etapa "${stage}" falló: ${error instanceof Error?error.message:"error desconocido"}`);
  }
}
