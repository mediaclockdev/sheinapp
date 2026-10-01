// Placeholder rows shown inside a <tbody> while table data loads.
export default function TableSkeleton({ rows = 8, cols }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} className="border-b border-[#ECECEC]" aria-hidden="true">
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} className="p-4">
          <div className="h-4 rounded bg-gray-200 animate-pulse" />
        </td>
      ))}
    </tr>
  ));
}
