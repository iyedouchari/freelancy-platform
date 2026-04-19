const Footer = () => {
  return (
    <footer className="mt-10 bg-ink text-slate-200 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-4">
        <div className="space-y-2">
          <div className="inline-flex items-center">
            <img src="/brand-logo.png" alt="Freelancy logo" className="h-5 w-auto object-contain" />
          </div>
          <p className="text-sm text-slate-400">
            La place de marché élégante pour freelances et clients exigeants.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Pour les clients</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Découvrir des freelances</li>
            <li>Publier un projet</li>
            <li>Choisir un budget</li>
            <li>Garantir la qualité</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Pour les freelances</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Trouver des missions</li>
            <li>Soigner son profil</li>
            <li>Envoyer des offres</li>
            <li>Conclure en sécurité</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Entreprise</p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>À propos</li>
            <li>Contact</li>
            <li>Confidentialité</li>
            <li>Conditions</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-400">
          <span>© 2026 Freelancy. Tous droits réservés.</span>
          <span>Démo — navigation limitée</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
