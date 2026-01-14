
import Card from '@/components/ui/Card';

export default function DashboardPage() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      <Card hoverable glass>
        <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Bienvenue, Admin 👋</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Vous êtes connecté au panneau d'administration d'Event Pilot.
        </p>
      </Card>
      
      <Card hoverable glass>
        <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Statistiques Rapides</h3>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>1,284</div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Billets scannés ce mois-ci</p>
      </Card>

      <Card hoverable glass>
        <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Alertes</h3>
        <p style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>Système opérationnel</p>
      </Card>
    </div>
  );
}
