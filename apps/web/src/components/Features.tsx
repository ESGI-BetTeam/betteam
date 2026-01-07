import { Users, Trophy, TrendingUp, Calendar, Smartphone, ShieldCheck } from 'lucide-react'
import Card from './Card'

const features = [
  {
    icon: Users,
    title: 'Leagues privées',
    description: 'Créez vos propres leagues privées et invitez vos collègues en un clic.'
  },
  {
    icon: Trophy,
    title: 'Multi-compétitions',
    description: 'Football, rugby, tennis, NBA, esport... Plus de 50 compétitions disponibles.'
  },
  {
    icon: TrendingUp,
    title: 'Classements temps réel',
    description: 'Suivez le classement de votre league en direct avec des statistiques détaillées.'
  },
  {
    icon: Calendar,
    title: 'Events custom',
    description: 'Organisez vos propres événements et tournois internes personnalisés.'
  },
  {
    icon: Smartphone,
    title: 'App mobile',
    description: 'Applications natives iOS et Android pour pronostiquer partout, tout le temps.'
  },
  {
    icon: ShieldCheck,
    title: '100% sans argent',
    description: 'Totalement légal et conforme. Zéro argent, que du fun et de la cohésion.'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Une plateforme complète pour dynamiser l'esprit d'équipe à travers les pronostics sportifs
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} hover>
                <div className="flex flex-col items-start">
                  <div className="bg-accent/10 p-3 rounded-lg mb-4">
                    <Icon className="text-accent" size={28} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
