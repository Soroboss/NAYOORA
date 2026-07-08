"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Plus, Building2, Wallet, Landmark } from "lucide-react";

type Account = { id: string; name: string; account_type: string; currency: string; balance?: number };
type Transaction = { id: string; direction: string; category: string; amount: number; notes: string; occurred_at: string; cash_accounts?: { name: string } };

export function TreasuryManager({ accounts, transactions, canManage }: { accounts: Account[], transactions: Transaction[], canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);

  // Tx form
  const [txDirection, setTxDirection] = useState("in");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("");
  const [txAccount, setTxAccount] = useState(accounts[0]?.id || "");
  const [txNotes, setTxNotes] = useState("");

  // Acc form
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("cash");

  const totalIn = transactions.filter(t => t.direction === "in").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOut = transactions.filter(t => t.direction === "out").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIn - totalOut;

  async function handleAddTx(e: React.FormEvent) {
    e.preventDefault();
    if (!txAccount || !txAmount || !txCategory) return toast.error("Veuillez remplir tous les champs obligatoires.");
    setBusy(true);
    try {
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: txDirection, amount: Number(txAmount), category: txCategory, cash_account_id: txAccount, notes: txNotes })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Transaction enregistrée.");
      setShowTxModal(false);
      setTxAmount(""); setTxCategory(""); setTxNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accName) return toast.error("Nom du compte requis.");
    setBusy(true);
    try {
      const res = await fetch("/api/treasury/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: accName, account_type: accType })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Compte ajouté.");
      setShowAccModal(false);
      setAccName("");
      if (!txAccount) setTxAccount((await res.json()).id);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Landmark className="w-5 h-5 text-blue-600" />;
      case 'mobile_money': return <span className="text-xl">📱</span>;
      default: return <Wallet className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">Solde Global</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{balance.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-emerald-700 text-sm font-medium flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> Entrées
          </p>
          <p className="text-3xl font-bold mt-2 text-emerald-700">{totalIn.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
          <p className="text-red-700 text-sm font-medium flex items-center gap-2">
            <ArrowDownRight className="w-4 h-4" /> Sorties (Dépenses)
          </p>
          <p className="text-3xl font-bold mt-2 text-red-700">{totalOut.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Comptes de Trésorerie</h2>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/treasury/reports" className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 text-sm">
            Rapports & États
          </Link>
          {canManage && (
            <button onClick={() => setShowAccModal(true)} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 text-sm">
              <Plus className="w-4 h-4" /> Ajouter un compte
            </button>
          )}
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200 border-dashed">
          <p className="text-gray-500 mb-4">Aucun compte de trésorerie n'a été créé.</p>
          {canManage && <button onClick={() => setShowAccModal(true)} className="btn primary">Créer mon premier compte</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const accIn = transactions.filter(t => t.direction === 'in' && t.cash_accounts?.name === acc.name).reduce((sum, t) => sum + Number(t.amount), 0);
            const accOut = transactions.filter(t => t.direction === 'out' && t.cash_accounts?.name === acc.name).reduce((sum, t) => sum + Number(t.amount), 0);
            return (
              <div key={acc.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                    {getAccountIcon(acc.account_type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{acc.account_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{(accIn - accOut).toLocaleString('fr-FR')} F</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-end mt-12 mb-4">
        <h2 className="text-xl font-bold text-gray-900">Historique des transactions</h2>
        {canManage && accounts.length > 0 && (
          <button onClick={() => setShowTxModal(true)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 text-sm">
            <Plus className="w-4 h-4" /> Saisir une opération
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Catégorie</th>
              <th className="px-6 py-3 font-medium">Compte</th>
              <th className="px-6 py-3 font-medium text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Aucune transaction trouvée.</td></tr>
            ) : transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-500">{new Date(tx.occurred_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{tx.category}</span>
                  {tx.notes && <p className="text-gray-500 text-xs mt-1">{tx.notes}</p>}
                </td>
                <td className="px-6 py-4 text-gray-600">{tx.cash_accounts?.name || '-'}</td>
                <td className={`px-6 py-4 text-right font-bold ${tx.direction === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.direction === 'in' ? '+' : '-'}{Number(tx.amount).toLocaleString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAccModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Nouveau compte de trésorerie</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de compte</label>
                <select value={accType} onChange={e => setAccType(e.target.value)} className="w-full p-2.5 border rounded-lg">
                  <option value="cash">Caisse (Espèces)</option>
                  <option value="bank">Banque</option>
                  <option value="mobile_money">Mobile Money (Wave, Orange, etc.)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
                <input type="text" required value={accName} onChange={e => setAccName(e.target.value)} placeholder="Ex: Caisse Principale" className="w-full p-2.5 border rounded-lg" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAccModal(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={busy} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTxModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">Enregistrer une opération</h3>
            <form onSubmit={handleAddTx} className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => setTxDirection("in")} className={`flex-1 py-2 text-sm font-medium rounded-md ${txDirection === "in" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"}`}>Entrée (Recette)</button>
                <button type="button" onClick={() => setTxDirection("out")} className={`flex-1 py-2 text-sm font-medium rounded-md ${txDirection === "out" ? "bg-white text-red-700 shadow-sm" : "text-gray-500"}`}>Sortie (Dépense)</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                  <input type="number" min="1" required value={txAmount} onChange={e => setTxAmount(e.target.value)} placeholder="0" className="w-full p-2.5 border rounded-lg font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compte</label>
                  <select value={txAccount} onChange={e => setTxAccount(e.target.value)} className="w-full p-2.5 border rounded-lg">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <input type="text" required value={txCategory} onChange={e => setTxCategory(e.target.value)} placeholder={txDirection === 'in' ? "Ex: Dons, Subventions, Vente..." : "Ex: Loyer, Achats, Salaire..."} className="w-full p-2.5 border rounded-lg" list="categories-list" />
                <datalist id="categories-list">
                  {txDirection === 'in' ? (
                    <><option value="Dons" /><option value="Cotisations Exceptionnelles" /><option value="Subventions" /><option value="Vente" /></>
                  ) : (
                    <><option value="Loyer" /><option value="Transport" /><option value="Achats" /><option value="Fournitures" /><option value="Salaire" /><option value="Frais Bancaires" /></>
                  )}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optionnel)</label>
                <textarea value={txNotes} onChange={e => setTxNotes(e.target.value)} placeholder="Détails de l'opération..." className="w-full p-2.5 border rounded-lg resize-none h-20" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowTxModal(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={busy} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
