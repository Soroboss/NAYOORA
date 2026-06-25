import Link from "next/link";
import { getPublicPlans, planLimits, planPrice } from "@/lib/public-plans";

export default async function OffersPage() {
  const offers = await getPublicPlans();
  return <main className="offers-page">
    <nav className="nayoora-nav offers-nav"><Link href="/" className="brand"><img src="/nayoora-logo.png" alt="Logo NAYOORA" /> NAYOORA</Link><div className="nav-links"><Link href="/">La plateforme</Link><a href="#tarifs">Tarifs</a></div><div className="nav-actions"><Link href="/login">Connexion</Link></div></nav>
    <section id="tarifs" className="offers-hero"><p className="eyebrow">Des tarifs simples et transparents</p><h1>Choisissez l’offre qui accompagne votre organisation.</h1><p>Vous pourrez évoluer vers une offre supérieure dès que vos besoins grandissent.</p></section>
    <section className="pricing-section offers-pricing"><div className="pricing-grid">{offers.map((offer, index) => <article className={index === 1 ? "pricing-featured" : ""} key={offer.id}>{index === 1 && <b className="pricing-badge">Le plus choisi</b>}<p>{offer.name}</p><h3>{planPrice(offer)} <small>FCFA / mois</small></h3><span>{offer.code === "free" ? "Pour démarrer sereinement" : offer.code === "unlimited" ? "Pour les organisations en mouvement" : "Pour piloter l’activité au quotidien"}</span><ul>{planLimits(offer).map((feature) => <li key={feature}>{feature}</li>)}</ul><Link className={`button ${index === 1 ? "button-primary" : "button-outline"}`} href={`/signup?offer=${offer.code}`}>Choisir {offer.name} <span>→</span></Link></article>)}</div></section>
    <p className="offers-reassurance">Aucune carte bancaire requise pour l’offre Gratuit. Les offres payantes sont activées après votre période d’essai.</p>
  </main>;
}
