"use client";

import type { AnalyticsSnapshot } from "@/services/analytics";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E8E8F0",
  boxShadow: "0 4px 20px rgba(30,30,50,0.04)",
  fontSize: 13,
};

export function RiskDistributionChart({ data }: { data: AnalyticsSnapshot["byLevel"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 12 }}>
        <CartesianGrid stroke="#E8E8F0" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" tick={{ fill: "#4F5362", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18}>
          {data.map((entry) => (
            <Cell
              key={entry.level}
              fill={entry.level === "low" ? "#86EFAC" : entry.level === "moderate" ? "#FCD34D" : entry.level === "elevated" ? "#FDBA74" : "#FCA5A5"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ModuleRiskChart({ data }: { data: AnalyticsSnapshot["byModule"] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="#E8E8F0" vertical={false} />
        <XAxis dataKey="module" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="low" stackId="a" fill="#86EFAC" />
        <Bar dataKey="moderate" stackId="a" fill="#FCD34D" />
        <Bar dataKey="elevated" stackId="a" fill="#FDBA74" />
        <Bar dataKey="high" stackId="a" fill="#FCA5A5" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
