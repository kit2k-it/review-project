"use client";

import React from "react";
import {
  LineChart,
  Line,
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

interface LineChartCardProps {
  title: string;
  description?: string;
  data: DataPoint[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisDataKey: string;
  height?: number;
}

export function LineChartCard({
  title,
  description,
  data,
  lines,
  xAxisDataKey,
  height = 300,
}: LineChartCardProps) {
  return (
    <div className="w-full">
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey={xAxisDataKey}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              // Short date format: "MM/DD"
              if (typeof value === 'string' && value.includes('-')) {
                const [month, day] = value.split('-');
                return `${month}/${day}`;
              }
              return value;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
