import Button from './Button'

export default function FinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-accent/20 to-accent/5 border border-accent/30 rounded-3xl p-12 md:p-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Prêt à dynamiser votre équipe ?
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Rejoignez les centaines d'entreprises qui boostent leur cohésion avec BetTeam
          </p>
          <Button variant="primary" size="lg">
            Créer mon espace gratuit
          </Button>
          <p className="text-sm text-white/50 mt-4">
            Aucune carte bancaire requise · Setup en 2 minutes
          </p>
        </div>
      </div>
    </section>
  )
}
