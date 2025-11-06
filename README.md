<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1OATE18AW48P_cPwQPK2R6Qtxaj8PEXHd

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Mode maintenance (accès par mot de passe)

- Définissez `VITE_ACCESS_MODE=locked` pour activer l&apos;écran de verrouillage. Laissez la valeur `public` pour ouvrir l&apos;accès.
- Définissez `VITE_ACCESS_PASSWORD` avec le mot de passe à communiquer aux visiteurs.
- Lancer l&apos;application applique ces variables dans le bundle : toute modification nécessite de redémarrer le serveur de développement ou de redéployer.
- Une page d&apos;assistance est disponible sur la route `/access-admin` (non liée dans l&apos;interface) pour consulter la configuration courante et générer un nouveau mot de passe à recopier dans votre `.env`.
