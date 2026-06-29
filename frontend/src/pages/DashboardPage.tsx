import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare,
  FileText,
  Download,
  Brain,
  Upload,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { KnowledgePanel } from "@/components/knowledge/KnowledgePanel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuestionCounter } from "@/components/chat/QuestionCounter";
import type { KnowledgeNode } from "@/types";

export function DashboardPage() {
  const { user } = useAuth();
  const { documents } = useDocuments();
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  const questionsUsed = user ? 50 - (user.questions_remaining || 0) : 0;
  const hasPaid = user?.has_paid;

  if (!hasPaid) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-6">
            <CreditCard className="h-8 w-8 text-ds-text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-ds-text-primary mb-3">
            Complete Your Payment
          </h2>
          <p className="text-ds-text-secondary mb-8">
            Pay just £10 to unlock your full AI tax consultation with 50 questions,
            document analysis, and a personalised strategy.
          </p>
          <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>
            Pay £10 to Get Started
          </Button>
          <p className="mt-4 text-xs text-ds-text-muted">
            Secure payment via Stripe. Non-refundable once consultation begins.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-ds-text-secondary mt-1">
          Your AI tax consultation dashboard
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="hover:border-ds-border-strong transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-accent-primary/10">
                <FileText className="h-4 w-4 text-ds-text-accent" />
              </div>
              <span className="text-sm text-ds-text-secondary">Documents</span>
            </div>
            <p className="text-3xl font-bold text-ds-text-primary">{documents.length}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:border-ds-border-strong transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-feedback-success/10">
                <MessageSquare className="h-4 w-4 text-ds-feedback-success" />
              </div>
              <span className="text-sm text-ds-text-secondary">Questions Left</span>
            </div>
            <p className="text-3xl font-bold text-ds-text-primary">{user?.questions_remaining || 0}</p>
            <QuestionCounter used={questionsUsed} total={50} className="mt-3" />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover:border-ds-border-strong transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-accent-secondary/10">
                <Download className="h-4 w-4 text-ds-accent-secondary" />
              </div>
              <span className="text-sm text-ds-text-secondary">Strategies</span>
            </div>
            <p className="text-3xl font-bold text-ds-text-primary">--</p>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/dashboard/documents">
          <Card className="hover:border-ds-accent-primary/30 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group">
            <Upload className="h-6 w-6 text-ds-text-accent mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-semibold text-ds-text-primary">Upload Documents</h3>
            <p className="text-xs text-ds-text-muted mt-1">PDF, DOC, TXT, CSV</p>
          </Card>
        </Link>
        <Link to="/dashboard/chat">
          <Card className="hover:border-ds-accent-primary/30 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group">
            <MessageSquare className="h-6 w-6 text-ds-feedback-success mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-semibold text-ds-text-primary">Start Chat</h3>
            <p className="text-xs text-ds-text-muted mt-1">Ask the AI about your taxes</p>
          </Card>
        </Link>
        <Link to="/dashboard/strategy">
          <Card className="hover:border-ds-accent-primary/30 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group">
            <Download className="h-6 w-6 text-ds-accent-secondary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-semibold text-ds-text-primary">View Strategy</h3>
            <p className="text-xs text-ds-text-muted mt-1">Download your strategy PDF</p>
          </Card>
        </Link>
      </div>

      {/* Knowledge Graph */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-ds-border-default">
          <Brain className="h-4 w-4 text-ds-text-accent" />
          <h2 className="text-sm font-semibold text-ds-text-primary">Knowledge Graph</h2>
        </div>
        <div className="relative h-[400px]">
          <KnowledgeGraph onNodeClick={setSelectedNode} />
          <KnowledgePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      </Card>
    </div>
  );
}
