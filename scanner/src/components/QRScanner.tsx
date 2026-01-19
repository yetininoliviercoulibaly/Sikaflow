import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isPaused?: boolean;
}

export function QRScanner({ onScan, isPaused = false }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState<string>('');
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);

  const SCAN_COOLDOWN = 2000;

  const handleScan = useCallback((decodedText: string) => {
    const now = Date.now();
    if (
      decodedText === lastScannedRef.current &&
      now - lastScanTimeRef.current < SCAN_COOLDOWN
    ) {
      return;
    }
    lastScannedRef.current = decodedText;
    lastScanTimeRef.current = now;
    onScan(decodedText);
  }, [onScan]);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          const backCamera = devices.find(
            (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('arrière')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        } else {
          setError('Aucune caméra trouvée');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setError('Accès à la caméra refusé');
      });
  }, []);

  useEffect(() => {
    if (!selectedCamera) return;

    const scannerId = 'qr-scanner-region';

    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    if (!isPaused) {
      scanner
        .start(
          selectedCamera,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScan,
          () => {}
        )
        .then(() => setIsStarted(true))
        .catch((err) => {
          console.error('Error starting scanner:', err);
          setError('Erreur de démarrage du scanner');
        });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [selectedCamera, isPaused, handleScan]);

  return (
    <div className="scanner-container">
      {error && <div className="error-banner">{error}</div>}
      
      {cameras.length > 1 && (
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="camera-select"
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label || `Caméra ${camera.id}`}
            </option>
          ))}
        </select>
      )}

      <div className="scanner-viewport">
        <div id="qr-scanner-region" />
        
        {isPaused && (
          <div className="scanner-overlay">
            <p>Scanner en pause</p>
          </div>
        )}

        {!isStarted && !isPaused && !error && (
          <div className="scanner-loading">
            <div className="spinner" />
          </div>
        )}
      </div>

      <p className="scanner-hint">Pointez vers un QR code de billet</p>
    </div>
  );
}
