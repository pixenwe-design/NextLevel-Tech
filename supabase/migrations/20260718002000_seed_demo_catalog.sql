insert into public.categories (name, slug, description, sort_order, is_active)
values
  ('PC gamer','pc-gamer','Equipos preparados para gaming y creación.',10,true),
  ('Computadoras de oficina','computadoras-de-oficina','Equipos confiables para productividad.',20,true),
  ('Notebooks','notebooks','Movilidad y rendimiento.',30,true),
  ('Monitores','monitores','Pantallas para trabajar y jugar.',40,true),
  ('Procesadores','procesadores','Procesadores de última generación.',50,true),
  ('Placas de video','placas-de-video','Gráficos para gaming y creación.',60,true),
  ('Memorias RAM','memorias-ram','Memoria de alto rendimiento.',70,true),
  ('Almacenamiento','almacenamiento','SSD y almacenamiento veloz.',80,true),
  ('Teclados','teclados','Teclados para productividad y gaming.',90,true),
  ('Mouse','mouse','Precisión para cada movimiento.',100,true),
  ('Auriculares','auriculares','Audio inmersivo y comunicación clara.',110,true),
  ('PlayStation','playstation','Consolas y accesorios PlayStation.',120,true),
  ('Xbox','xbox','Consolas y accesorios Xbox.',130,true),
  ('Nintendo','nintendo','Consolas y juegos Nintendo.',140,true),
  ('Consolas','consolas','Consolas de nueva generación.',150,true),
  ('Accesorios','accesorios','Accesorios para completar tu setup.',160,true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.brands (name, slug, is_active)
values
  ('NextLevel','nextlevel',true),('Lenovo','lenovo',true),('ASUS','asus',true),
  ('Sony','sony',true),('Microsoft','microsoft',true),('Nintendo','nintendo',true),
  ('AOC','aoc',true),('HyperX','hyperx',true),('Logitech','logitech',true),
  ('Kingston','kingston',true),('Gigabyte','gigabyte',true),('AMD','amd',true)
on conflict (slug) do update set name = excluded.name, is_active = excluded.is_active;

insert into public.products (
  name, code, slug, description, category_id, brand_id, price, sale_price,
  stock, minimum_stock, is_active, is_featured, is_new, is_on_sale, warranty
)
values
  ('PC Gamer Ryzen 5 RTX 4060','NL-0001','pc-gamer-ryzen-5-rtx-4060','Equipo equilibrado para gaming competitivo en 1080p y creación de contenido.',(select id from public.categories where slug='pc-gamer'),(select id from public.brands where slug='nextlevel'),8299000,7499000,6,3,true,true,false,true,'12 meses'),
  ('PC Gamer Ryzen 7 RTX 4070','NL-0002','pc-gamer-ryzen-7-rtx-4070','Potencia de alto nivel para jugar en 1440p, streaming y aplicaciones profesionales.',(select id from public.categories where slug='pc-gamer'),(select id from public.brands where slug='nextlevel'),12690000,null,3,3,true,true,true,false,'18 meses'),
  ('Notebook Lenovo IdeaPad Slim 3','NL-0003','notebook-lenovo-ideapad-slim-3','Notebook liviana y confiable para estudio, oficina y uso diario.',(select id from public.categories where slug='notebooks'),(select id from public.brands where slug='lenovo'),4699000,4299000,9,3,true,false,false,true,'12 meses'),
  ('Notebook ASUS TUF Gaming A15','NL-0004','notebook-asus-tuf-gaming-a15','Notebook gamer robusta con pantalla de alta frecuencia y refrigeración avanzada.',(select id from public.categories where slug='notebooks'),(select id from public.brands where slug='asus'),8999000,null,4,3,true,true,true,false,'12 meses'),
  ('PlayStation 5 Slim 1 TB','NL-0005','playstation-5-slim-1tb','Consola Slim con lector, almacenamiento ultrarrápido y control DualSense.',(select id from public.categories where slug='playstation'),(select id from public.brands where slug='sony'),6099000,5699000,7,3,true,true,false,true,'12 meses'),
  ('Xbox Series X 1 TB','NL-0006','xbox-series-x-1tb','Consola potente con tiempos de carga mínimos y juegos de cuatro generaciones.',(select id from public.categories where slug='xbox'),(select id from public.brands where slug='microsoft'),5999000,null,2,3,true,false,false,false,'12 meses'),
  ('Nintendo Switch OLED 64 GB','NL-0007','nintendo-switch-oled-64gb','Consola híbrida con pantalla OLED de 7 pulgadas y base con LAN.',(select id from public.categories where slug='nintendo'),(select id from public.brands where slug='nintendo'),3499000,null,8,3,true,false,true,false,'12 meses'),
  ('Monitor Gamer 27 QHD 165 Hz','NL-0008','monitor-gamer-27-qhd-165hz','Panel rápido y nítido con Adaptive Sync y soporte ajustable.',(select id from public.categories where slug='monitores'),(select id from public.brands where slug='aoc'),3299000,2899000,5,3,true,false,false,true,'24 meses'),
  ('Teclado Mecánico HyperX Alloy','NL-0009','teclado-mecanico-hyperx-alloy','Teclado compacto con switches mecánicos y retroiluminación RGB.',(select id from public.categories where slug='teclados'),(select id from public.brands where slug='hyperx'),699000,null,12,3,true,false,false,false,'12 meses'),
  ('Mouse Gamer Logitech G502 X','NL-0010','mouse-gamer-logitech-g502-x','Mouse de alto rendimiento con sensor preciso y botones programables.',(select id from public.categories where slug='mouse'),(select id from public.brands where slug='logitech'),549000,null,15,3,true,false,true,false,'12 meses'),
  ('Auriculares Cloud III Wireless','NL-0011','auriculares-cloud-iii-wireless','Audio espacial, comodidad y batería extendida para sesiones intensas.',(select id from public.categories where slug='auriculares'),(select id from public.brands where slug='hyperx'),1249000,1099000,6,3,true,false,false,true,'12 meses'),
  ('SSD NVMe Kingston NV2 1 TB','NL-0012','ssd-nvme-kingston-nv2-1tb','Almacenamiento PCIe 4.0 compacto y eficiente.',(select id from public.categories where slug='almacenamiento'),(select id from public.brands where slug='kingston'),599000,null,20,3,true,false,false,false,'36 meses'),
  ('Memoria Fury Beast 16 GB DDR5','NL-0013','memoria-fury-beast-16gb-ddr5','Módulo DDR5 de alta velocidad con perfiles EXPO y XMP.',(select id from public.categories where slug='memorias-ram'),(select id from public.brands where slug='kingston'),549000,null,18,3,true,false,true,false,'De por vida'),
  ('GeForce RTX 4070 Super 12 GB','NL-0014','geforce-rtx-4070-super-12gb','Gráficos con ray tracing, DLSS y refrigeración de triple ventilador.',(select id from public.categories where slug='placas-de-video'),(select id from public.brands where slug='gigabyte'),6999000,null,3,3,true,true,false,false,'24 meses'),
  ('Procesador AMD Ryzen 7 7800X3D','NL-0015','procesador-amd-ryzen-7-7800x3d','Procesador gamer con tecnología 3D V-Cache.',(select id from public.categories where slug='procesadores'),(select id from public.brands where slug='amd'),4499000,4199000,5,3,true,false,false,true,'36 meses')
on conflict (code) do update set
  name=excluded.name, slug=excluded.slug, description=excluded.description,
  category_id=excluded.category_id, brand_id=excluded.brand_id, price=excluded.price,
  sale_price=excluded.sale_price, stock=excluded.stock, minimum_stock=excluded.minimum_stock,
  is_active=excluded.is_active, is_featured=excluded.is_featured, is_new=excluded.is_new,
  is_on_sale=excluded.is_on_sale, warranty=excluded.warranty;

insert into public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
select p.id, seed.storage_path, seed.public_url, p.name, 0, true
from (
  values
    ('NL-0001','demo/pc-ryzen-5.jpg','https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0002','demo/pc-ryzen-7.jpg','https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0003','demo/lenovo-ideapad.jpg','https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0004','demo/asus-tuf.jpg','https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0005','demo/playstation-5.jpg','https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0006','demo/xbox-series-x.jpg','https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0007','demo/nintendo-switch.jpg','https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0008','demo/monitor-aoc.jpg','https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0009','demo/teclado-hyperx.jpg','https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0010','demo/mouse-logitech.jpg','https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0011','demo/auriculares-hyperx.jpg','https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0012','demo/ssd-kingston.jpg','https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0013','demo/ram-kingston.jpg','https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0014','demo/rtx-4070.jpg','https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85'),
    ('NL-0015','demo/ryzen-7800x3d.jpg','https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1200&q=85')
) as seed(code, storage_path, public_url)
join public.products p on p.code=seed.code
on conflict (product_id, storage_path) do update set
  public_url=excluded.public_url, alt_text=excluded.alt_text, sort_order=excluded.sort_order, is_primary=excluded.is_primary;

insert into public.product_specs (product_id, name, value, sort_order)
select p.id, seed.name, seed.value, seed.sort_order
from (
  values
    ('NL-0001','Procesador','AMD Ryzen 5 5600',10),('NL-0001','Memoria RAM','16 GB DDR4',20),('NL-0001','Almacenamiento','SSD NVMe 1 TB',30),('NL-0001','Tarjeta gráfica','GeForce RTX 4060 8 GB',40),
    ('NL-0002','Procesador','AMD Ryzen 7 7700',10),('NL-0002','Memoria RAM','32 GB DDR5',20),('NL-0002','Tarjeta gráfica','GeForce RTX 4070 Super',30),
    ('NL-0003','Procesador','Intel Core i5 12ª Gen',10),('NL-0003','Memoria RAM','16 GB',20),('NL-0003','Almacenamiento','SSD 512 GB',30),
    ('NL-0004','Procesador','AMD Ryzen 7 7735HS',10),('NL-0004','Tarjeta gráfica','RTX 4060 8 GB',20),('NL-0004','Pantalla','15,6 pulgadas 144 Hz',30),
    ('NL-0005','Almacenamiento','SSD 1 TB',10),('NL-0005','Resolución','Hasta 4K 120 Hz',20),
    ('NL-0008','Panel','IPS 27 pulgadas',10),('NL-0008','Resolución','2560 × 1440',20),('NL-0008','Frecuencia','165 Hz',30),
    ('NL-0014','Memoria','12 GB GDDR6X',10),('NL-0014','Interfaz','PCIe 4.0',20),
    ('NL-0015','Núcleos','8',10),('NL-0015','Hilos','16',20),('NL-0015','Frecuencia boost','5,0 GHz',30)
) as seed(code, name, value, sort_order)
join public.products p on p.code=seed.code
on conflict (product_id, name) do update set value=excluded.value, sort_order=excluded.sort_order;
