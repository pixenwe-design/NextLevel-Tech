import CategoryCatalog from "./category-catalog";

export default async function CategoryPage({params,searchParams}:{params:Promise<{slug:string}>,searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const {slug}=await params;
  const raw=await searchParams;
  const initial=Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,Array.isArray(value)?value[0]||"":value||""]));
  return <CategoryCatalog slug={slug} initial={initial}/>;
}
