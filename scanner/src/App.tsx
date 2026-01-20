import { useState, useCallback, useEffect } from 'react';
import { QRScanner } from './components/QRScanner';
import { ValidationResult } from './components/ValidationResult';
import { scannerService } from './api';
import type { ScanResult } from './types';
import './App.css';

function App() {
  const [isPaused, setIsPaused] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(scannerService.isAuthenticated());
    
    // Check for token in URL (magic link redirect)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Exchange Magic Token for JWT
      scannerService.verifyMagicToken(token)
        .then(() => {
          setIsAuthenticated(true);
          window.history.replaceState({}, '', '/');
        })
        .catch((err) => {
          console.error("Auth failed", err);
          alert("Lien de connexion invalide ou expiré");
          setIsAuthenticated(false);
        });
    }
  }, []);

  const playSound = useCallback((success: boolean) => {
    if (!isSoundEnabled) return;
    // Use Web Audio API for beeps
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = success ? 800 : 300;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    oscillator.start();
    oscillator.stop(ctx.currentTime + (success ? 0.15 : 0.3));
  }, [isSoundEnabled]);

  const handleScan = useCallback(async (qrContent: string) => {
    if (isValidating || isPaused) return;

    setIsPaused(true);
    setIsValidating(true);

    try {
      // Validate Format: AVOID Web Links (http/https) but ALLOW Tokens (Uuid/JWT)
      if (qrContent.toLowerCase().startsWith('http')) {
        throw new Error('Format QR Code invalide (Ce n\'est pas un billet SikaFlow)');
      }

      const response = await scannerService.validateTicket(qrContent);
      const result: ScanResult = {
        success: response.valid,
        data: response,
        timestamp: new Date(),
      };
      setLastResult(result);
      setHistory((prev) => [result, ...prev.slice(0, 49)]);
      playSound(response.valid);
    } catch (error: any) {
      const result: ScanResult = {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur réseau',
        timestamp: new Date(),
      };
      setLastResult(result);
      setHistory((prev) => [result, ...prev.slice(0, 49)]);
      playSound(false);
    } finally {
      setIsValidating(false);
    }
  }, [isValidating, isPaused, playSound]);

  const handleDismiss = useCallback(() => {
    setLastResult(null);
    setIsPaused(false);
  }, []);

  // NOTE: Auto-dismiss removed intentionally.
  // User must tap "Appuyez pour continuer" to dismiss the result.
  // This prevents infinite rescan loops when the same QR is still in frame.

  const handleLogout = useCallback(() => {
    scannerService.clearToken();
    setIsAuthenticated(false);
  }, []);

  const validCount = history.filter((r) => r.data?.status === 'VALID').length;
  const rejectedCount = history.filter((r) => !r.success || r.data?.status !== 'VALID').length;

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-content">
          <h1>🎫 SikaFlow Scanner</h1>
          <p>Pour accéder au scanner, demandez un lien de connexion via le bot :</p>
          <code>"Connecte-moi au scanner"</code>
          <p className="hint">Le lien sera envoyé sur votre WhatsApp/Telegram</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎫 SikaFlow Scanner</h1>
        <div className="header-actions">
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="icon-btn"
            title={isSoundEnabled ? 'Désactiver le son' : 'Activer le son'}
          >
            {isSoundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="icon-btn"
            title="Historique"
          >
            📋 {history.length}
          </button>
          <button onClick={handleLogout} className="icon-btn logout" title="Déconnexion">
            🚪
          </button>
        </div>
      </header>

      <div className="stats">
        <div className="stat valid">
          <span className="count">{validCount}</span>
          <span className="label">entrées</span>
        </div>
        <div className="stat rejected">
          <span className="count">{rejectedCount}</span>
          <span className="label">refusés</span>
        </div>
      </div>

      <main className="main">
        <QRScanner onScan={handleScan} isPaused={isPaused || isValidating} />
      </main>

      <ValidationResult result={lastResult} onDismiss={handleDismiss} />

      {showHistory && (
        <div className="history-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
            <h2>Historique des scans</h2>
            {history.length === 0 ? (
              <p className="empty">Aucun scan effectué</p>
            ) : (
              <ul>
                {history.map((item, i) => (
                  <li key={i} className={item.success ? 'valid' : 'invalid'}>
                    <span className="dot" />
                    <div>
                      <strong>{item.data?.eventName || 'Inconnu'}</strong>
                      <p>{item.data?.message || item.error}</p>
                      <small>{item.timestamp.toLocaleTimeString()}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}    </div>
  );
}

export default App;
