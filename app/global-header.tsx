"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {Menu,Search,X} from "lucide-react";
import {CartButton} from "./cart-ui";
import {demoProducts,type Product} from "./page";
import {fetchStoreProducts} from "../lib/store-data";

const productSlug=(product:Product)=>product.slug||product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

export function GlobalHeader(){
 const pathname=usePathname();const router=useRouter();
 const [menuOpen,setMenuOpen]=useState(false);const [query,setQuery]=useState("");const [searchOpen,setSearchOpen]=useState(false);const [products,setProducts]=useState<Product[]>(demoProducts);
 const searchRoot=useRef<HTMLFormElement>(null);
 useEffect(()=>{let active=true;fetchStoreProducts().then(data=>{if(active&&data.length)setProducts(data)}).catch(()=>{});return()=>{active=false}},[]);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(!searchRoot.current?.contains(event.target as Node))setSearchOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[]);
 const results=useMemo(()=>{const terms=normalize(query).split(/\s+/).filter(Boolean);if(!terms.length)return[];return products.filter(product=>terms.every(term=>normalize(`${product.name} ${product.brand} ${product.category}`).includes(term))).slice(0,6)},[products,query]);
 const submit=(event:React.FormEvent)=>{event.preventDefault();const value=query.trim();if(!value)return;setSearchOpen(false);router.push(`/categoria/todas?q=${encodeURIComponent(value)}`)};
 const isProducts=pathname.startsWith("/categoria")||pathname.startsWith("/producto");
 return <>
  <div className="topline" aria-label="Beneficios de compra"><div className="toplineTrack"><div className="toplineGroup"><span className="toplineItem">Envíos a todo Paraguay<i/></span><span className="toplineItem">Pagá con tarjetas<i/></span><span className="toplineItem">Garantía en productos seleccionados<i/></span></div><div className="toplineGroup" aria-hidden="true"><span className="toplineItem">Envíos a todo Paraguay<i/></span><span className="toplineItem">Pagá con tarjetas<i/></span><span className="toplineItem">Garantía en productos seleccionados<i/></span></div></div></div>
  <header className="siteHeader" data-global-header><div className="nav">
   <Link className="logo" href="/" aria-label="NextLevel Tech, inicio"><b>NL</b><span>NextLevel<small>TECH</small></span></Link>
   <nav className={menuOpen?"show":""} aria-label="Navegación principal"><Link onClick={()=>setMenuOpen(false)} className={pathname==="/"?"active":""} href="/">Inicio</Link><Link onClick={()=>setMenuOpen(false)} className={isProducts?"active":""} href="/categoria/todas">Productos</Link><Link onClick={()=>setMenuOpen(false)} className={pathname==="/ofertas"?"active":""} href="/ofertas">Ofertas</Link><Link onClick={()=>setMenuOpen(false)} href="/?admin=true">Administrar</Link></nav>
   <form className="search globalSearch" ref={searchRoot} onSubmit={submit}><Search/><input aria-label="Buscar productos" value={query} onFocus={()=>setSearchOpen(true)} onChange={event=>{setQuery(event.target.value);setSearchOpen(true)}} placeholder="Buscar producto, marca o categoría..."/>{searchOpen&&query.trim()&&<div className="searchPanel">{results.length?<><div className="searchResults">{results.map(product=><Link className="searchResult" key={product.dbId||product.id} href={`/producto/${productSlug(product)}`}><img src={product.image} alt=""/><span className="searchResultInfo"><b>{product.name}</b><small>{product.brand} · {product.category}</small></span></Link>)}</div><button className="searchAll" type="submit">Ver todos los resultados</button></>:<div className="searchStatus"><Search/><b>Sin coincidencias</b></div>}</div>}</form>
   <div className="headerActions"><CartButton/><button className="hamb iconBtn" onClick={()=>setMenuOpen(value=>!value)} aria-label={menuOpen?"Cerrar menú":"Abrir menú"}>{menuOpen?<X/>:<Menu/>}</button></div>
  </div></header>
 </>;
}
