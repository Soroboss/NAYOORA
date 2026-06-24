import { NextResponse } from "next/server";
import { createClient } from "@/lib/insforge/server";
import { normalizeMember, parseCsv } from "@/lib/members";

const managers = ["organization_admin", "president", "secretaire", "gestionnaire"];
export async function POST(request: Request) {
  const insforge = await createClient(); const { data: { user } } = await insforge.auth.getUser();
  const { data: membership } = user ? await insforge.from("organization_members").select("organization_id,role").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle() : { data: null };
  if (!user || !membership || !managers.includes(membership.role)) return NextResponse.json({ error: "Droits insuffisants." }, { status: 403 });
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) return NextResponse.json({ error: "Choisissez un fichier CSV." }, { status: 400 });
  if (file.size > 2_000_000) return NextResponse.json({ error: "Le fichier CSV ne doit pas dépasser 2 Mo." }, { status: 400 });
  try {
    const rows = parseCsv(await file.text()); const { data: batch, error: batchError } = await insforge.from("member_imports").insert({ organization_id: membership.organization_id, file_name: file.name, total_rows: rows.length, imported_by: user.id }).select("id").single();
    if (batchError || !batch) throw batchError ?? new Error("Import non initialisé.");
    const valid: Record<string, unknown>[] = []; const errors: Record<string, unknown>[] = [];
    rows.forEach((row, index) => { try { const item = normalizeMember(row); valid.push({ organization_id: membership.organization_id, first_name: item.firstName, last_name: item.lastName, phone: item.phone, email: item.email, address: item.address, member_number: item.memberNumber, birth_date: item.birthDate, created_by: user.id }); } catch (error) { errors.push({ import_id: batch.id, organization_id: membership.organization_id, row_number: index + 2, message: error instanceof Error ? error.message : "Ligne invalide.", raw_data: row }); } });
    let imported = 0; if (valid.length) { const { error } = await insforge.from("member_profiles").insert(valid); if (error) throw error; imported = valid.length; }
    if (errors.length) await insforge.from("member_import_errors").insert(errors);
    const status = errors.length ? "completed_with_errors" : "completed"; await insforge.from("member_imports").update({ imported_rows: imported, failed_rows: errors.length, status, completed_at: new Date().toISOString() }).eq("id", batch.id);
    return NextResponse.json({ imported, failed: errors.length, importId: batch.id });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Import impossible." }, { status: 400 }); }
}
