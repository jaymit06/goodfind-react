import { useState } from "react";
function Tag({ children, good = false }) {
  return <span className={`tag ${good ? "good" : ""}`}>{children}</span>;
}
export default function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = product.image_front_small_url || product.image_small_url || product.image_url;
  const calories = product.nutriments?.["energy-kcal_100g"];
  const protein = product.nutriments?.proteins_100g;
  return <article className="product-card">
    <div className="product-image">{imageUrl && !imageFailed ? <img src={imageUrl} alt={product.product_name || "Food product"} loading="lazy" onError={() => setImageFailed(true)} /> : <span className="image-placeholder" aria-hidden="true">✳</span>}</div>
    <div className="product-body"><div className="product-brand">{product.brands || "Pantry pick"}</div>
      <h3 className="product-name">{product.product_name || "Unnamed product"}</h3>
      <div className="meta-row">{calories != null && <Tag good>{Math.round(calories)} kcal / 100g</Tag>}{protein != null && <Tag>{protein}g protein</Tag>}{calories == null && protein == null && <Tag>Nutrition unavailable</Tag>}</div>
      <div className="product-footer"><span>{product.quantity || "Product details"}</span>{product.code ? <a className="label-link" href={`https://world.openfoodfacts.org/product/${encodeURIComponent(product.code)}`} target="_blank" rel="noopener noreferrer">View label ↗</a> : <span className="label-link" aria-disabled="true">Label unavailable</span>}</div>
    </div>
  </article>;
}
