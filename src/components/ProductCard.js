import Link from "next/link";
import Image from "next/image";

const ProductCard = ({ product }) => {
  return (
    <div className="bg-black border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 hover:border-gray-600">
      <Link href={`/product-details/${product.id}`} className="block">
        <div className="relative w-full aspect-square">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-all duration-300 hover:opacity-80"
          />
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-2 text-white truncate">
            {product.name}
          </h2>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-white">
              €{product.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-400">View Details</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
