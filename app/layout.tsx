import type {Metadata} from "next";
import "./globals.css";
import {CartProvider} from "./cart-context";
import {CartDrawer} from "./cart-ui";
export const metadata:Metadata={title:"NextLevel Tech | Tecnología y Gaming Paraguay",description:"Computadoras, notebooks, componentes, consolas y periféricos con garantía y delivery a todo Paraguay."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><CartProvider>{children}<CartDrawer/></CartProvider></body></html>}
