import React, { useState } from 'react';

const generatePassword = (length = 12) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (value) => alphabet[value % alphabet.length]).join('');
};

const AccessControlPage: React.FC = () => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [revealCurrent, setRevealCurrent] = useState(false);

  const accessMode = import.meta.env.VITE_ACCESS_MODE ?? 'public';
  const accessPassword = import.meta.env.VITE_ACCESS_PASSWORD ?? '';

  const handleGenerate = () => {
    const password = generatePassword();
    setGeneratedPassword(password);
    setCopySuccess('');
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess('Copié dans le presse-papiers.');
    } catch (error) {
      console.error('Échec de la copie dans le presse-papiers', error);
      setCopySuccess('Copie impossible. Copiez manuellement.');
    }
  };

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h1 className="text-2xl font-semibold text-indigo-900">Gestion du mode maintenance</h1>
            <p className="mt-3 text-sm text-indigo-800">
              Cette page permet de gérer le mot de passe utilisé lorsque le site est en mode maintenance.
              Les changements doivent être reportés manuellement dans le fichier <code>.env</code> et l&apos;application doit être reconstruite.
              Pensez à invalider le cache pour que les visiteurs reçoivent la nouvelle configuration.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Configuration actuelle</h2>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${accessMode === 'locked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {accessMode === 'locked' ? 'Site verrouillé' : 'Site public'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Variable <code>VITE_ACCESS_MODE</code> : <strong>{accessMode || 'public'}</strong>
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Mot de passe configuré (<code>VITE_ACCESS_PASSWORD</code>) :
              </p>
              <div className="flex items-center gap-2">
                <input
                  type={revealCurrent ? 'text' : 'password'}
                  readOnly
                  value={accessPassword}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setRevealCurrent((value) => !value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {revealCurrent ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Modifiez la valeur directement dans <code>.env</code> puis relancez <code>npm run dev</code> ou reconstruisez le projet.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Générer un nouveau mot de passe</h2>
            <p className="text-sm text-gray-600">
              Utilisez ce générateur pour produire un mot de passe robuste. Après génération, copiez-le,
              mettez à jour <code>VITE_ACCESS_PASSWORD</code> dans votre <code>.env</code> et redéployez.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={generatedPassword}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Générez un mot de passe"
              />
              <button
                type="button"
                onClick={handleGenerate}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Générer
              </button>
              <button
                type="button"
                onClick={() => generatedPassword && handleCopy(generatedPassword)}
                disabled={!generatedPassword}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copier
              </button>
            </div>
            {copySuccess && (
              <p className="text-sm text-green-600">{copySuccess}</p>
            )}
            <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
              <li>Changez également la valeur stockée dans le navigateur en vidant le cache si nécessaire.</li>
              <li>Les visiteurs devront saisir le nouveau mot de passe dès leur prochaine visite.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccessControlPage;
