'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/insforge/client';
import { useRouter } from 'next/navigation';

import { use } from 'react';

export default function CardSettingsPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = use(params);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const insforge = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data: org } = await insforge
        .from('organizations')
        .select('id')
        .eq('slug', organizationSlug)
        .single();
        
      if (!org) return;

      const { data } = await insforge
        .from('organization_card_settings')
        .select('*')
        .eq('organization_id', org.id)
        .single();

      if (data) {
        setSettings(data);
      } else {
        // Defaults if none exist
        setSettings({
          organization_id: org.id,
          is_active: false,
          auto_generate: false,
          theme: 'corporate-blue',
          primary_color: '#1e40af',
          secondary_color: '#3b82f6',
          text_color: '#111827',
          orientation: 'landscape',
          corner_style: 'rounded',
          show_qr: true,
          show_barcode: false,
          show_photo: true,
          legal_mentions: "Cette carte demeure la propriété de l'organisation."
        });
      }
      setLoading(false);
    }
    fetchSettings();
  }, [organizationSlug]);

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await insforge
      .from('organization_card_settings')
      .upsert(settings);
    setSaving(false);
    if (!error) alert("Paramètres enregistrés !");
    else alert("Erreur: " + error.message);
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres des Cartes</h1>
          <p className="text-gray-500">Personnalisez l'apparence des cartes de vos membres.</p>
        </div>
        <button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Général</h2>
            
            <label className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                checked={settings.is_active} 
                onChange={(e) => setSettings({...settings, is_active: e.target.checked})}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">Activer le module de cartes</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                checked={settings.auto_generate} 
                onChange={(e) => setSettings({...settings, auto_generate: e.target.checked})}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-gray-700">Générer automatiquement lors de l'adhésion</span>
            </label>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Design & Couleurs</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur Principale</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={settings.primary_color}
                    onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                    className="h-10 w-10 p-1 border rounded"
                  />
                  <input type="text" value={settings.primary_color} readOnly className="border rounded px-3 py-2 flex-1" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur Secondaire</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                    className="h-10 w-10 p-1 border rounded"
                  />
                  <input type="text" value={settings.secondary_color} readOnly className="border rounded px-3 py-2 flex-1" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style des coins</label>
                <select 
                  value={settings.corner_style}
                  onChange={(e) => setSettings({...settings, corner_style: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                >
                  <option value="rounded">Arrondis</option>
                  <option value="square">Carrés</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Contenu</h2>
            
            <label className="flex items-center space-x-3">
              <input 
                type="checkbox" 
                checked={settings.show_qr} 
                onChange={(e) => setSettings({...settings, show_qr: e.target.checked})}
                className="rounded text-blue-600"
              />
              <span className="font-medium text-gray-700">Afficher le QR Code de vérification</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mentions Légales (Verso)</label>
              <textarea 
                value={settings.legal_mentions}
                onChange={(e) => setSettings({...settings, legal_mentions: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 bg-gray-50 h-24"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <div className="sticky top-24 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Aperçu en direct (Recto)</h2>
            <div 
              style={{
                backgroundColor: '#ffffff',
                border: `4px solid ${settings.primary_color}`,
                borderRadius: settings.corner_style === 'rounded' ? '16px' : '0px',
              }}
              className="w-full aspect-[1.58] shadow-lg relative overflow-hidden flex flex-col font-sans"
            >
              <div 
                style={{ backgroundColor: settings.primary_color }} 
                className="h-12 w-full flex items-center px-4"
              >
                <div className="w-6 h-6 bg-white rounded-full opacity-50 mr-2"></div>
                <span className="text-white font-bold text-lg">NOM ORGANISATION</span>
              </div>
              <div className="flex p-4 flex-1">
                {settings.show_photo && (
                  <div className="w-20 h-24 bg-gray-200 rounded-lg mr-4 border border-gray-300 flex items-center justify-center text-xs text-gray-400">Photo</div>
                )}
                <div className="flex-1 space-y-1 mt-1">
                  <div className="text-xs text-gray-500">Nom Complet</div>
                  <div style={{ color: settings.primary_color }} className="font-bold text-sm">NAGONY ADAMA</div>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <div className="text-[10px] text-gray-500">N° Membre</div>
                      <div className="font-semibold text-xs">0001</div>
                    </div>
                  </div>
                </div>
                {settings.show_qr && (
                  <div className="w-16 h-16 bg-gray-200 border border-gray-300 rounded self-end flex items-center justify-center text-[10px] text-gray-500">QR</div>
                )}
              </div>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-8">Aperçu en direct (Verso)</h2>
            <div 
              style={{
                backgroundColor: '#f9fafb',
                border: `4px solid ${settings.secondary_color}`,
                borderRadius: settings.corner_style === 'rounded' ? '16px' : '0px',
              }}
              className="w-full aspect-[1.58] shadow-lg flex flex-col items-center justify-center p-4 text-center font-sans"
            >
              <div style={{ color: settings.primary_color }} className="font-bold text-lg mb-2">NOM ORGANISATION</div>
              <p className="text-[10px] text-gray-600 w-4/5 mx-auto">
                {settings.legal_mentions}
              </p>
              {settings.show_qr && (
                <div className="w-10 h-10 bg-gray-200 border border-gray-300 mt-4"></div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
