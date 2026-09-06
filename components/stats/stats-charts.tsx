"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#38bdf8", "#ec4899", "#ef4444"];

const MEDIA_TYPE_LABELS: Record<string, string> = {
  MOVIE: "Movie",
  TV: "TV Series",
  ANIME: "Anime",
  ANIME_MOVIE: "Anime Movie",
  OVA: "OVA",
  DOCUMENTARY: "Documentary",
  SPECIAL: "Special",
};

function formatMonth(dateStr: string): string {
  try {
    const [year, month] = dateStr.split("-");
    if (!year || !month) return dateStr;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export type StatsData = {
  watchesByMonth: Array<{ month: string; count: number }>;
  ratingsDistribution: Array<{ rating: string; count: number }>;
  mediaTypes: Array<{ name: string; count: number }>;
  favoriteGenres: Array<{ name: string; count: number }>;
};

export type RatingStatsData = {
  totalRatings: number;
  averageRating: number | null;
  distribution: Array<{ rating: number; count: number; percentage: number }>;
  monthlyActivity: Array<{ month: string; count: number; average: number }>;
  mediaTypeBreakdown: Array<{ name: string; count: number }>;
  genreAverages: Array<{ name: string; average: number; count: number }>;
};

export function StatsCharts({ ratingStats }: { stats?: StatsData; ratingStats: RatingStatsData }) {
  // Sort distribution ascending from 0.5 up to 7, guaranteeing no lingering > 7 buckets
  const sortedDistribution = [...(ratingStats.distribution || [])]
    .filter((a) => a.rating <= 7)
    .sort((a, b) => a.rating - b.rating);

  // Format monthly activity with human readable month names
  const formattedMonthly = (ratingStats.monthlyActivity || []).map((item) => ({
    ...item,
    displayMonth: formatMonth(item.month),
  }));

  // Format media types with human labels
  const formattedMediaTypes = (ratingStats.mediaTypeBreakdown || []).map((entry) => ({
    ...entry,
    displayName: MEDIA_TYPE_LABELS[entry.name] || entry.name,
  }));

  // Format genre averages with rounded ratings
  const formattedGenres = (ratingStats.genreAverages || []).map((g) => ({
    ...g,
    displayRating: Number(g.average.toFixed(1)),
  }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* 1. Ratings trend over time */}
      <ChartCard title="Ratings trend over time">
        {formattedMonthly.length === 0 ? (
          <EmptyChartState message="No rating trends yet. Rate titles to track your rating changes over time." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={formattedMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} strokeDasharray="3 3" />
              <XAxis
                dataKey="displayMonth"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                domain={[0, 7]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border bg-card/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md">
                      <p className="font-semibold text-foreground">{data.displayMonth || data.month}</p>
                      <p className="mt-1 text-amber-400 font-medium">
                        Avg Rating: <span className="font-bold text-foreground">{data.average}</span> / 7 ★
                      </p>
                      <p className="text-muted-foreground">
                        {data.count} rating{data.count === 1 ? "" : "s"} recorded
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "hsl(var(--card))" }}
                activeDot={{ r: 7, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 2. Ratings distribution */}
      <ChartCard title="Ratings distribution">
        {ratingStats.totalRatings === 0 ? (
          <EmptyChartState message="No ratings given yet. Rate movies and shows to see your rating distribution." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sortedDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} strokeDasharray="3 3" />
              <XAxis
                dataKey="rating"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border border-border bg-card/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md">
                      <p className="font-semibold text-foreground">Rating: {label} / 7 ★</p>
                      <p className="mt-1 text-amber-400 font-medium">
                        Count: <span className="font-bold text-foreground">{item.value}</span> title{item.value === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 3. Media types rated */}
      <ChartCard title="Media types rated">
        {formattedMediaTypes.length === 0 ? (
          <EmptyChartState message="No media types rated yet." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={formattedMediaTypes}
                dataKey="count"
                nameKey="displayName"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {formattedMediaTypes.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border border-border bg-card/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-muted-foreground">
                        <span className="font-bold text-foreground">{item.value}</span> rated title{item.value === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 4. Average rating by genre */}
      <ChartCard title="Average rating by genre">
        {formattedGenres.length === 0 ? (
          <EmptyChartState message="No genre ratings available yet." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={formattedGenres} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.4} strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 7]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={85}
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--foreground))" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0];
                  const count = item.payload?.count;
                  return (
                    <div className="rounded-lg border border-border bg-card/95 px-3.5 py-2.5 text-xs shadow-xl backdrop-blur-md">
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="mt-1 text-emerald-400 font-medium">
                        Average: <span className="font-bold text-foreground">{item.value}</span> / 7 ★
                      </p>
                      {count && (
                        <p className="text-muted-foreground">
                          {count} title{count === 1 ? "" : "s"} rated
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="displayRating" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center text-center text-muted-foreground px-4">
      <p className="text-xs">{message}</p>
    </div>
  );
}
