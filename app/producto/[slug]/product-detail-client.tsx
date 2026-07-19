"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,ChevronLeft,ChevronRight,CreditCard,PackageCheck,ShieldCheck,ShoppingCart,Truck} from "lucide-react";
import {FaWhatsapp} from "react-icons/fa6";
import {demoProducts,gs,type Product} from "../../page";
import {fetchStoreProducts,subscribeToCatalog} from "../../../lib/store-data";

const identity=(product:Product)=>product.dbId||String(product.id);
const productSlug=(product:Product)=>product.slug||product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export default function ProductDetail({slug}:{slug:string}){
 const [products,setProducts]=useState<Product[]>([]);
 const [loading,setLoading]=useState(true);
 const [selectedImage,setSelectedImage]=useState(0);
 useEffect(()=>{let active=true;const reload=()=>fetchStoreProducts().then(data=>{if(active){setProducts(data.length?data:demoProducts);setLoading(false)}}).catch(()=>{if(active){setProducts(demoProducts);setLoading(false)}});reload();const unsubscribe=subscribeToCatalog(reload);return()=>{active=false;unsubscribe()}},[]);
 const product=products.find(item=>productSlug(item)===slug);
 const images=useMemo(()=>product?(product.gallery?.length?product.gallery:[product.image]):[],[product]);
 const activeImage=images[selectedImage]?selectedImage:0;
 const related=useMemo(()=>{if(!product)return[];const candidates=[...products.filter(item=>item.category===product.category),...products.filter(item=>item.category!==product.category)];const seen=new Set<string>([identity(product)]);return candidates.filter(item=>{const id=identity(item);if(seen.has(id))return false;seen.add(id);return item.isActive!==false}).slice(0,4)},[product,products]);
 if(loading)return <main className="detail section"><div className="empty"><b>Cargando producto…</b></div></main>;
 if(!product)return <main className="detail section"><div className="empty"><b>Producto no encontrado</b><p>El producto solicitado no existe o ya no está disponible.</p><Link className="primary" href="/">Volver a la tienda</Link></div></main>;
 const whatsapp=()=>window.open(`https://wa.me/595985993848?text=${encodeURIComponent(`Hola NextLevel Tech, quiero comprar:\n• ${product.name} — ${gs(product.price)}`)}`,"_blank");
 const selectImage=(direction:number)=>setSelectedImage(current=>(current+direction+images.length)%images.length);
 const categoryTone=product.category.toLowerCase().replace(/[^a-z]+/g,"-");

 return <>
  <section className={`productShowcase tone-${categoryTone}`}>
   <div className="showcaseGrid"/>
   <div className="showcaseLight showcaseLightOne"/>
   <div className="showcaseLight showcaseLightTwo"/>
   <div className="showcaseInner">
    <div className="showcaseMedia">
     <div className="mediaStage">
      <div className="productAura"/>
      <img src={images[activeImage]||product.image} alt={product.name}/>
      {images.length>1&&<div className="galleryControls"><button onClick={()=>selectImage(-1)} aria-label="Imagen anterior"><ChevronLeft/></button><span>{activeImage+1} / {images.length}</span><button onClick={()=>selectImage(1)} aria-label="Imagen siguiente"><ChevronRight/></button></div>}
     </div>
     <div className="showcaseThumbs" aria-label="Imágenes del producto">{images.map((image,index)=><button className={activeImage===index?"active":""} key={`${image}-${index}`} onClick={()=>setSelectedImage(index)} aria-label={`Ver imagen ${index+1}`} aria-current={activeImage===index}><img src={image} alt=""/></button>)}</div>
    </div>
    <div className="showcaseInfo">
     <nav className="showcaseBreadcrumb" aria-label="Ruta de navegación"><Link href="/"><ArrowLeft/> Volver al catálogo</Link><i>/</i><span>{product.category}</span><i>/</i><b>Producto</b></nav>
     <div className="showcaseBadges"><span className={product.stock?"available":"unavailable"}><PackageCheck/>{product.stock?"En stock":"Agotado"}</span>{product.oldPrice&&<span className="sale">Oferta · {Math.round((1-product.price/product.oldPrice)*100)}% OFF</span>}{product.isNew&&<span className="newProductBadge">Nuevo</span>}</div>
     <p className="showcaseBrand">{product.brand}<span/> {product.category}</p>
     <h1>{product.name}</h1>
     <p className="showcaseDescription">{product.description}</p>
     <div className="showcasePrice"><b>{gs(product.price)}</b>{product.oldPrice&&<><del>{gs(product.oldPrice)}</del><em>Ahorrás {gs(product.oldPrice-product.price)}</em></>}</div>
     <div className="stockLine"><span className={product.stock>0?"stockDot":"stockDot empty"}/><b>{product.stock>0?`${product.stock} unidades disponibles`:"Sin stock disponible"}</b><small>{product.stock>0?"Listo para entrega":"Consultá reposición"}</small></div>
     <div className="showcaseActions"><button className="primary" disabled={!product.stock}><ShoppingCart/> Agregar al carrito</button><button className="wa" onClick={whatsapp}><FaWhatsapp/> Comprar por WhatsApp</button></div>
     <div className="purchaseBenefits"><article><span><ShieldCheck/></span><div><b>Garantía local</b><small>{product.warranty}</small></div></article><article><span><Truck/></span><div><b>Envíos</b><small>A todo Paraguay</small></div></article><article><span><CreditCard/></span><div><b>Formas de pago</b><small>Opciones flexibles</small></div></article></div>
    </div>
   </div>
  </section>
  <main className="detailContent section">
   <nav className="detailTabs" aria-label="Información del producto"><a href="#especificaciones">Especificaciones técnicas</a><a href="#descripcion">Descripción</a><a href="#envios">Envíos y garantía</a></nav>
   <section className="specBlock premiumSpecs" id="especificaciones"><div id="descripcion"><span className="eyebrow">DETALLES DEL PRODUCTO</span><h2>Diseñado para rendir</h2><p>{product.description}</p><div className="shippingNote" id="envios"><ShieldCheck/><div><b>Compra protegida</b><span>Garantía de {product.warranty} y envíos disponibles a todo Paraguay.</span></div></div></div><dl>{Object.entries(product.specs).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></section>
   <div className="sectionHead"><div><span className="eyebrow">TAMBIÉN TE PUEDE INTERESAR</span><h2>Productos relacionados</h2></div></div>
   <div className="products related">{related.map(item=><article className="product" key={identity(item)}><div className="pic"><img src={item.image} alt={item.name}/></div><div className="pcopy"><span className="pbrand">{item.brand} · {item.category}</span><h3><Link href={`/producto/${productSlug(item)}`}>{item.name}</Link></h3><span className="instock"><PackageCheck/>{item.stock?`${item.stock} disponibles`:"Agotado"}</span><div className="pprice"><b>{gs(item.price)}</b>{item.oldPrice&&<del>{gs(item.oldPrice)}</del>}</div><div className="actions"><Link href={`/producto/${productSlug(item)}`}>Ver detalles <ArrowRight/></Link></div></div></article>)}</div>
  </main>
 </>
}
