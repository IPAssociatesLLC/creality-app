import { Link } from "react-router-dom";
import SubPageNavbar from "@/components/feature/SubPageNavbar";
import Footer from "@/components/feature/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background-50">
      <SubPageNavbar currentPage="privacy" />
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-medium text-foreground-600 uppercase tracking-widest mb-4">Legal</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground-950 leading-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-foreground-500 mb-12">Last updated: June 2026</p>
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-base font-semibold text-foreground-900 mb-3">1. Information We Collect</h2>
              <p className="text-sm text-foreground-500 leading-relaxed">
                CreAIlity is built with privacy as a core principle. We collect your email address for authentication and project data you create to provide the Service. Your API keys and personal settings are stored securely in our encrypted database with user-level isolation.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground-900 mb-3">2. What We Do NOT Collect</h2>
              <p className="text-sm text-foreground-500 leading-relaxed">
                We do not store your AI API keys on our servers, track your browsing activity across other websites, sell your personal data, or read your generated applications beyond what is necessary to provide the Service.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground-900 mb-3">3. Data Storage & Security</h2>
              <p className="text-sm text-foreground-500 leading-relaxed">
                Your project data and API keys are stored securely in our database with user-level isolation and encryption. Your data is never shared with third parties.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground-900 mb-3">4. Your Rights</h2>
              <p className="text-sm text-foreground-500 leading-relaxed">
                You have the right to access, export, and delete your data. You can manage most of these through your account settings or by contacting us.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground-900 mb-3">5. Contact</h2>
              <p className="text-sm text-foreground-500 leading-relaxed">
                Questions about this Privacy Policy? Reach out through our contact page.
              </p>
              <Link to="/contact" className="inline-flex items-center gap-1.5 text-sm text-accent-500 hover:text-accent-600 transition-colors cursor-pointer mt-2 whitespace-nowrap">
                Contact us <i className="ri-arrow-right-line text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}