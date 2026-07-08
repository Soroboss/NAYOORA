"use client";

import { useState, useMemo } from "react";
import { Printer, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";

type Transaction = { id: string; direction: string; category: string; amount: number; notes: string; occurred_at: string; cash_accounts?: { name: string } };

export function TreasuryReports({ orgName, transactions }: { orgName: string; transactions: Transaction[] }) {
  const [period, setPeriod] = useState("all");

  const filteredTransactions = useMemo(() => {
    if (period === "all") return transactions;
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.occurred_at);
      if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === "year") return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, period]);

  const totalIn = filteredTransactions.filter(t => t.direction === 'in').reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = filteredTransactions.filter(t => t.direction === 'out').reduce((s, t) => s + Number(t.amount), 0);
  
  // Group by category
  const categories = useMemo(() => {
    const cats: Record<string, { in: number; out: number }> = {};
    filteredTransactions.forEach(t => {
      if (!cats[t.category]) cats[t.category] = { in: 0, out: 0 };
      if (t.direction === 'in') cats[t.category].in += Number(t.amount);
      if (t.direction === 'out') cats[t.category].out += Number(t.amount);
    });
    return Object.entries(cats).sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out));
  }, [filteredTransactions]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="print-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/dashboard/treasury" className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 text-sm font-medium mb-2">
            <ChevronLeft className="w-4 h-4" /> Retour à la trésorerie
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Rapports Financiers</h1>
        </div>
        <div className="flex gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="p-2 border rounded-lg bg-white shadow-sm text-sm font-medium">
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="all">Depuis toujours</option>
          </select>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 text-sm shadow-sm">
            <Printer className="w-4 h-4" /> Imprimer
          </button>
        </div>
      </div>

      <div className="print-only hidden mb-8 text-center border-b pb-6">
        <h1 className="text-2xl font-bold">{orgName}</h1>
        <h2 className="text-xl mt-2 text-gray-600">État Financier & Journal de Caisse</h2>
        <p className="text-sm mt-1 text-gray-500">Période : {period === 'month' ? 'Mois en cours' : period === 'year' ? 'Année en cours' : 'Toutes les données'}</p>
        <p className="text-sm mt-1 text-gray-400">Édité le {new Date().toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 print-no-border">
          <h3 className="text-lg font-bold mb-4 border-b pb-2">Bilan de la période</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-emerald-700">
              <span className="font-medium">Total des Entrées</span>
              <span className="font-bold text-lg">{totalIn.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between items-center text-red-700">
              <span className="font-medium">Total des Dépenses</span>
              <span className="font-bold text-lg">{totalOut.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="pt-3 border-t mt-3 flex justify-between items-center text-gray-900">
              <span className="font-bold">Résultat Net</span>
              <span className={`font-bold text-xl ${totalIn - totalOut >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {(totalIn - totalOut).toLocaleString('fr-FR')} F
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 print-no-border">
          <h3 className="text-lg font-bold mb-4 border-b pb-2">Grand Livre Simplifié (Par Catégorie)</h3>
          <div className="space-y-3 text-sm max-h-60 overflow-y-auto pr-2">
            {categories.length === 0 ? <p className="text-gray-500 text-center">Aucune donnée.</p> : null}
            {categories.map(([cat, sums]) => (
              <div key={cat} className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{cat}</span>
                <div className="text-right">
                  {sums.in > 0 && <span className="text-emerald-600 block">+{sums.in.toLocaleString('fr-FR')}</span>}
                  {sums.out > 0 && <span className="text-red-600 block">-{sums.out.toLocaleString('fr-FR')}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 print-no-border">
        <h3 className="text-lg font-bold mb-4 border-b pb-2">Journal de Caisse (Détail)</h3>
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500 bg-gray-50 print:bg-transparent">
            <tr>
              <th className="py-2 px-3 font-medium">Date</th>
              <th className="py-2 px-3 font-medium">Compte</th>
              <th className="py-2 px-3 font-medium">Catégorie</th>
              <th className="py-2 px-3 font-medium">Libellé</th>
              <th className="py-2 px-3 font-medium text-right">Entrée</th>
              <th className="py-2 px-3 font-medium text-right">Sortie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">Aucune transaction pour cette période.</td></tr>
            ) : filteredTransactions.map(tx => (
              <tr key={tx.id}>
                <td className="py-3 px-3 text-gray-600">{new Date(tx.occurred_at).toLocaleDateString('fr-FR')}</td>
                <td className="py-3 px-3">{tx.cash_accounts?.name || '-'}</td>
                <td className="py-3 px-3 font-medium text-gray-900">{tx.category}</td>
                <td className="py-3 px-3 text-gray-600 max-w-xs truncate" title={tx.notes}>{tx.notes || '-'}</td>
                <td className="py-3 px-3 text-right text-emerald-600 font-medium">
                  {tx.direction === 'in' ? tx.amount.toLocaleString('fr-FR') : ''}
                </td>
                <td className="py-3 px-3 text-right text-red-600 font-medium">
                  {tx.direction === 'out' ? tx.amount.toLocaleString('fr-FR') : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .app-shell { display: block; }
          .dashboard { margin-left: 0; padding: 0; border: none; box-shadow: none; }
          .dashboard > * { visibility: visible; }
          .dashboard * { visibility: visible; }
          .print-hidden { display: none !important; }
          .print-only { display: block !important; }
          .print-no-border { border: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
