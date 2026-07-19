"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowLeft,ArrowRight,ChevronDown,Menu,PackageCheck,Search,ShoppingCart,SlidersHorizontal,X} from "lucide-react";
import {demoProducts as products,gs,type Product} from "../../page";
import {fetchStoreProducts,subscribeToCatalog} from "../../../lib/store-data";

const categoryList=[
 ["todas","Todos"],["pc-gamer","PC gamer"],["notebooks","Notebooks"],["placas-de-video","Placas de video"],["consolas","Consolas"],["monitores","Monitores"],["perifericos","Periféricos"]
] as const;
const descriptions:Record<string,string>={
 "pc-gamer":"Equipos configurados para jugar, transmitir y crear sin límites.",
 notebooks:"Movilidad, productividad y potencia para trabajar o jugar donde quieras.",
 "placas-de-video":"Gráficos de alto rendimiento para gaming, diseño y creación profesional.",
 consolas:"Consolas y experiencias de nueva generación para todos los jugadores.",
 monitores:"Pantallas rápidas, nítidas y preparadas para cada tipo de setup.",
 perifericos:"Teclados, mouse y audio diseñados para precisión y comodidad."
};
const categoryImages:Record<string,string>={
 todas:"https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1200&q=85",
 "pc-gamer":"https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=85",
 notebooks:"https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85",
 "placas-de-video":"https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85",
 consolas:"https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=85",
 monitores:"https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85",
 perifericos:"https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85"
};
const matchCategory=(slug:string,p:Product)=>{
 if(slug==="todas")return true;
 const name=categoryList.find(x=>x[0]===slug)?.[1]||slug;
 if(slug==="consolas")return ["PlayStation","Xbox","Nintendo","Consolas"].includes(p.category);
 if(slug==="perifericos")return ["Teclados","Mouse","Auriculares","Accesorios"].includes(p.category);
 return p.category===name;
};
export default function CategoryCatalog({slug,initial}:{slug:string,initial:Record<string,string>}){
 const router=useRouter();
 const [storeProducts,setStoreProducts]=useState<Product[]>(products);
 useEffect(()=>{let active=true;const reload=()=>fetchStoreProducts().then(data=>{if(active)setStoreProducts(data.length?data:products)}).catch(error=>console.error("Supabase category products:",error));reload();const unsubscribe=subscribeToCatalog(reload);return()=>{active=false;unsubscribe()}},[]);
 const title=categoryList.find(x=>x[0]===slug)?.[1]||"Categoría";
 const [query,setQuery]=useState(initial.q||"");const [brand,setBrand]=useState(initial.marca||"todas");const [min,setMin]=useState(initial.min||"");const [max,setMax]=useState(initial.max||"");
 const [sale,setSale]=useState(initial.oferta==="true");const [stock,setStock]=useState(initial.stock==="true");const [fresh,setFresh]=useState(initial.nuevo==="true");const [featured,setFeatured]=useState(initial.destacado==="true");
 const [sort,setSort]=useState(initial.orden||"recientes");const [filtersOpen,setFiltersOpen]=useState(false);const [menu,setMenu]=useState(false);
 useEffect(()=>{const q=new URLSearchParams();if(query)q.set("q",query);if(brand!=="todas")q.set("marca",brand);if(min)q.set("min",min);if(max)q.set("max",max);if(sale)q.set("oferta","true");if(stock)q.set("stock","true");if(fresh)q.set("nuevo","true");if(featured)q.set("destacado","true");if(sort!=="recientes")q.set("orden",sort);history.replaceState(null,"",`${location.pathname}${q.size?`?${q}`:""}`)},[query,brand,min,max,sale,stock,fresh,featured,sort]);
 const base=storeProducts.filter(p=>matchCategory(slug,p));const brands=[...new Set(base.map(p=>p.brand))];
 const visible=base.filter(p=>(!query||`${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(query.toLowerCase()))&&(brand==="todas"||p.brand.toLowerCase()===brand)&&(!min||p.price>=+min)&&(!max||p.price<=+max)&&(!sale||!!p.oldPrice)&&(!stock||p.stock>0)&&(!fresh||p.isNew)&&(!featured||p.featured)).sort((a,b)=>sort==="precio-asc"?a.price-b.price:sort==="precio-desc"?b.price-a.price:sort==="nombre"?a.name.localeCompare(b.name):sort==="descuento"?((b.oldPrice?1-b.price/b.oldPrice:0)-(a.oldPrice?1-a.price/a.oldPrice:0)):b.id-a.id);
 const go=(s:string)=>router.push(`/categoria/${s}`);
 return <div className="categoryPage"><header><div className="nav"><button className="hamb iconBtn" onClick={()=>setMenu(!menu)}><Menu/></button><button className="logo" onClick={()=>router.push("/")}><b>NL</b><span>NextLevel<small>TECH</small></span></button><nav className={menu?"show":""}><button onClick={()=>router.push("/")}>Inicio</button><button onClick={()=>go("todas")}>Productos</button><button onClick={()=>go("todas")}>Ofertas</button></nav><label className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Buscar en ${title}...`}/></label><button className="cartBtn"><ShoppingCart/></button></div></header>
 <main className="categoryMain"><section className="categoryHero"><img className="categoryHeroImage" src={categoryImages[slug]||categoryImages.todas} alt=""/><div className="categoryHeroShade"/><div className="categoryHeroContent"><div className="categoryHeroTop"><span className="breadcrumb"><Link href="/">Inicio</Link><i>/</i><span>Categorías</span><i>/</i><b>{title}</b></span><Link href="/" className="categoryBack"><ArrowLeft/> Volver al inicio</Link></div><h1>{title}</h1><p>{descriptions[slug]||`Explorá nuestra selección de ${title.toLowerCase()} con garantía y soporte local.`}</p><strong>{visible.length} {visible.length===1?"producto encontrado":"productos encontrados"}</strong></div></section>
 <nav className="categoryTabs">{categoryList.map(([s,n])=><button key={s} className={s===slug?"active":""} onClick={()=>go(s)}>{n}</button>)}</nav><label className="categoryMobileSelect">Cambiar categoría<div><select value={slug} onChange={e=>go(e.target.value)}>{categoryList.map(([s,n])=><option value={s} key={s}>{n}</option>)}</select><ChevronDown/></div></label>
 <div className="mobileCatalogTools"><button onClick={()=>setFiltersOpen(true)}><SlidersHorizontal/> Filtrar</button><label>Ordenar<select value={sort} onChange={e=>setSort(e.target.value)}><option value="recientes">Más recientes</option><option value="precio-asc">Menor precio</option><option value="precio-desc">Mayor precio</option><option value="nombre">Nombre A-Z</option><option value="descuento">Mayor descuento</option></select></label></div>
 <div className="categoryCatalog"><aside className={filtersOpen?"open":""}><div className="mobileFilterHead"><b>Filtros</b><button onClick={()=>setFiltersOpen(false)}><X/></button></div><h2><SlidersHorizontal/> Filtrar resultados</h2><label>Marca<select value={brand} onChange={e=>setBrand(e.target.value)}><option value="todas">Todas las marcas</option>{brands.map(b=><option value={b.toLowerCase()} key={b}>{b}</option>)}</select></label><label>Precio<div className="range"><input type="number" value={min} onChange={e=>setMin(e.target.value)} placeholder="Mínimo"/><input type="number" value={max} onChange={e=>setMax(e.target.value)} placeholder="Máximo"/></div></label><Toggle label="En oferta" value={sale} set={setSale}/><Toggle label="Con stock" value={stock} set={setStock}/><Toggle label="Productos nuevos" value={fresh} set={setFresh}/><Toggle label="Destacados" value={featured} set={setFeatured}/><button className="clear bordered" onClick={()=>{setBrand("todas");setMin("");setMax("");setSale(false);setStock(false);setFresh(false);setFeatured(false)}}><X/> Limpiar filtros</button></aside><section><div className="categoryToolbar"><span>{visible.length} resultados</span><label>Ordenar por <select value={sort} onChange={e=>setSort(e.target.value)}><option value="recientes">Más recientes</option><option value="precio-asc">Precio menor a mayor</option><option value="precio-desc">Precio mayor a menor</option><option value="nombre">Nombre A-Z</option><option value="descuento">Mayor descuento</option></select></label></div>{visible.length?<div className="products">{visible.map(p=><Card key={p.id} p={p}/>)}</div>:<div className="empty"><Search/><b>No encontramos productos</b><p>Probá ajustando los filtros o elegí otra categoría.</p></div>}</section></div></main>{filtersOpen&&<button className="categoryOverlay" onClick={()=>setFiltersOpen(false)}/>}</div>
}
function Toggle({label,value,set}:{label:string,value:boolean,set:(v:boolean)=>void}){return <label className="check"><input type="checkbox" checked={value} onChange={e=>set(e.target.checked)}/><span/>{label}</label>}
function Card({p}:{p:Product}){const href=`/producto/${p.slug}`;return <article className="product"><div className="pic">{p.oldPrice&&<span className="badge">-{Math.round((1-p.price/p.oldPrice)*100)}%</span>}<img src={p.image} alt={p.name}/></div><div className="pcopy"><span className="pbrand">{p.brand} · {p.category}</span><h3><Link href={href}>{p.name}</Link></h3><span className="instock"><PackageCheck/>{p.stock?`${p.stock} disponibles`:"Agotado"}</span><div className="pprice"><b>{gs(p.price)}</b>{p.oldPrice&&<del>{gs(p.oldPrice)}</del>}</div><div className="actions"><Link href={href}>Ver detalles <ArrowRight/></Link><button aria-label={`Agregar ${p.name} al carrito`}><ShoppingCart/></button></div></div></article>}
