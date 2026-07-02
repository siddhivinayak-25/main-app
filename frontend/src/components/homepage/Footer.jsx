import { Sparkles } from 'lucide-react';

export default function Footer() {
  const footerLinks = [
    {
      title: 'Product',
      links: ['Features', 'Pricing', 'Integrations', 'Changelog']
    },
    {
      title: 'Company',
      links: ['About Us', 'Careers', 'Customers', 'Contact']
    },
    {
      title: 'Resources',
      links: ['Documentation', 'Guides', 'Help Center', 'API Reference']
    },
    {
      title: 'Legal',
      links: ['Privacy Policy', 'Terms of Service', 'Security Policy', 'GDPR']
    }
  ];

  return (
    <footer className="bg-surface-raised border-t border-surface-border py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-violet flex items-center justify-center text-white shadow-glow">
                <Sparkles size={16} />
              </div>
              <span className="text-xl font-display font-bold text-ink">HireOS</span>
            </div>
            <p className="text-sm text-muted max-w-sm leading-relaxed">
              Accelerate your team's technical evaluation using AI-driven agentic sandboxes.
            </p>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerLinks.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <span className="text-xs font-bold text-ink tracking-wider uppercase">
                  {group.title}
                </span>
                <ul className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <li key={link}>
                      <span className="text-sm text-muted hover:text-brand-violet cursor-pointer transition-colors">
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-surface-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <span>&copy; {new Date().getFullYear()} HireOS Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <span className="hover:text-brand-violet cursor-pointer">Status</span>
            <span className="hover:text-brand-violet cursor-pointer">Security</span>
            <span className="hover:text-brand-violet cursor-pointer">Privacy Choices</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
