
import Button from "@/components/ui/Button"; // Example usage

export default function Home() {
  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      gap: '1rem'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Event Pilot</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Dashboard Foundation Ready</p>
      <Button variant="primary">Get Started</Button>
    </div>
  );
}
