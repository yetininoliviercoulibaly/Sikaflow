import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onQrRemoved?: () => void; // Called when QR is no longer detected
  isPaused?: boolean;
}

export function QRScanner({ onScan, onQrRemoved, isPaused = false }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState<string>('');
  const lastScannedRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const noQrDetectedCountRef = useRef<number>(0);

  const SCAN_COOLDOWN = 30000; // 30 seconds - prevents rescanning same QR too soon
  const NO_QR_THRESHOLD = 15; // ~1.5 seconds at 10fps before considering QR removed

  const handleScan = useCallback((decodedText: string) => {
    const now = Date.now();
    // Reset the "no QR" counter when we detect a QR
    noQrDetectedCountRef.current = 0;
    
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

  const handleNoQrDetected = useCallback(() => {
    // Only trigger if we had a previous scan and onQrRemoved is provided
    if (lastScannedRef.current && onQrRemoved) {
      noQrDetectedCountRef.current++;
      
      // After ~1.5 seconds of no QR detection, consider it removed
      if (noQrDetectedCountRef.current >= NO_QR_THRESHOLD) {
        noQrDetectedCountRef.current = 0;
        lastScannedRef.current = ''; // Clear so next scan of same QR works
        lastScanTimeRef.current = 0;
        onQrRemoved();
      }
    }
  }, [onQrRemoved]);

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

  // Safe stop helper - checks state before stopping
  const safeStopScanner = useCallback(async (scanner: Html5Qrcode | null) => {
    if (!scanner) return;
    try {
      const state = scanner.getState();
      // Only stop if scanning or paused (2 = SCANNING, 3 = PAUSED)
      if (state === 2 || state === 3) {
        await scanner.stop();
      }
    } catch (e) {
      // Ignore stop errors
      console.warn('Scanner stop warning:', e);
    }
  }, []);

  useEffect(() => {
    if (!selectedCamera) return;

    const scannerId = 'qr-scanner-region';

    // Clean up previous scanner
    safeStopScanner(scannerRef.current).then(() => {
      scannerRef.current = null;
    });

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        selectedCamera,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScan,
        handleNoQrDetected // Called when no QR is detected in frame
      )
      .then(() => setIsStarted(true))
      .catch((err) => {
        console.error('Error starting scanner:', err);
        setError('Erreur de démarrage du scanner');
      });

    return () => {
      safeStopScanner(scannerRef.current);
      scannerRef.current = null;
    };
  }, [selectedCamera, handleScan, handleNoQrDetected, safeStopScanner]);

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
