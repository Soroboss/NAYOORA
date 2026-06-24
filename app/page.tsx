import Link from "next/link";

export default function Home() {
  return <main className="marketing-shell">
    <nav className="marketing-nav"><Link href="/" className="brand"><img src="/nayoora-logo.png" alt="" /> NAYOORA</Link><div><Link href="/login">Connexion</Link><Link className="button button-dark" href="/signup">Créer mon espace</Link></div></nav>
    <section className="hero"><p className="eyebrow">NAYOORA · Gérez. Connectez. Développez.</p><h1>Votre organisation avance mieux quand tout est <em>réuni.</em></h1><p className="hero-copy">Membres, cotisations, caisse, événements et rapports : une plateforme claire pour les mutuelles, associations, coopératives, syndicats, ONG et partis politiques.</p><div className="hero-actions"><Link className="button button-dark" href="/signup">Commencer gratuitement <span>→</span></Link><a className="text-link" href="#organisations">Découvrir la plateforme</a></div></section>
    <section id="organisations" className="type-strip"><p>Une expérience pensée pour</p><div><span>Mutuelles</span><span>Associations</span><span>Coopératives</span><span>ONG</span><span>Syndicats</span><span>Partis</span></div></section>
    <section className="value-grid"><article><b>01</b><h2>Simple pour tous</h2><p>Une interface mobile, claire et adaptée aux réalités de terrain.</p></article><article><b>02</b><h2>Votre espace, vos règles</h2><p>Chaque organisation est strictement isolée et configurable.</p></article><article><b>03</b><h2>Prêt à grandir</h2><p>Paiement Mobile Money, notifications et analyses intelligentes peuvent s'ajouter au fil du temps.</p></article></section>
  </main>;
}
