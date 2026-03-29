import { useQuery } from "@tanstack/react-query";

interface AnalyticsSpike {
  timestamp: string;
  value: number;
  prev_value: number;
}

interface AnalyticsResponse {
  spikes: AnalyticsSpike[];
}

export function AnalyticsSpikes() {
  const { data, isLoading, error } = useQuery<AnalyticsResponse>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) return <div className="skeleton h-24 rounded-lg">Loading spikes…</div>;
  if (error) return <div className="text-red-500">Error loading analytics data.</div>;
  if (!data?.spikes?.length) return <div className="text-muted-foreground">No spikes detected.</div>;

  return (
    <div className="bg-card p-4 rounded-xl shadow">
      <div className="theme-kicker mb-2">Analytics Spikes</div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">Timestamp</th>
            <th className="text-left">Value</th>
            <th className="text-left">Previous</th>
          </tr>
        </thead>
        <tbody>
          {data.spikes.map((row, i) => (
            <tr key={i} className="border-b last:border-none">
              <td>{row.timestamp}</td>
              <td className="font-bold text-emerald-500">{row.value}</td>
              <td className="text-muted-foreground">{row.prev_value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
