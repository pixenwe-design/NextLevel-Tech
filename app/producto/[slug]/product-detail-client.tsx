"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,ChevronRight,CreditCard,Home,PackageCheck,ShieldCheck,ShoppingCart,Truck} from "lucide-react";
import {FaWhatsapp} from "react-icons/fa6";
import {demoProducts,gs,type Product} from "../../page";
import {fetchMainCategories,fetchStoreProducts,mainCategoryName,subscribeToCatalog,type MainCategory} from "../../../lib/store-data";

const identity=(product:Product)=>product.dbId||String(product.id);
const productSlug=(product:Product)=>product.slug||product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export default function ProductDetail({slug}:{slug:string}){
 const [products,setProducts]=useState<Product[]>([]);
 const [mainCategories,setMainCategories]=useState<MainCategory[]>([]);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;const reload=()=>fetchStoreProducts().then(data=>{if(active){setProducts(data.length?data:demoProducts);setLoading(false)}}).catch(()=>{if(active){setProducts(demoProducts);setLoading(false)}});reload();const unsubscribe=subscribeToCatalog(reload);return()=>{active=false;unsubscribe()}},[]);
 useEffect(()=>{let active=true;fetchMainCategories().then(data=>{if(active)setMainCategories(data)}).catch(error=>console.error("Supabase categories:",error));return()=>{active=false}},[]);
 const product=products.find(item=>productSlug(item)===slug);
 const related=useMemo(()=>{if(!product)return[];const category=mainCategoryName(product.category,mainCategories);const candidates=[...products.filter(item=>mainCategoryName(item.category,mainCategories)===category),...products.filter(item=>mainCategoryName(item.category,mainCategories)!==category)];const seen=new Set<string>([identity(product)]);return candidates.filter(item=>{const id=identity(item);if(seen.has(id))return false;seen.add(id);return item.isActive!==false}).slice(0,4)},[product,products,mainCategories]);
 if(loading)return <main className="detail section"><div className="empty"><b>Cargando producto…</b></div></main>;
 if(!product)return <main className="detail section"><div className="empty"><b>Producto no encontrado</b><p>El producto solicitado no existe o ya no está disponible.</p><Link className="primary" href="/">Volver a la tienda</Link></div></main>;
 const whatsapp=()=>window.open(`https://wa.me/595985993848?text=${encodeURIComponent(`Hola NextLevel Tech, quiero comprar:\n• ${product.name} — ${gs(product.price)}`)}`,"_blank");
 const mobileCategory=mainCategoryName(product.category,mainCategories);

 return <>
  <div className="productHeaderSection">
  <div className="mobileProductHeaderNav">
   <Link className="mobileProductBack" href="/"><ArrowLeft/> Volver</Link>
   <nav aria-label="Ruta de navegación resumida">
    <Link href="/">Productos</Link><ChevronRight/><span>{mobileCategory}</span>
   </nav>
  </div>
  <section className="productHero productHeader">
   <div className="productHeroGrid"/>
   <div className="productHeaderBeam"/>
   <div className="productHeaderCircuits"><i/><i/><i/><i/></div>
   <div className="productHeroInner">
    <div className="productHeaderCopy">
     <Link className="headerBackLink" href="/"><ArrowLeft/> Volver al catálogo</Link>
     <span className="productHeroLabel">NEXTLEVEL TECH</span>
     <h2>Tecnología que impulsa<br/>tu <span>rendimiento</span></h2>
     <p>Componentes, equipos y accesorios seleccionados para crear un setup más potente.</p>
     <nav className="productBreadcrumb" aria-label="Ruta de navegación">
      <Link className="breadcrumbPill" href="/"><Home/> Inicio</Link><ChevronRight className="breadcrumbSeparator"/>
      <Link className="breadcrumbPill" href="/">Productos</Link><ChevronRight className="breadcrumbSeparator"/>
      <span className="breadcrumbPill">{product.category}</span><ChevronRight className="breadcrumbSeparator"/>
      <b className="breadcrumbCurrent">{product.name}</b>
     </nav>
    </div>
    <div className="productHeaderRight">
     <div className="productHeaderVisual" aria-hidden="true">
      <div className="headerProductHalo"/>
      <div className="headerProductFrame"><span>NL / SELECTED HARDWARE</span><img src={product.image} alt=""/></div>
      <div className="headerTechTag"><i/><span>PERFORMANCE<br/><b>READY</b></span></div>
     </div>
     <div className="productHeaderBenefits"><article><span><Truck/></span><div><b>Envíos a todo Paraguay</b><small>Rápidos y seguros</small></div></article><article><span><ShieldCheck/></span><div><b>Garantía oficial</b><small>Respaldo asegurado</small></div></article><article><span><CreditCard/></span><div><b>Compra segura</b><small>Pagos protegidos</small></div></article></div>
    </div>
   </div>
  </section>
  </div>
  <main className="detail section">
   <div className="detailGrid">
    <div className="gallery"><img src={product.image} alt={product.name}/><div>{(product.gallery?.length?product.gallery:[product.image]).map((image,index)=><button key={`${image}-${index}`}><img src={image} alt={`Vista ${index+1} de ${product.name}`}/></button>)}</div></div>
    <div className="info"><span className="stock"><PackageCheck/>{product.stock>0?`Disponible · ${product.stock} unidades`:"Agotado"}</span><p className="brand">{product.brand} / {product.category}</p><h1>{product.name}</h1><div className="price">{gs(product.price)} {product.oldPrice&&<><del>{gs(product.oldPrice)}</del><em>-{Math.round((1-product.price/product.oldPrice)*100)}%</em></>}</div><p>{product.description}</p><button className="primary wide" disabled={!product.stock}><ShoppingCart/> Agregar al carrito</button><button className="wa wide" onClick={whatsapp}><FaWhatsapp/> Comprar por WhatsApp</button><div className="micro"><span><ShieldCheck/><b>Garantía local</b><small>{product.warranty}</small></span><span><Truck/><b>Delivery nacional</b><small>A todo Paraguay</small></span><span><CreditCard/><b>Pago flexible</b><small>Consultá opciones</small></span></div></div>
   </div>
   <div className="specBlock"><div><span className="eyebrow">DETALLES DEL PRODUCTO</span><h2>Especificaciones técnicas</h2><p>{product.description}</p></div><dl>{Object.entries(product.specs).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></div>
   <div className="sectionHead"><div><span className="eyebrow">TAMBIÉN TE PUEDE INTERESAR</span><h2>Productos relacionados</h2></div></div>
   <div className="products related">{related.map(item=><article className="product" key={identity(item)}><div className="pic"><img src={item.image} alt={item.name}/></div><div className="pcopy"><span className="pbrand">{item.brand} · {item.category}</span><h3><Link href={`/producto/${productSlug(item)}`}>{item.name}</Link></h3><span className="instock"><PackageCheck/>{item.stock?`${item.stock} disponibles`:"Agotado"}</span><div className="pprice"><b>{gs(item.price)}</b>{item.oldPrice&&<del>{gs(item.oldPrice)}</del>}</div><div className="actions"><Link href={`/producto/${productSlug(item)}`}>Ver detalles <ArrowRight/></Link></div></div></article>)}</div>
  </main>
 </>
}
