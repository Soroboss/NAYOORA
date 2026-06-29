import { z } from "zod";

export const memberSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  phone: z.string().optional().transform(v => v?.trim() || undefined),
  email: z.string().email("L'adresse email est invalide.").optional().or(z.literal("")).transform(v => v?.trim().toLowerCase() || undefined),
  address: z.string().optional().transform(v => v?.trim() || undefined),
  memberNumber: z.string().optional().transform(v => v?.trim() || undefined),
  birthDate: z.string().optional().transform(v => v?.trim() || undefined),
  photoUrl: z.string().optional().transform(v => v?.trim() || undefined),
  title: z.string().optional().transform(v => v?.trim() || undefined),
  reportsTo: z.string().optional().transform(v => v?.trim() || undefined)
}).refine(data => {
  if (data.photoUrl?.startsWith("data:")) return false;
  return true;
}, { message: "La photo doit être uploadée dans le stockage InsForge, pas envoyée comme lien encodé.", path: ["photoUrl"] });

export type MemberInput = z.infer<typeof memberSchema>;

export type CsvRow = Record<string, string>;

const acceptedHeaders: Record<string, string> = {
  prenom: "firstName", firstname: "firstName", first_name: "firstName",
  nom: "lastName", lastname: "lastName", last_name: "lastName",
  telephone: "phone", phone: "phone", tel: "phone",
  email: "email", adresse: "address", address: "address",
  matricule: "memberNumber", numero_membre: "memberNumber", member_number: "memberNumber",
  date_naissance: "birthDate", birth_date: "birthDate"
};

export function normalizeMember(input: unknown): MemberInput {
  return memberSchema.parse(input);
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("Le fichier doit contenir une ligne d'en-têtes et au moins un membre.");
  const split = (line: string) => { const values: string[] = []; let value = ""; let quoted = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"' && line[i + 1] === '"') { value += '"'; i++; } else if (char === '"') quoted = !quoted; else if ((char === "," || char === ";") && !quoted) { values.push(value.trim()); value = ""; } else value += char; } values.push(value.trim()); return values; };
  const headers = split(lines[0]).map((header) => acceptedHeaders[header.toLowerCase().trim().replace(/\s+/g, "_")]);
  if (!headers.includes("firstName") || !headers.includes("lastName")) throw new Error("Colonnes requises : Prénom et Nom.");
  return lines.slice(1).map((line) => Object.fromEntries(split(line).map((value, index) => [headers[index] ?? `ignored_${index}`, value])));
}
