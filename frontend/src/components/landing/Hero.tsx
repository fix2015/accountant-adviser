import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Brain, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-ds-accent-primary/5 via-transparent to-transparent" />
      {/* Soft glowing orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-400/8 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyan-400/8 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-radial from-blue-100/30 to-transparent blur-[80px]" />
    </div>
  );
}

function FloatingNodes() {
  const nodes = [
    { x: "15%", y: "25%", size: 6, delay: 0, label: "Income" },
    { x: "80%", y: "20%", size: 5, delay: 0.5, label: "Tax" },
    { x: "70%", y: "65%", size: 7, delay: 1, label: "Savings" },
    { x: "25%", y: "70%", size: 4, delay: 1.5, label: "Assets" },
    { x: "50%", y: "15%", size: 5, delay: 0.8, label: "Expenses" },
    { x: "90%", y: "45%", size: 4, delay: 2, label: "Strategy" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none hidden lg:block">
      {nodes.map((node, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: node.x, top: node.y }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: node.delay,
            ease: "easeInOut",
          }}
        >
          <div className="relative">
            <div
              className="rounded-full bg-ds-accent-primary/15 border border-ds-accent-primary/25"
              style={{ width: node.size * 6, height: node.size * 6 }}
            />
            <div
              className="absolute inset-1 rounded-full bg-ds-accent-primary/30"
              style={{ boxShadow: "0 0 12px rgba(37,99,235,0.25)" }}
            />
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-ds-text-muted whitespace-nowrap font-medium">
              {node.label}
            </span>
          </div>
        </motion.div>
      ))}
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]">
        <line x1="15%" y1="25%" x2="50%" y2="15%" stroke="var(--ds-accent-primary)" strokeWidth="1" />
        <line x1="50%" y1="15%" x2="80%" y2="20%" stroke="var(--ds-accent-primary)" strokeWidth="1" />
        <line x1="80%" y1="20%" x2="90%" y2="45%" stroke="var(--ds-accent-primary)" strokeWidth="1" />
        <line x1="90%" y1="45%" x2="70%" y2="65%" stroke="var(--ds-accent-primary)" strokeWidth="1" />
        <line x1="70%" y1="65%" x2="25%" y2="70%" stroke="var(--ds-accent-primary)" strokeWidth="1" />
        <line x1="25%" y1="70%" x2="15%" y2="25%" stroke="var(--ds-accent-primary)" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <GridBackground />
      <FloatingNodes />

      <motion.div style={{ opacity, y }} className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ds-accent-primary/20 bg-ds-accent-primary/5 px-4 py-1.5 text-sm font-medium text-ds-text-accent">
            <Sparkles className="h-4 w-4" />
            Built on 100,000+ UK Client Cases
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
        >
          <span className="text-ds-text-primary">The UK's Smartest</span>
          <br />
          <span className="text-gradient">AI Tax Accountant</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-6 max-w-3xl text-lg sm:text-xl text-ds-text-secondary leading-relaxed"
        >
          We built our own AI model trained on <strong className="text-ds-text-primary">100,000+ real UK accounting cases</strong>.
          It knows HMRC rules, UK tax law, and real company filings better than any generic AI — and delivers
          expert-level advice in seconds, not weeks.
        </motion.p>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-ds-text-secondary"
        >
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-ds-accent-primary" />
            <span>Proprietary UK Tax AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-ds-feedback-success" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-ds-feedback-warning" />
            <span>Results in 30 Seconds</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register">
            <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>
              Get Expert Tax Advice — £10
            </Button>
          </Link>
          <a href="#why-ai">
            <Button variant="secondary" size="xl">
              Why AI Beats Accountants
            </Button>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-6 text-sm text-ds-text-muted"
        >
          No subscription. One-time payment. 50 follow-up questions included.
        </motion.p>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ds-bg-primary to-transparent" />
    </section>
  );
}
