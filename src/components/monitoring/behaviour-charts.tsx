"use client";

import { Card } from "@/components/ui/display";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function BehaviourTrends({
  attention,
  offTask,
  completion,
}: {
  attention: { label: string; value: number }[];
  offTask: { label: string; value: number }[];
  completion: { label: string; value: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <MiniChart title="Attention Duration Over Time" data={attention} kind="line" />
      <MiniChart title="Off-Task Events Over Time" data={offTask} kind="bar" />
      <MiniChart title="Task Completion Over Time" data={completion} kind="line" />
    </div>
  );
}

function MiniChart({ title, data, kind }: { title: string; data: { label: string; value: number }[]; kind: "line" | "bar" }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-heading">{title}</h2>
      <div className="mt-3 h-40">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            {kind === "line" ? (
              <LineChart data={data}>
                <CartesianGrid stroke="#E8E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Line dataKey="value" stroke="#5F50C8" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid stroke="#E8E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Bar dataKey="value" fill="#F6C89A" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted">Not enough observations for a trend.</p>
        )}
      </div>
    </Card>
  );
}
