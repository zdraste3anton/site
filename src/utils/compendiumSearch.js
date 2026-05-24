export function matchesCompendiumItem(item, query) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
  return (
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    inTags
  );
}
