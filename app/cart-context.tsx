"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from "react";
import type {Product} from "./page";
const STORAGE_KEY="nlt-cart";
export type CartItem={key:string;id:string;name:string;price:number;image:string;quantity:number;stock:number;variant?:string};
type CartContextValue={items:CartItem[];hydrated:boolean;isOpen:boolean;count:number;total:number;addItem:(product:Product,quantity?:number,variant?:string)=>void;setQuantity:(key:string,quantity:number)=>void;removeItem:(key:string)=>void;clearCart:()=>void;openCart:()=>void;closeCart:()=>void};
const CartContext=createContext<CartContextValue|null>(null);
const productId=(product:Product)=>String(product.dbId||product.id);
const itemKey=(id:string,variant?:string)=>variant?`${id}::${variant}`:id;
function isCartItem(value:unknown):value is CartItem{if(!value||typeof value!=="object")return false;const item=value as Partial<CartItem>;return typeof item.key==="string"&&typeof item.id==="string"&&typeof item.name==="string"&&typeof item.price==="number"&&typeof item.image==="string"&&typeof item.quantity==="number"}
export function CartProvider({children}:{children:ReactNode}){
 const [items,setItems]=useState<CartItem[]>([]);const [hydrated,setHydrated]=useState(false);const [isOpen,setIsOpen]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>{try{const saved=window.localStorage.getItem(STORAGE_KEY);if(saved){const parsed:unknown=JSON.parse(saved);if(Array.isArray(parsed))setItems(parsed.filter(isCartItem))}}catch(error){console.error("No se pudo restaurar el carrito:",error)}setHydrated(true)},0);return()=>window.clearTimeout(timer)},[]);
 useEffect(()=>{if(!hydrated)return;try{window.localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}catch(error){console.error("No se pudo guardar el carrito:",error)}},[items,hydrated]);
 const addItem=useCallback((product:Product,quantity=1,variant?:string)=>{const id=productId(product);const key=itemKey(id,variant);const amount=Math.max(1,quantity);setItems(current=>{const existing=current.find(item=>item.key===key);if(existing)return current.map(item=>item.key===key?{...item,quantity:Math.min(item.stock||Infinity,item.quantity+amount)}:item);return [...current,{key,id,name:product.name,price:product.price,image:product.image,quantity:Math.min(product.stock||amount,amount),stock:product.stock,variant}]});setIsOpen(true)},[]);
 const setQuantity=useCallback((key:string,quantity:number)=>setItems(current=>current.map(item=>item.key===key?{...item,quantity:Math.min(item.stock||Infinity,Math.max(1,quantity))}:item)),[]);
 const removeItem=useCallback((key:string)=>setItems(current=>current.filter(item=>item.key!==key)),[]);const clearCart=useCallback(()=>setItems([]),[]);
 const count=useMemo(()=>items.reduce((sum,item)=>sum+item.quantity,0),[items]);const total=useMemo(()=>items.reduce((sum,item)=>sum+item.price*item.quantity,0),[items]);
 const value=useMemo(()=>({items,hydrated,isOpen,count,total,addItem,setQuantity,removeItem,clearCart,openCart:()=>setIsOpen(true),closeCart:()=>setIsOpen(false)}),[items,hydrated,isOpen,count,total,addItem,setQuantity,removeItem,clearCart]);
 return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart(){const value=useContext(CartContext);if(!value)throw new Error("useCart debe usarse dentro de CartProvider");return value}
