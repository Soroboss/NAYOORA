import Link from "next/link";

const offers = [
  { id: "free", name: "Gratuit", price: "0", description: "Pour démarrer sereinement", features: ["Jusqu’à 3 administrateurs", "Jusqu’à 15 membres", "Membres, cotisations & messages"], featured: false },
  { id: "standard", name: "Croissance", price: "6 500", description: "Pour piloter l’activité au quotidien", features: ["Jusqu’à 5 administrateurs", "Jusqu’à 50 membres", "Finances, événements & rapports"], featured: true },
  { id: "unlimited", name: "Illimitée", price: "12 700", description: "Pour les organisations en mouvement", features: ["Administrateurs illimités", "Membres illimités", "Tous les modules NAYOORA"], featured: false },
] as const;

export default function OffersPage() {
  return <main className="offers-page">
    <nav className="nayoora-nav offers-nav"><Link href="/" className="brand"><img src="/nayoora-logo.png" alt="Logo NAYOORA" /> NAYOORA</Link><div className="nav-links"><Link href="/">La plateforme</Link><a href="#tarifs">Tarifs</a></div><div className="nav-actions"><Link href="/login">Connexion</Link></div></nav>
    <section id="tarifs" className="offers-hero"><p className="eyebrow">Des tarifs simples et transparents</p><h1>Choisissez l’offre qui accompagne votre organisation.</h1><p>Vous pourrez évoluer vers une offre supérieure dès que vos besoins grandissent.</p></section>
    <section className="pricing-section offers-pricing"><div className="pricing-grid">{offers.map((offer) => <article className={offer.featured ? "pricing-featured" : ""} key={offer.id}>{offer.featured && <b className="pricing-badge">Le plus choisi</b>}<p>{offer.name}</p><h3>{offer.price} <small>FCFA / mois</small></h3><span>{offer.description}</span><ul>{offer.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Link className={`button ${offer.featured ? "button-primary" : "button-outline"}`} href={`/signup?offer=${offer.id}`}>Choisir {offer.name} <span>→</span></Link></article>)}</div></section>
    <p className="offers-reassurance">Aucune carte bancaire requise pour l’offre Gratuit. Les offres payantes sont activées après votre période d’essai.</p>
  </main>;
}
