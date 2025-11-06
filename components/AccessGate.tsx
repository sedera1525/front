import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'fjkm-access-token';

type AccessGateProps = {
  children: React.ReactNode;
};

type GateState = 'checking' | 'granted' | 'denied';

const AccessGate: React.FC<AccessGateProps> = ({ children }) => {
  const accessMode = import.meta.env.VITE_ACCESS_MODE ?? 'public';
  const accessPassword = import.meta.env.VITE_ACCESS_PASSWORD ?? '';

  const shouldLock = useMemo(() => (
    accessMode.trim().toLowerCase() === 'locked' && accessPassword.trim().length > 0
  ), [accessMode, accessPassword]);

  const [state, setState] = useState<GateState>('checking');
  const [inputPassword, setInputPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!shouldLock) {
      setState('granted');
      return;
    }

    try {
      const storedToken = localStorage.getItem(STORAGE_KEY);
      if (storedToken && storedToken === window.btoa(accessPassword)) {
        setState('granted');
      } else {
        setState('denied');
      }
    } catch (error) {
      console.error('Impossible de lire le jeton d\'accès depuis le stockage', error);
      setState('denied');
    }
  }, [shouldLock, accessPassword]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shouldLock) {
      setState('granted');
      return;
    }

    if (inputPassword === accessPassword) {
      try {
        localStorage.setItem(STORAGE_KEY, window.btoa(accessPassword));
      } catch (error) {
        console.error('Impossible d\'écrire le jeton d\'accès dans le stockage', error);
      }
      setState('granted');
      setErrorMessage('');
      setInputPassword('');
      return;
    }

    setErrorMessage('Mot de passe incorrect. Réessayez.');
  };

  if (state === 'granted') {
    return <>{children}</>;
  }

  // While we are still checking the stored credentials, keep the UI blank to avoid flashing the content.
  if (state === 'checking') {
    return <div className="min-h-screen bg-gray-100" />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 text-center">Accès réservé</h1>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Merci de saisir le mot de passe de maintenance pour accéder au site.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="maintenance-password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="maintenance-password"
              type="password"
              value={inputPassword}
              onChange={(event) => setInputPassword(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Entrez le mot de passe"
              autoComplete="current-password"
              required
            />
          </div>
          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Déverrouiller
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center">
          Ce verrouillage est géré côté client. Modifiez les variables d&apos;environnement Vite pour le désactiver ou pour changer le mot de passe.
        </p>
      </div>
    </div>
  );
};

export default AccessGate;
