import { useEffect, useState } from "react";
import SearchBar from "./components/SearchBar.jsx";
import ProductCard from "./components/ProductCard.jsx";
import "./style.css";

function StatePanel({ icon, title, children }) {
  return <div className="state-panel"><div className="state-icon">{icon}</div><h3>{title}</h3><p>{children}</p></div>;
}

function rankProducts(products, query) {
  const terms = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/g) || [];
  if (!terms.length) return products;
  return products.map((product, index) => {
    const name = (product.product_name || "").toLowerCase();
    const brand = (product.brands || "").toLowerCase();
    const categories = `${product.categories || ""} ${(product.categories_tags || []).join(" ")}`;
    const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedName = normalize(name);
    const searchable = normalize(`${name} ${brand} ${categories}`);
    const matchedName = terms.filter((term) => normalizedName.includes(term)).length;
    const matchedAny = terms.filter((term) => searchable.includes(term)).length;
    let score = matchedName * 10 + matchedAny * 2;
    if (normalizedName.includes(terms.join(" "))) score += 20;
    if (matchedName === terms.length) score += 12;
    return { product, score, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 12).map(({ product }) => product);
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading-featured");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedProducts() {
      const queries = ["dark chocolate", "peanut butter", "granola", "oat milk"];
      try {
        const batches = await Promise.all(queries.map(async (term) => {
          const params = new URLSearchParams({
            search_terms: term,
            search_simple: "1",
            action: "process",
            json: "1",
            page_size: "8",
            fields: "product_name,brands,image_front_small_url,image_small_url,image_url,nutriments,quantity,categories,categories_tags,code"
          });
          const response = await fetch(`https://world.openfoodfacts.net/cgi/search.pl?${params}`, {
            headers: { Authorization: "Basic " + btoa("off:off") }
          });
          if (!response.ok) throw new Error("Featured product request failed");
          const data = await response.json();
          return (data.products || []).filter((product) =>
            product.product_name && product.code &&
            (product.image_front_small_url || product.image_small_url || product.image_url)
          );
        }));

        const seen = new Set();
        const featured = [];
        // Prefer one real product from each category to keep the homepage varied.
        for (const batch of batches) {
          const product = batch.find((item) => !seen.has(item.code));
          if (product) {
            seen.add(product.code);
            featured.push(product);
          }
        }
        for (const product of batches.flat()) {
          if (featured.length >= 4) break;
          if (!seen.has(product.code)) {
            seen.add(product.code);
            featured.push(product);
          }
        }

        if (cancelled) return;
        setProducts(featured);
        setStatus(featured.length ? "featured" : "not-found");
      } catch {
        if (cancelled) return;
        setMessage("We couldn't load featured products right now. You can still search for a food above.");
        setStatus("featured-error");
      }
    }

    loadFeaturedProducts();
    return () => { cancelled = true; };
  }, []);

  async function searchProducts(searchTerm) {
    const cleanQuery = searchTerm.trim();
    setQuery(cleanQuery);
    if (!cleanQuery) {
      setStatus("empty");
      setMessage("Type a food or brand above to discover products.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const params = new URLSearchParams({ search_terms: cleanQuery, search_simple: "1", action: "process", json: "1", page_size: "50", fields: "product_name,brands,image_front_small_url,image_small_url,image_url,nutriments,quantity,categories,categories_tags,code" });
      const response = await fetch(`https://world.openfoodfacts.net/cgi/search.pl?${params}`, {
        headers: { Authorization: "Basic " + btoa("off:off") }
      });
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      const found = rankProducts((data.products || []).filter((item) => item.product_name), cleanQuery);
      if (!found.length) {
        setProducts([]);
        setStatus("not-found");
        return;
      }
      setProducts(found);
      setStatus("results");
    } catch {
      setMessage("Check your internet connection and try again. If the issue persists, the food database may be temporarily unavailable.");
      setStatus("error");
    }
  }

  const heading = status === "loading-featured" ? "A few good finds" : status === "loading" ? `Searching for “${query}”` : status === "results" ? `Good finds for “${query}”` : status === "not-found" ? "No matches just yet" : status === "error" ? "We hit a little snag" : status === "empty" ? "A little curiosity goes a long way" : "A few good finds";
  const subtitle = status === "loading-featured" ? "Featured products from the Open Food Facts community" : status === "loading" ? "Checking the Open Food Facts database" : status === "results" ? "Product details supplied by the Open Food Facts community" : status === "not-found" ? "Try a broader search" : status === "error" ? "Your search couldn't be completed" : "Featured products from the Open Food Facts community";
  const countLabel = status === "loading-featured" ? "Loading" : status === "featured" ? `${products.length} featured products` : status === "loading" ? "Loading" : status === "results" ? `${products.length} products` : status === "error" ? "Unavailable" : status === "not-found" ? "0 products" : status === "featured-error" ? "Unavailable" : "";

  return <>
    <header className="site-header"><div className="brand"><span className="brand-mark">g.</span> goodfind</div><div className="header-note">A little more mindful</div></header>
    <main>
      <section className="hero"><div><p className="eyebrow">The everyday food explorer</p><h1>Know what’s<br/>in your <span>food.</span></h1></div><p className="hero-copy">Curious about what’s in your pantry? Find everyday products, peek at their ingredients, and discover the details behind the label.</p></section>
      <SearchBar onSearch={searchProducts} disabled={status === "loading"} />
      <div className="quick-row"><span className="quick-label">Popular searches</span>{["dark chocolate", "oat milk", "peanut butter", "granola"].map((term) => <button className="chip" key={term} onClick={() => searchProducts(term)}>{term}</button>)}</div>
      <section><div className="section-head"><div><h2>{heading}</h2><div className="section-sub">{subtitle}</div></div><span className="result-count">{countLabel}</span></div>
        {status === "loading-featured" ? <StatePanel icon="◌" title="Finding your good finds">Loading real products across a few categories…</StatePanel>
          : status === "featured-error" ? <StatePanel icon="↻" title="Featured products unavailable">{message}</StatePanel>
          : status === "loading" ? <StatePanel icon="◌" title="Finding your good finds">Fetching product labels and nutrition details…</StatePanel>
          : status === "error" ? <StatePanel icon="↻" title="Couldn't reach the food database">{message}</StatePanel>
          : status === "not-found" ? <StatePanel icon="⌕" title="Nothing on the shelf">We couldn't find a matching product. Try a different spelling or a broader term.</StatePanel>
          : status === "empty" ? <StatePanel icon="⌕" title="What are you curious about?">{message}</StatePanel>
          : <div className="product-grid">{products.map((product, index) => <ProductCard product={product} key={product.code || `${product.product_name}-${index}`} />)}</div>}
      </section>
      <aside className="info-strip"><div><strong>Good food starts with good questions.</strong><p>Product information comes from the open Open Food Facts database. Labels can vary by country and may be incomplete.</p></div><span className="api-pill">↗ Powered by Open Food Facts</span></aside>
    </main>
    <footer className="site-footer"><span>GOODFIND © 2026</span><span>Curiosity looks good on you.</span></footer>
  </>;
}
