export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div>
            <img src="/logo.svg" alt="BetTeam" className="h-12" />
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">
              Mentions légales
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Politique de confidentialité
            </a>
            <a href="#" className="hover:text-white transition-colors">
              CGU
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-white/60">
            &copy; 2026 BetTeam. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  )
}
