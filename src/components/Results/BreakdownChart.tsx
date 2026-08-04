import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatEUR, formatNumber } from '../../lib/format';

export interface BreakdownChartDatum {
  name: string;
  annualEUR: number;
}

interface BreakdownChartProps {
  data: BreakdownChartDatum[];
}

export function BreakdownChart({ data }: BreakdownChartProps) {
  if (data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 8 }}>
          {/* Recharts privzeto riše osi in namig v fiksni temni barvi, ki v temnem
              načinu izgine — zato so vezani na tokene teme. */}
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-border)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-border)"
            width={64}
            tickFormatter={(value) => formatNumber(Number(value))}
          />
          <Tooltip
            formatter={(value) => formatEUR(Number(value))}
            cursor={{ fill: 'var(--color-accent)' }}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
            }}
            labelStyle={{ color: 'var(--color-text)' }}
            itemStyle={{ color: 'var(--color-text)' }}
          />
          {/* Stolpci so velike ploskve, zato lahko uporabijo svetlo znamčno rumeno;
              temna varianta --color-primary-text je rezervirana za besedilo, ki
              potrebuje kontrast na beli podlagi. */}
          <Bar dataKey="annualEUR" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
