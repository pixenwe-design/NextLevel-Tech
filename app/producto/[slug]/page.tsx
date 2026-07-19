import ProductDetail from "./product-detail-client";

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  return <ProductDetail slug={slug}/>;
}
