import Accordion from './Accordion'

const faqs = [
  {
    question: 'Est-ce légal d\'organiser des pronostics en entreprise ?',
    answer: 'Oui, totalement ! BetTeam est 100% légal car aucun argent réel n\'est en jeu. Il s\'agit uniquement de points virtuels et de classements pour le fun. Nous respectons strictement la législation française et européenne sur les jeux.'
  },
  {
    question: 'Quelles compétitions sont disponibles ?',
    answer: 'Nous couvrons plus de 50 compétitions sportives : football (Ligue 1, Champions League, Premier League...), rugby, tennis, NBA, NFL, formule 1, et même l\'esport (LoL, CS:GO, Dota 2). De nouvelles compétitions sont ajoutées régulièrement.'
  },
  {
    question: 'Comment fonctionne le système de points ?',
    answer: 'C\'est simple : 3 points si vous trouvez le score exact, 2 points si vous trouvez l\'écart de buts, et 1 point si vous trouvez le bon vainqueur. Vous pouvez également personnaliser ces règles dans vos leagues privées.'
  },
  {
    question: 'Y a-t-il une application mobile ?',
    answer: 'Oui ! BetTeam dispose d\'applications natives iOS et Android. Vous pouvez télécharger l\'app depuis l\'App Store ou Google Play, et synchroniser tous vos pronostics en temps réel.'
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Absolument. Nous sommes conformes RGPD et hébergés en Europe. Vos données sont chiffrées, jamais vendues à des tiers, et vous gardez le contrôle total sur vos informations personnelles.'
  }
]

export default function FAQ() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur BetTeam
          </p>
        </div>

        {/* Accordion Items */}
        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <Accordion key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}
