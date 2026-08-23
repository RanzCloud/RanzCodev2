import { Link } from 'react-router-dom';
import { ArrowRight, Boxes } from 'lucide-react';
import { formatRupiah, PRODUCT_TYPE_LABELS } from '../lib/api';

export interface Product {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  product_type: string;
  stock: number;
  categories?: { name: string; slug: string; icon?: string } | null;
}

export default function ProductCard({ product }: { product: Product }) {
  const discountPct = product.original_price
    ? Math.round(100 - (Number(product.price) / Number(product.original_price)) * 100)
    : 0;

  return (
    <Link
      to={`/produk/${product.slug}`}
      className="group relative flex flex-col rounded-2xl glass card-hover overflow-hidden"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <Boxes className="h-12 w-12 text-slate-600" />
        )}
        {discountPct > 0 && (
          <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full bg-red-500 text-white">
            -{discountPct}%
          </span>
        )}
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-black/60 text-cyan-300 border border-cyan-400/30">
          {PRODUCT_TYPE_LABELS[product.product_type] || product.product_type}
        </span>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-2">
        <h3 className="font-semibold text-white line-clamp-1">{product.name}</h3>
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[2rem]">{product.short_description}</p>
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div>
            {product.original_price ? (
              <p className="text-[11px] text-slate-500 line-through">{formatRupiah(product.original_price)}</p>
            ) : null}
            <p className="font-bold text-cyan-300">{formatRupiah(product.price)}</p>
          </div>
          <span className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-cyan-400/20 transition-colors">
            <ArrowRight className="h-4 w-4 text-cyan-300" />
          </span>
        </div>
      </div>
    </Link>
  );
}
