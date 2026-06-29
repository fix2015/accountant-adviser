import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-ds-border-default bg-ds-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-ds-text-primary">AI Accountant Adviser</span>
            </div>
            <p className="text-sm text-ds-text-muted max-w-md leading-relaxed">
              AI-powered tax consultation for UK businesses. Get expert advice powered by artificial
              intelligence trained on millions of company financial records.
            </p>
            <p className="mt-4 text-xs text-ds-text-muted leading-relaxed">
              Disclaimer: AI Accountant Adviser provides AI-generated guidance for informational purposes
              only. This does not constitute professional accounting or tax advice. Always consult a
              licensed accountant or tax professional before making financial decisions.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Product</h3>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Pricing</a></li>
              <li><a href="#how-it-works" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Legal</h3>
            <ul className="space-y-2.5">
              <li><Link to="/terms" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Privacy Policy</Link></li>
              <li><a href="mailto:support@aiaccountant.co.uk" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ds-border-default pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ds-text-muted">
            &copy; {new Date().getFullYear()} AI Accountant Adviser. All rights reserved.
          </p>
          <p className="text-xs text-ds-text-muted">
            Made in the UK. Not a substitute for professional advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
