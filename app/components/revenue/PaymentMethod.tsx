"use client";

import { motion } from "framer-motion";
import type { PaymentMethod } from "../../revenue/mockRevenue";

type PaymentMethodBreakdownProps = {
  data: PaymentMethod[];
};

export function PaymentMethodBreakdown({ data }: PaymentMethodBreakdownProps) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.06)] sm:p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">Payment Method Breakdown</p>
        <p className="text-sm text-slate-500">Revenue split by payment channel</p>
      </div>

      {/* Stacked horizontal bar */}
      <div className="mt-5 flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
        {data.map((method, i) => {
          return (
            <motion.div
              key={method.method}
              initial={{ width: 0 }}
              animate={{ width: `${method.percentage}%` }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              className={`${method.color} h-full first:rounded-l-full last:rounded-r-full`}
              style={{ minWidth: method.percentage > 0 ? 4 : 0 }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 space-y-3">
        {data.map((method, i) => (
          <motion.div
            key={method.method}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.06, ease: "easeOut" }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${method.color}`} />
              <span className="text-sm font-medium text-slate-700">{method.method}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                ₹{(method.amount / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-slate-500">
                {method.percentage}% · {method.count} transactions
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}