import { NextResponse } from 'next/server';
import { createClient } from '@/lib/insforge/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const payload = await request.json();
    const { title, storage_path, mime_type, size_bytes, visibility } = payload;

    if (!title || !storage_path) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Identify org from user
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Organisation introuvable' }, { status: 403 });
    }

    // Insert document record
    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: member.organization_id,
        title,
        storage_path,
        mime_type: mime_type || null,
        size_bytes: size_bytes || null,
        visibility: visibility || 'members',
        uploaded_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Erreur d\'insertion en base' }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: data });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Verify role
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!member || !["organization_admin", "president", "secretaire", "gestionnaire"].includes(member.role)) {
      return NextResponse.json({ error: 'Droits insuffisants pour supprimer un document' }, { status: 403 });
    }

    // Verify doc belongs to org
    const { data: doc } = await supabase
      .from('documents')
      .select('organization_id, storage_path')
      .eq('id', id)
      .single();

    if (!doc || doc.organization_id !== member.organization_id) {
      return NextResponse.json({ error: 'Document non trouvé ou accès interdit' }, { status: 404 });
    }

    // Delete from db
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
