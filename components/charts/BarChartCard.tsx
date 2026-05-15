"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  [key: string]: any;
}

interface BarChartCardProps {
  title: string;
  description?: string;
  data: DataPoint[];
  bars: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisDataKey: string;
  layout?: "horizontal" | "vertical";
  height?: number;
}

export function BarChartCard({
  title,
  description,
  data,
  bars,
  xAxisDataKey,
  layout = "vertical",
  height = 300,
}: BarChartCardProps) {
  const isHorizontal = layout === "vertical";

  return (
    <div className="w-full">
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: isHorizontal ? 80 : 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          {isHorizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey={xAxisDataKey} tick={{ fontSize: 12 }} width={70} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisDataKey} tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
