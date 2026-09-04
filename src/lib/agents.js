// The API returns profile-shaped agents; the table wants the fixture shape.
// Names differ per field and some don't exist server-side yet, hence the fallbacks.
export const toRow = (a) => ({
  ...a, // raw fields ride along for the detail page
  id: a.id ?? a._id ?? "—",
  name:
    a.name ||
    [a.firstName, a.lastName].filter(Boolean).join(" ") ||
    a.email ||
    "Unknown",
  region: a.region ?? a.location ?? "—",
  joined: a.joined ?? formatJoined(a.dateJoined),
  batches: Number(a.batches ?? a.totalBatches ?? 0),
  revenue: Number(a.revenue ?? a.totalRevenue ?? 0),
  // The list endpoint calls it trustRating; the detail endpoint calls it rating.
  rating:
    (a.rating ?? a.trustRating) == null
      ? null
      : Number(a.rating ?? a.trustRating),
  status: (a.status ?? "—").toUpperCase(),
});

const formatJoined = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
