import type { ScanResult } from '../types';

interface ValidationResultProps {
  result: ScanResult | null;
  onDismiss: () => void;
}

export function ValidationResult({ result, onDismiss }: ValidationResultProps) {
  if (!result) return null;

  const isValid = result.success && result.data?.status === 'VALID';
  const isAlreadyUsed = result.data?.status === 'ALREADY_USED';

  const getClassName = () => {
    if (isValid) return 'result-overlay result-valid';
    if (isAlreadyUsed) return 'result-overlay result-warning';
    return 'result-overlay result-error';
  };

  const getIcon = () => {
    if (isValid) return '✅';
    if (isAlreadyUsed) return '⚠️';
    return '❌';
  };

  const getTitle = () => {
    if (isValid) return 'ENTRÉE VALIDÉE';
    if (isAlreadyUsed) return 'DÉJÀ UTILISÉ';
    return 'REFUSÉ';
  };

  const getMessage = () => {
    if (result.error) return result.error;
    return result.data?.message || 'Erreur inconnue';
  };

  return (
    <div className={getClassName()} onClick={onDismiss}>
      <div className="result-content">
        <div className="result-icon">{getIcon()}</div>
        <h1 className="result-title">{getTitle()}</h1>
        <p className="result-message">{getMessage()}</p>

        {result.data && (
          <div className="result-details">
            {result.data.eventName && (
              <p className="event-name">{result.data.eventName}</p>
            )}
            {result.data.ticketId && (
              <p className="ticket-id">Billet: {result.data.ticketId.substring(0, 8)}...</p>
            )}
            {result.data.attendeePhone && (
              <p className="attendee">👤 {result.data.attendeePhone}</p>
            )}
            {isAlreadyUsed && result.data.usedAt && (
              <p className="used-time">⏰ {new Date(result.data.usedAt).toLocaleString()}</p>
            )}
          </div>
        )}

        <p className="dismiss-hint">Appuyez pour continuer</p>
      </div>
    </div>
  );
}
