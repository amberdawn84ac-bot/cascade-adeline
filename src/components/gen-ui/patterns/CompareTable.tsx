'use client';

import { motion } from 'framer-motion';

export interface CompareTableProps {
  title: string;
  columns: string[];
  rows: Array<{
    label: string;
    values: string[];
  }>;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function CompareTable({ title, columns, rows }: CompareTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: CREAM,
        border: `2px solid ${PALM}40`,
        borderRadius: 16,
        padding: '16px 18px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        overflowX: 'auto',
      }}
    >
      <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem', marginBottom: 16 }}>
        {title}
      </div>

      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  background: PAPAYA,
                  color: CREAM,
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderTopLeftRadius: idx === 0 ? 8 : 0,
                  borderTopRightRadius: idx === columns.length - 1 ? 8 : 0,
                  borderRight: idx < columns.length - 1 ? `1px solid ${CREAM}40` : 'none',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <motion.tr
              key={rowIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowIdx * 0.05 }}
            >
              {row.values.map((value, colIdx) => (
                <td
                  key={colIdx}
                  style={{
                    background: rowIdx % 2 === 0 ? '#FFFFFF' : '#F8F6F0',
                    padding: '10px 12px',
                    borderBottom: rowIdx < rows.length - 1 ? '1px solid #E7DAC3' : 'none',
                    borderRight: colIdx < row.values.length - 1 ? '1px solid #E7DAC3' : 'none',
                    color: colIdx === 0 ? PALM : '#4B3424',
                    fontWeight: colIdx === 0 ? 700 : 500,
                    fontSize: '0.9rem',
                    borderBottomLeftRadius: rowIdx === rows.length - 1 && colIdx === 0 ? 8 : 0,
                    borderBottomRightRadius: rowIdx === rows.length - 1 && colIdx === row.values.length - 1 ? 8 : 0,
                  }}
                >
                  {value}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
