// Client-side filtering for the admin agent list.
// Two rating rules that are easy to get wrong:
//  - minRating 1 is the dropdown's floor and means "no minimum", so unrated agents
//    (rating === null, i.e. pending review) stay visible — hiding them would bury
//    the very rows an admin needs to act on.
//  - above the floor, unrated agents drop out. The explicit null check matters:
//    `null >= 4` is true in JS, so without it they'd silently pass every threshold.
export const filterAgents = (agents, { region, status, minRating } = {}) =>
  agents.filter(
    (a) =>
      (!region || region === "All" || a.region === region) &&
      (!status || status === "All" || a.status === status) &&
      (!minRating ||
        minRating <= 1 ||
        (a.rating != null && a.rating >= minRating)),
  );

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
