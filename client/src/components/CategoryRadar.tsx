import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import type { CategoryBreakdownEntry } from './ProfileScreen';

interface CategoryRadarProps {
  lifetime: Record<string, CategoryBreakdownEntry>;
  recent: Record<string, CategoryBreakdownEntry>;
}

export function CategoryRadar({ lifetime, recent }: CategoryRadarProps) {
  // Union of categories that appear in either dataset.
  const categories = Array.from(new Set([
    ...Object.keys(lifetime),
    ...Object.keys(recent),
  ])).sort();

  if (categories.length === 0) return null;

  const data = categories.map(category => ({
    category,
    lifetime: Math.round(lifetime[category]?.accuracy ?? 0),
    recent: Math.round(recent[category]?.accuracy ?? 0),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.6} />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-soft))' }}
            axisLine={false}
          />
          <Radar
            name="Tüm Maçlar"
            dataKey="lifetime"
            stroke="hsl(var(--success))"
            fill="hsl(var(--success))"
            fillOpacity={0.18}
            strokeWidth={1.5}
          />
          <Radar
            name="Son 10 Maç"
            dataKey="recent"
            stroke="hsl(var(--accent))"
            fill="hsl(var(--accent))"
            fillOpacity={0.12}
            strokeWidth={1.5}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
