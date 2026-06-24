export type MemberInput = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  address?: string;
  memberNumber?: string;
  birthDate?: string;
};

export type CsvRow = Record<string, string>;

const acceptedHeaders: Record<string, keyof MemberInput> = {
  prenom: "firstName", firstname: "firstName", first_name: "firstName",
  nom: "lastName", lastname: "lastName", last_name: "lastName",
  telephone: "phone", phone: "phone", tel: "phone",
  email: "email", adresse: "address", address: "address",
  matricule: "memberNumber", numero_membre: "memberNumber", member_number: "memberNumber",
  date_naissance: "birthDate", birth_date: "birthDate"
};

export function normalizeMember(input: Partial<MemberInput>): MemberInput {
  const firstName = input.firstName?.trim() ?? "";
  const lastName = input.lastName?.trim() ?? "";
  if (firstName.length < 2 || lastName.length < 2) throw new Error("Le prénom et le nom doivent contenir au moins 2 caractères.");
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new Error("L'adresse email est invalide.");
  return { firstName, lastName, phone: input.phone?.trim() || undefined, email: input.email?.trim().toLowerCase() || undefined, address: input.address?.trim() || undefined, memberNumber: input.memberNumber?.trim() || undefined, birthDate: input.birthDate || undefined };
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("Le fichier doit contenir une ligne d'en-têtes et au moins un membre.");
  const split = (line: string) => { const values: string[] = []; let value = ""; let quoted = false; for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"' && line[i + 1] === '"') { value += '"'; i++; } else if (char === '"') quoted = !quoted; else if ((char === "," || char === ";") && !quoted) { values.push(value.trim()); value = ""; } else value += char; } values.push(value.trim()); return values; };
  const headers = split(lines[0]).map((header) => acceptedHeaders[header.toLowerCase().trim().replace(/\s+/g, "_")]);
  if (!headers.includes("firstName") || !headers.includes("lastName")) throw new Error("Colonnes requises : Prénom et Nom.");
  return lines.slice(1).map((line) => Object.fromEntries(split(line).map((value, index) => [headers[index] ?? `ignored_${index}`, value])));
}
