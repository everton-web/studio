import { navigation, site, social } from "@/data/content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a className="wordmark" href="#hero" aria-label="Mello Mídias, voltar ao início">mello<span>mídias</span><span className="brand-dot" aria-hidden="true">.</span></a>
          <p>Assessoria de performance comercial para clínicas odontológicas. Tráfego, comercial e dados em um só sistema.</p>
        </div>
        <nav className="footer-nav" aria-label="Seções">
          <p className="footer-label">Navegação</p>
          <ul>
            {navigation.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}
            <li><a href={site.ctaHref}>Plano Estratégico</a></li>
          </ul>
        </nav>
        <div className="footer-social">
          <p className="footer-label">Acompanhe</p>
          <ul>
            <li>
              <a href={social.instagram} target="_blank" rel="noopener noreferrer">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" /></svg>
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>{site.copyright}</p>
        <a href="#hero" className="footer-top">
          Voltar ao topo
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
        </a>
      </div>
    </footer>
  );
}
