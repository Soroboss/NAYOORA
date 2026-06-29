"use client";
import Link from "next/link";

export function RecentActivity({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="empty-state">
        <div>⌁</div>
        <h3>Données synchronisées.</h3>
        <p>En attente de nouvelles activités (paiements, nouveaux membres, etc.).</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
      {activities.map((act, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ 
            width: '32px', height: '32px', 
            borderRadius: '50%', 
            backgroundColor: act.type === 'payment' ? '#d1fae5' : '#e0e7ff',
            color: act.type === 'payment' ? '#059669' : '#4f46e5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', flexShrink: 0
          }}>
            {act.type === 'payment' ? '💰' : '👤'}
          </div>
          <div>
            <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>
              {act.description}
            </p>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {new Date(act.date).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
      ))}
      <Link href="/dashboard/insights" style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '500', marginTop: '8px', display: 'inline-block' }}>
        Voir tout l'historique →
      </Link>
    </div>
  );
}
