export function sortCatalog(items) {
  return [...items].sort(
    (a, b) =>
      (Number(a.index) || 0) - (Number(b.index) || 0) ||
      String(a.name || "").localeCompare(String(b.name || "")) ||
      String(a.id).localeCompare(String(b.id)),
  );
}
export function categoryAliases(category, key) {
  return [
    ...new Set(
      [key, category?.id, category?.name, category?.name?.toLowerCase()].filter(
        Boolean,
      ),
    ),
  ];
}
export function categoryLabel(category, t) {
  const name = category?.name || category?.id || "";
  return ["spring", "summer", "autumn", "winter"].includes(name.toLowerCase())
    ? t(name.toLowerCase())
    : name;
}
