import { Modal } from "@/components/ui/Modal";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" size="lg">
      <div className="max-h-[60vh] overflow-auto space-y-4 text-sm text-ds-text-secondary leading-relaxed pr-2">
        <p>
          Your privacy is important to us. This policy describes how we collect, use, and protect
          your personal data.
        </p>
        <h3 className="text-ds-text-primary font-semibold">1. Data We Collect</h3>
        <p>
          We collect your name, email address, payment information (processed by Stripe), and any
          financial documents you upload for analysis.
        </p>
        <h3 className="text-ds-text-primary font-semibold">2. How We Use Your Data</h3>
        <p>
          Your data is used solely to provide the AI consultation service, including document
          analysis, knowledge graph generation, and strategy recommendations.
        </p>
        <h3 className="text-ds-text-primary font-semibold">3. Data Storage</h3>
        <p>
          Documents and analysis data are stored encrypted on Amazon Web Services (AWS) S3 in the
          EU-West-2 (London) region. Chat histories are stored in our secured database.
        </p>
        <h3 className="text-ds-text-primary font-semibold">4. Right to Deletion</h3>
        <p>
          You can request deletion of all your data at any time by contacting
          support@aiaccountant.co.uk. We will process your request within 30 days.
        </p>
        <h3 className="text-ds-text-primary font-semibold">5. GDPR Compliance</h3>
        <p>
          We comply fully with the UK General Data Protection Regulation (UK GDPR) and the Data
          Protection Act 2018. You have the right to access, rectify, and erase your personal data.
        </p>
        <h3 className="text-ds-text-primary font-semibold">6. Cookies</h3>
        <p>
          We use essential cookies for authentication and session management, and analytical cookies
          to improve our service. You can manage your cookie preferences at any time.
        </p>
      </div>
    </Modal>
  );
}
