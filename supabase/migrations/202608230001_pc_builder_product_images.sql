begin;

-- Product photos for the demo PC Builder catalog.
-- The UI reads these values directly and falls back to the slot icon only when an image cannot load.
with product_images(id, image_url) as (
  values
    ('build-demo-cpu-entry', 'https://www.ultratech.com.bd/image/cache/2022/07/AMD-Ryzen-5-5600-Processor-500x500.jpg'),
    ('build-demo-cpu-balanced', 'https://img-cdn.heureka.group/v1/928dc839-d73f-5c92-9097-27150802f805.jpg'),
    ('build-demo-cpu-premium', 'https://bizweb.dktcdn.net/100/492/434/products/intel-core-i7-14700k-1.jpg?v=1721874765500'),
    ('build-demo-mainboard-entry', 'https://static.gigabyte.com/StaticFile/Image/Global/ee22294e5e3b209531699f8fc476828a/Product/32736/png'),
    ('build-demo-mainboard-balanced', 'https://www.alternate.at/p/1200x630/3/0/MSI_PRO_B650_S_WIFI__Mainboard%40%40100011903_4.jpg'),
    ('build-demo-mainboard-premium', 'https://media.ldlc.com/r1600/ld/products/00/05/98/31/LD0005983192.jpg'),
    ('build-demo-ram-entry', 'https://resources.claroshop.com/medios-plazavip/s2/62132/4191126/63640f172f816-d_793256-mla51378089632_092022-f-1600x1600.jpg'),
    ('build-demo-ram-balanced', 'https://www.proshop.pl/Images/1600x1200/3319447_c21b5ea2dd51.png'),
    ('build-demo-ram-premium', 'https://i5.walmartimages.com/asr/76b8c76f-b912-4011-a030-bae5916cfdab.7444c65eaa95a25cee12f8d99b8a0cb5.jpeg'),
    ('build-demo-gpu-entry', 'https://hotline.ua/img/tx/388/3882315165.jpg'),
    ('build-demo-gpu-balanced', 'https://pl-store.msi.com/cdn/shop/files/1024_2a6c61ba-5d49-4211-8caa-7e3356db28b4.png?v=1720685502&width=1214'),
    ('build-demo-gpu-premium', 'https://www.proshop.dk/Images/600x800/3222419_a901510826e1.png'),
    ('build-demo-storage-entry', 'https://martec.com.ec/8638-large_default/kingston-nv2-ssd-500-gb-internal-m2-2280-pcie-40-x4-nvme.jpg'),
    ('build-demo-storage-balanced', 'https://www.cybertek.fr/images_produits/42c3ee81-f647-4c59-8589-1d99af6a109e.jpg'),
    ('build-demo-storage-premium', 'https://i.ebayimg.com/00/s/MTYwMFgxNjAw/z/cHQAAOSwxTNlE38p/%24_57.JPG?set_id=880000500F'),
    ('build-demo-psu-entry', 'https://www.asusbymacman.es/29080-large_default/corsair-cx650-650w-80-bronze-fuente.jpg'),
    ('build-demo-psu-balanced', 'https://media.pichau.com.br/media/catalog/product/cache/2f958555330323e505eba7ce930bdf27/s/s/ssr-750fx05563.jpg'),
    ('build-demo-psu-premium', 'https://i.ebayimg.com/images/g/2iIAAeSwA7lolOkN/s-l1200.jpg'),
    ('build-demo-case-entry', 'https://www.wootware.co.za/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/c/o/corsair_3000d_af_white_0_.jpg'),
    ('build-demo-case-balanced', 'https://www.pc-canada.com/dd2/img/item/A-1500x1500/8744353-3.jpg'),
    ('build-demo-case-premium', 'https://cdn.salla.sa/KOPVE/1f03f8bc-2d16-461b-8a6f-bd7775a7569f-1000x1000-ZulLBi5mODGNSrX09RqhUr2JZl5Gp9s0aoHKarN0.png'),
    ('build-demo-cooler-entry', 'https://www.neobyte.es/71534-medium_default/deepcool-ak400-blanca-refrigeracion-cpu.jpg'),
    ('build-demo-cooler-balanced', 'https://pcspecchart.com/media/gallery/cpucooler/Thermalright%20Assassin%20X%20120%20SE%20White%20Gallery/474b527fd5964657babd8081257fff2a.jpg'),
    ('build-demo-cooler-premium', 'https://www.arctic.de/media/94/d3/db/1707473586/Liquid_Freezer_III_360_ARGB_White_G02_2.jpg')
)
update public.products as product
set
  image_url = product_images.image_url,
  updated_at = now()
from product_images
where product.id = product_images.id;

commit;
