export default function SearchBar({ onSearch, disabled }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSearch(new FormData(event.currentTarget).get("query")?.toString() || "");
  }
  return <form className="search-panel" onSubmit={handleSubmit}>
    <input name="query" type="search" placeholder="Try “dark chocolate” or “oats”..." aria-label="Search food products" autoComplete="off" />
    <button className="search-btn" type="submit" disabled={disabled}>{disabled ? "Searching…" : "Find products ↗"}</button>
  </form>;
}
