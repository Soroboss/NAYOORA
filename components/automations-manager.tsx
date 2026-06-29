"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/insforge/client";

const DEFAULT_RULES = [
  { type: "contribution_reminder", title: "Relance Cotisations", defaultMessage: "Bonjour [Nom], votre cotisation de [Montant] arrive à échéance le [Date]. Merci de régulariser." },
  { type: "tontine_reminder", title: "Relance Tontine", defaultMessage: "Rappel Tontine : Bonjour [Nom], votre versement de [Montant] est attendu. Merci d'avance." }
];

export function AutomationsManager({ rules, organizationId, canManage }: { rules: any[], organizationId: string, canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function toggleRule(ruleType: string, currentRule: any, active: boolean) {
    if (!canManage) return;
    setBusy(true);
    setNotice("");
    try {
      const insforge = createClient();
      if (currentRule) {
        await insforge.from("automation_rules").update({ is_active: active }).eq("id", currentRule.id);
      } else {
        await insforge.from("automation_rules").insert({
          organization_id: organizationId,
          rule_type: ruleType,
          is_active: active,
          days_before_due: 2,
          message_template: DEFAULT_RULES.find(r => r.type === ruleType)?.defaultMessage || ""
        });
      }
      router.refresh();
      setNotice("✅ Règle mise à jour avec succès.");
    } catch (err: any) {
      setNotice("❌ Erreur : " + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(ruleType: string, currentRule: any, days: number, message: string) {
    if (!canManage) return;
    setBusy(true);
    setNotice("");
    try {
      const insforge = createClient();
      if (currentRule) {
        await insforge.from("automation_rules").update({ days_before_due: days, message_template: message }).eq("id", currentRule.id);
      } else {
        await insforge.from("automation_rules").insert({
          organization_id: organizationId,
          rule_type: ruleType,
          is_active: false,
          days_before_due: days,
          message_template: message
        });
      }
      router.refresh();
      setNotice("✅ Configuration sauvegardée.");
    } catch (err: any) {
      setNotice("❌ Erreur : " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      {notice && <div style={{ padding: "12px", background: notice.startsWith("✅") ? "#dcfce7" : "#fee2e2", color: notice.startsWith("✅") ? "#166534" : "#991b1b", borderRadius: "8px" }}>{notice}</div>}
      
      {DEFAULT_RULES.map(def => {
        const rule = rules.find(r => r.rule_type === def.type);
        const isActive = rule?.is_active || false;
        
        return (
          <div key={def.type} className="panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px" }}>{def.title}</h2>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: canManage ? "pointer" : "default" }}>
                <span style={{ fontSize: "14px", color: isActive ? "#059669" : "#6b7280" }}>{isActive ? "Activée" : "Désactivée"}</span>
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  disabled={busy || !canManage}
                  onChange={(e) => toggleRule(def.type, rule, e.target.checked)}
                  style={{ width: "18px", height: "18px" }}
                />
              </label>
            </div>
            
            <form 
              onSubmit={(e: any) => { 
                e.preventDefault(); 
                saveSettings(def.type, rule, Number(e.target.days.value), e.target.message.value);
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>Délai d'exécution</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Relancer</span>
                    <input type="number" name="days" defaultValue={rule?.days_before_due ?? 2} style={{ width: "80px", padding: "6px" }} disabled={!canManage} />
                    <span>jours avant l'échéance.</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>Message modèle</label>
                  <textarea 
                    name="message" 
                    defaultValue={rule?.message_template || def.defaultMessage} 
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }} 
                    rows={3}
                    disabled={!canManage}
                  />
                  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Variables magiques : [Nom], [Montant], [Date]</p>
                </div>
                {canManage && (
                  <div>
                    <button disabled={busy} className="button button-dark" style={{ padding: "8px 16px" }}>Sauvegarder les réglages</button>
                  </div>
                )}
              </div>
            </form>
          </div>
        );
      })}
    </div>
  );
}
