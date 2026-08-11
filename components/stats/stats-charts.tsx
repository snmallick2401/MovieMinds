"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#8b5cf6", "#22c55e", "#f59e0b", "#38bdf8", "#ef4444"];
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

export function StatsCharts({ stats, ratingStats }: { stats: StatsData; ratingStats: RatingStatsData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Ratings trend over time">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={ratingStats.monthlyActivity}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis domain={[0, 10]} fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="average" stroke="#f59e0b" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Ratings distribution">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={ratingStats.distribution}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="rating" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="#f59e0b" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Media types rated">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={ratingStats.mediaTypeBreakdown}
              dataKey="count"
              nameKey="name"
              outerRadius={85}
              label
            >
              {ratingStats.mediaTypeBreakdown.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Average rating by genre">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={ratingStats.genreAverages} layout="vertical">
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 10]} fontSize={12} />
            <YAxis type="category" dataKey="name" width={90} fontSize={12} />
            <Tooltip />
            <Bar dataKey="average" fill="#22c55e" radius={[0, 5, 5, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
