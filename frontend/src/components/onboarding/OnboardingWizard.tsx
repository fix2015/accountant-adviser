import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  Briefcase,
  Landmark,
  ChevronRight,
  ChevronLeft,
  Upload,
  MessageSquare,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileUpload } from "@/components/documents/FileUpload";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { updateBusinessInfo } from "@/api/auth";
import { cn } from "@/utils/cn";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const BUSINESS_TYPES = [
  { value: "sole_trader", label: "Sole Trader", icon: Briefcase, desc: "Self-employed individual" },
  { value: "limited_company", label: "Limited Company", icon: Building2, desc: "Ltd or PLC registered at Companies House" },
  { value: "partnership", label: "Partnership", icon: Users, desc: "Two or more partners sharing profits" },
  { value: "llp", label: "LLP", icon: Landmark, desc: "Limited Liability Partnership" },
];

const REVENUE_RANGES = [
  { value: "0-25k", label: "Under 25k" },
  { value: "25k-50k", label: "25k - 50k" },
  { value: "50k-100k", label: "50k - 100k" },
  { value: "100k-250k", label: "100k - 250k" },
  { value: "250k-500k", label: "250k - 500k" },
  { value: "500k+", label: "500k+" },
];

const QUESTIONS_BY_TYPE: Record<string, { text: string; question: string }[]> = {
  sole_trader: [
    { text: "What expenses can I claim?", question: "What business expenses can I claim as a sole trader to reduce my tax bill?" },
    { text: "Should I register for VAT?", question: "Should I voluntarily register for VAT as a sole trader, and what are the pros and cons?" },
    { text: "How do I pay less tax?", question: "What are the most effective ways for a sole trader to legally reduce their income tax?" },
    { text: "Should I incorporate?", question: "At what point should I consider incorporating as a limited company instead of staying as a sole trader?" },
    { text: "Pension contributions", question: "How can I use pension contributions to reduce my tax liability as a sole trader?" },
    { text: "Record keeping tips", question: "What financial records do I need to keep as a sole trader and for how long?" },
  ],
  limited_company: [
    { text: "Salary vs dividends", question: "What is the most tax-efficient salary and dividend split for my limited company?" },
    { text: "R&D Tax Credits", question: "Does my limited company qualify for R&D tax credits and how do I claim them?" },
    { text: "Corporation tax planning", question: "What strategies can I use to reduce my corporation tax bill?" },
    { text: "Director's loan account", question: "How does my director's loan account work and what are the tax implications?" },
    { text: "Year-end tax planning", question: "What year-end tax planning steps should I take for my limited company?" },
    { text: "Allowable expenses", question: "What expenses can I claim through my limited company?" },
  ],
  partnership: [
    { text: "Profit sharing strategies", question: "What are the most tax-efficient ways to share profits in a partnership?" },
    { text: "Partner tax obligations", question: "What are my individual tax obligations as a partner in a partnership?" },
    { text: "Should we become an LLP?", question: "Should our partnership convert to an LLP and what are the benefits?" },
    { text: "Capital allowances", question: "How do capital allowances work for partnerships?" },
    { text: "Partnership expenses", question: "What expenses can our partnership claim to reduce tax?" },
    { text: "NIC obligations", question: "How do National Insurance contributions work for partners?" },
  ],
  llp: [
    { text: "Member remuneration", question: "What is the most tax-efficient way to pay LLP members?" },
    { text: "Salaried member rules", question: "Do the salaried member rules apply to me and what are the implications?" },
    { text: "Capital contributions", question: "How are capital contributions to an LLP treated for tax purposes?" },
    { text: "Profit allocation", question: "What are the most tax-efficient ways to allocate profits in an LLP?" },
    { text: "LLP expenses", question: "What expenses can our LLP claim?" },
    { text: "Annual compliance", question: "What annual compliance and filing obligations does our LLP have?" },
  ],
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { upload, isUploading } = useDocuments();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [businessType, setBusinessType] = useState<string>("");
  const [revenueRange, setRevenueRange] = useState<string>("");
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(false);

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSaveBusinessInfo = async () => {
    setIsSaving(true);
    try {
      await updateBusinessInfo({
        business_type: businessType || undefined,
        revenue_range: revenueRange || undefined,
        employee_count: employeeCount,
      });
      await refreshUser();
      goNext();
    } catch {
      // Proceed anyway even if save fails
      goNext();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (file: File) => {
    await upload(file);
    setUploadedFile(true);
  };

  const handleQuestionClick = (question: string) => {
    onComplete();
    navigate(`/dashboard/chat?q=${encodeURIComponent(question)}`);
  };

  const handleFinish = () => {
    onComplete();
  };

  const questions = QUESTIONS_BY_TYPE[businessType] || QUESTIONS_BY_TYPE["sole_trader"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto rounded-2xl bg-ds-bg-secondary border border-ds-border-default shadow-2xl"
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-ds-bg-surface rounded-t-2xl overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-ds-accent-primary to-ds-accent-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 pt-8 pb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  i < step
                    ? "bg-ds-feedback-success text-white"
                    : i === step
                    ? "bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary text-white shadow-lg shadow-ds-accent-primary/30"
                    : "bg-ds-bg-surface text-ds-text-muted border border-ds-border-default"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-12 rounded-full transition-colors duration-300",
                    i < step ? "bg-ds-feedback-success" : "bg-ds-border-default"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-8 pb-8 pt-4 overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="text-center mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-4">
                    <Sparkles className="h-7 w-7 text-ds-text-accent" />
                  </div>
                  <h2 className="text-xl font-bold text-ds-text-primary">
                    Tell us about your business
                  </h2>
                  <p className="text-sm text-ds-text-secondary mt-1">
                    This helps us tailor our advice to your specific situation
                  </p>
                </div>

                {/* Business type cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      onClick={() => setBusinessType(bt.value)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl p-4 border text-left transition-all duration-200 cursor-pointer",
                        businessType === bt.value
                          ? "border-ds-accent-primary bg-ds-accent-primary/10 shadow-md shadow-ds-accent-primary/10"
                          : "border-ds-border-default bg-ds-bg-tertiary hover:border-ds-border-strong hover:bg-ds-bg-surface"
                      )}
                    >
                      <bt.icon
                        className={cn(
                          "h-5 w-5",
                          businessType === bt.value
                            ? "text-ds-text-accent"
                            : "text-ds-text-muted"
                        )}
                      />
                      <div>
                        <p className="text-sm font-semibold text-ds-text-primary">
                          {bt.label}
                        </p>
                        <p className="text-xs text-ds-text-muted mt-0.5">
                          {bt.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Revenue range */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-ds-text-primary mb-2">
                    Annual Revenue
                  </label>
                  <select
                    value={revenueRange}
                    onChange={(e) => setRevenueRange(e.target.value)}
                    className="w-full rounded-lg border border-ds-border-default bg-ds-bg-tertiary px-4 py-2.5 text-sm text-ds-text-primary focus:border-ds-accent-primary focus:outline-none focus:ring-1 focus:ring-ds-accent-primary appearance-none cursor-pointer"
                  >
                    <option value="">Select revenue range</option>
                    {REVENUE_RANGES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employee count */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-ds-text-primary mb-2">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={employeeCount}
                    onChange={(e) =>
                      setEmployeeCount(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full rounded-lg border border-ds-border-default bg-ds-bg-tertiary px-4 py-2.5 text-sm text-ds-text-primary focus:border-ds-accent-primary focus:outline-none focus:ring-1 focus:ring-ds-accent-primary"
                    placeholder="0"
                  />
                </div>

                <Button
                  variant="glow"
                  size="lg"
                  className="w-full"
                  onClick={handleSaveBusinessInfo}
                  isLoading={isSaving}
                  disabled={!businessType}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="text-center mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-4">
                    <Upload className="h-7 w-7 text-ds-text-accent" />
                  </div>
                  <h2 className="text-xl font-bold text-ds-text-primary">
                    Upload your first document
                  </h2>
                  <p className="text-sm text-ds-text-secondary mt-1">
                    Upload a tax return, bank statement, or any financial document so our AI
                    can start analysing your situation
                  </p>
                </div>

                <div className="mb-6">
                  <FileUpload onUpload={handleUpload} isUploading={isUploading} />
                </div>

                {uploadedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-lg bg-ds-feedback-success/10 border border-ds-feedback-success/20 px-4 py-3"
                  >
                    <Check className="h-4 w-4 text-ds-feedback-success" />
                    <p className="text-sm text-ds-text-primary">
                      Document uploaded successfully!
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={goBack}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    variant={uploadedFile ? "glow" : "ghost"}
                    size="lg"
                    className="flex-1"
                    onClick={goNext}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    {uploadedFile ? "Continue" : "Skip for now"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="text-center mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-4">
                    <MessageSquare className="h-7 w-7 text-ds-text-accent" />
                  </div>
                  <h2 className="text-xl font-bold text-ds-text-primary">
                    Ask your first question
                  </h2>
                  <p className="text-sm text-ds-text-secondary mt-1">
                    Choose a question to get started, or explore on your own
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 mb-6">
                  {questions.slice(0, 6).map((q, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleQuestionClick(q.question)}
                      className="flex items-center gap-3 rounded-xl border border-ds-border-default bg-ds-bg-tertiary p-4 text-left transition-all duration-200 hover:border-ds-accent-primary/40 hover:bg-ds-accent-primary/5 cursor-pointer group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ds-accent-primary/10 group-hover:bg-ds-accent-primary/20 transition-colors">
                        <MessageSquare className="h-4 w-4 text-ds-text-accent" />
                      </div>
                      <span className="text-sm text-ds-text-primary font-medium">
                        {q.text}
                      </span>
                      <ChevronRight className="h-4 w-4 text-ds-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={goBack}
                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex-1"
                    onClick={handleFinish}
                  >
                    I'll explore on my own
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
