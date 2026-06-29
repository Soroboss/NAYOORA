"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/insforge/client";

export function PortalVoting({
  electionId,
  candidates,
  memberId
}: {
  electionId: string;
  candidates: any[];
  memberId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  async function submitVote(e: FormEvent) {
    e.preventDefault();
    if (!selectedCandidate) {
      setError("Veuillez sélectionner un candidat ou le vote blanc.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const insforge = createClient();
      const { error: dbError } = await insforge.from("election_votes").insert({
        election_id: electionId,
        member_profile_id: memberId,
        candidate_id: selectedCandidate === "blanc" ? null : selectedCandidate
      });
      if (dbError) throw dbError;
      
      router.refresh();
    } catch (err: any) {
      setError(`Erreur lors du vote : ${err.message}`);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submitVote}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        {candidates.map(c => (
          <label 
            key={c.id} 
            style={{ 
              display: "flex", 
              alignItems: "flex-start", 
              gap: "12px", 
              padding: "16px", 
              border: `2px solid ${selectedCandidate === c.id ? "#2563eb" : "#e5e7eb"}`, 
              borderRadius: "8px", 
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <input 
              type="radio" 
              name={`vote-${electionId}`} 
              value={c.id} 
              checked={selectedCandidate === c.id}
              onChange={() => setSelectedCandidate(c.id)}
              style={{ marginTop: "4px", width: "18px", height: "18px" }}
            />
            <div>
              <b style={{ display: "block", fontSize: "16px" }}>{c.member?.first_name} {c.member?.last_name}</b>
              <span style={{ color: "#4b5563", fontSize: "14px" }}>Candidat pour : {c.position}</span>
              {c.manifesto && <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px", fontStyle: "italic" }}>"{c.manifesto}"</p>}
            </div>
          </label>
        ))}

        {/* Vote Blanc */}
        <label 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "16px", 
            border: `2px solid ${selectedCandidate === "blanc" ? "#2563eb" : "#e5e7eb"}`, 
            borderRadius: "8px", 
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <input 
            type="radio" 
            name={`vote-${electionId}`} 
            value="blanc" 
            checked={selectedCandidate === "blanc"}
            onChange={() => setSelectedCandidate("blanc")}
            style={{ width: "18px", height: "18px" }}
          />
          <b style={{ fontSize: "16px" }}>Vote Blanc</b>
        </label>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "12px" }}>{error}</p>}

      <button 
        disabled={busy || !selectedCandidate} 
        className="button button-dark" 
        style={{ width: "100%", padding: "14px", fontSize: "16px" }}
      >
        {busy ? "Enregistrement..." : "Confirmer mon vote"}
      </button>
      <p style={{ textAlign: "center", fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
        Votre vote est anonyme et définitif.
      </p>
    </form>
  );
}
