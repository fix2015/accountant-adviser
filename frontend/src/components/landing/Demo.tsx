import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MessageSquare, Network, FileText, ArrowRight, Bot, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ForceGraph2D from "react-force-graph-2d";

// ─── Tab definitions ────────────────────────────────────────
const tabs = [
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "graph", label: "Knowledge Graph", icon: Network },
  { id: "pdf", label: "Strategy PDF", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

// ─── Chat Demo Data ─────────────────────────────────────────
const userQuestion =
  "What's the best salary/dividend split for my £80k profit company?";

const aiResponse = `Great question! Here are 3 optimised strategies for your £80,000 profit company:

**Strategy A: Maximum Tax Efficiency**
- Salary: £12,570/year (£1,047.50/month)
- Dividends: £49,730
- Corporation Tax: £3,362
- Total Tax Paid: £5,118
- **Net Take-Home: £62,312**

**Strategy B: Higher Pension Contribution**
- Salary: £12,570 + £20,000 employer pension
- Dividends: £32,230
- Corporation Tax: £1,488
- Total Tax Paid: £2,842
- **Net Take-Home: £44,812 + £20,000 pension**

**Strategy C: NIC-Optimised Split**
- Salary: £9,100 (below NIC threshold)
- Dividends: £53,200
- Corporation Tax: £3,542
- Total Tax Paid: £5,498
- **Net Take-Home: £61,502**

Based on your situation, I recommend **Strategy A** as it maximises take-home pay at £62,312, saving you £4,188 vs paying yourself a full salary.`;

// ─── Knowledge Graph Demo Data ──────────────────────────────
const demoGraphData = {
  nodes: [
    { id: "revenue", label: "Revenue £80,000", category: "income" },
    { id: "expenses", label: "Expenses £25,000", category: "expense" },
    { id: "corp_tax", label: "Corporation Tax", category: "tax" },
    { id: "dividends", label: "Dividends", category: "income" },
    { id: "salary", label: "Salary £12,570", category: "expense" },
    { id: "vat", label: "VAT Return", category: "regulation" },
  ],
  links: [
    { source: "revenue", target: "expenses" },
    { source: "revenue", target: "corp_tax" },
    { source: "revenue", target: "salary" },
    { source: "revenue", target: "dividends" },
    { source: "expenses", target: "corp_tax" },
    { source: "salary", target: "corp_tax" },
    { source: "revenue", target: "vat" },
    { source: "dividends", target: "corp_tax" },
  ],
};

const categoryColors: Record<string, string> = {
  income: "#10B981",
  expense: "#EF4444",
  tax: "#3B82F6",
  asset: "#8B5CF6",
  liability: "#F59E0B",
  strategy: "#06B6D4",
  regulation: "#6366F1",
};

// ─── Chat Tab Component ─────────────────────────────────────
function ChatDemo() {
  const [displayedText, setDisplayedText] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // Show user message after a short delay
    const t1 = setTimeout(() => setShowUser(true), 400);
    // Start typewriter after user message appears
    const t2 = setTimeout(() => {
      setShowAI(true);
      indexRef.current = 0;
      intervalRef.current = setInterval(() => {
        indexRef.current += 3;
        if (indexRef.current >= aiResponse.length) {
          setDisplayedText(aiResponse);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setDisplayedText(aiResponse.slice(0, indexRef.current));
        }
      }, 12);
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 h-[420px] overflow-y-auto pr-2 custom-scrollbar">
      {showUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 justify-end"
        >
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary px-4 py-3 text-white text-sm leading-relaxed">
            {userQuestion}
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ds-bg-surface border border-ds-border-default">
            <User className="h-4 w-4 text-ds-text-muted" />
          </div>
        </motion.div>
      )}

      {showAI && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ds-bg-surface border border-ds-border-default px-4 py-3 text-sm text-ds-text-secondary leading-relaxed whitespace-pre-wrap">
            {displayedText.split("\n").map((line, i) => {
              // Bold lines
              const boldMatch = line.match(/^\*\*(.+?)\*\*$/);
              if (boldMatch) {
                return (
                  <span key={i} className="block font-semibold text-ds-text-primary">
                    {boldMatch[1]}
                    {"\n"}
                  </span>
                );
              }
              // Inline bold
              const parts = line.split(/(\*\*.*?\*\*)/g);
              return (
                <span key={i}>
                  {parts.map((part, j) => {
                    const inlineMatch = part.match(/^\*\*(.+?)\*\*$/);
                    if (inlineMatch) {
                      return (
                        <span key={j} className="font-semibold text-ds-text-primary">
                          {inlineMatch[1]}
                        </span>
                      );
                    }
                    return part;
                  })}
                  {"\n"}
                </span>
              );
            })}
            {displayedText.length < aiResponse.length && (
              <span className="inline-block w-2 h-4 bg-ds-accent-primary/60 animate-pulse ml-0.5" />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Knowledge Graph Tab Component ──────────────────────────
function GraphDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 420 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 420,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    if (node.x === undefined || node.y === undefined) return;
    const color = categoryColors[node.category || "tax"] || "#3B82F6";
    const size = 8;

    // Outer glow
    const gradient = ctx.createRadialGradient(node.x, node.y, size, node.x, node.y, size * 3);
    gradient.addColorStop(0, color + "40");
    gradient.addColorStop(1, color + "00");
    ctx.beginPath();
    ctx.arc(node.x, node.y, size * 3, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Main node
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(node.x - size * 0.2, node.y - size * 0.2, size * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();

    // Label
    if (node.label) {
      ctx.font = "4px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#9CA3AF";
      ctx.fillText(node.label, node.x, node.y + size + 4);
    }
  }, []);

  return (
    <div ref={containerRef} className="relative h-[420px] rounded-xl overflow-hidden bg-ds-bg-primary">
      <ForceGraph2D
        graphData={demoGraphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          if (node.x === undefined || node.y === undefined) return;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={() => "rgba(59, 130, 246, 0.2)"}
        linkWidth={() => 1.5}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 glass rounded-lg p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {Object.entries(categoryColors)
            .filter(([cat]) => ["income", "expense", "tax", "regulation"].includes(cat))
            .map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-ds-text-muted capitalize">{cat}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── PDF Preview Tab Component ──────────────────────────────
function PDFDemo() {
  return (
    <div className="h-[420px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        {/* PDF Header */}
        <div className="bg-gradient-to-r from-[#1a365d] to-[#3b82f6] px-6 py-4 text-center">
          <p className="text-blue-200 text-xs">AI Accountant Adviser</p>
          <h3 className="text-white text-lg font-bold mt-1">Tax Optimization Strategy Report</h3>
          <p className="text-blue-200 text-xs mt-1">Generated on 29 June 2026 - Consultation #1042</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Table of Contents */}
          <div>
            <h4 className="text-[#1a365d] font-bold text-sm border-b-2 border-[#3b82f6] pb-1 mb-2">Table of Contents</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between"><span>1. Executive Summary</span><span>2</span></div>
              <div className="flex justify-between"><span>2. Financial Overview</span><span>2</span></div>
              <div className="flex justify-between"><span>3. Tax Optimisation Strategies</span><span>3</span></div>
              <div className="flex justify-between"><span>4. Recommended Actions</span><span>5</span></div>
              <div className="flex justify-between"><span>5. Disclaimer</span><span>6</span></div>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h4 className="text-[#1a365d] font-bold text-sm border-b border-[#3b82f6] pb-1 mb-2">1. Executive Summary</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              This report summarises the AI-generated tax optimisation strategies based on your
              uploaded financial documents and consultation Q&A sessions. The strategies below
              were tailored to your specific financial situation.
            </p>
          </div>

          {/* Sample Comparison Table */}
          <div>
            <h4 className="text-[#1a365d] font-bold text-sm border-b border-[#3b82f6] pb-1 mb-2">3. Strategy Comparison</h4>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#1a365d] text-white">
                  <th className="px-2 py-1.5 text-left font-medium">Metric</th>
                  <th className="px-2 py-1.5 text-right font-medium">Strategy A</th>
                  <th className="px-2 py-1.5 text-right font-medium">Strategy B</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Salary", "£12,570", "£9,100"],
                  ["Dividends", "£49,730", "£53,200"],
                  ["Corporation Tax", "£3,362", "£3,542"],
                  ["Income Tax", "£1,756", "£2,956"],
                  ["Total Tax", "£5,118", "£5,498"],
                  ["Take-Home", "£62,312", "£61,502"],
                ].map(([label, a, b], i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-2 py-1.5 text-gray-700 font-medium border border-gray-200">{label}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600 border border-gray-200">{a}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600 border border-gray-200">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-[#1d4ed8] mb-1">Recommendation</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Based on your situation, Strategy A is recommended as it maximises your net
              take-home pay at £62,312 — saving you £4,188 compared to a full salary approach.
            </p>
          </div>
        </div>

        {/* PDF Footer */}
        <div className="border-t border-gray-200 px-6 py-3 text-center">
          <p className="text-[10px] text-gray-400">
            AI Accountant Adviser - ai-adviser.probooking.app - Powered by GPT-4o
          </p>
        </div>
      </div>

      {/* Disabled download button */}
      <div className="mt-4 text-center">
        <button
          disabled
          className="inline-flex items-center gap-2 rounded-xl border border-ds-border-default bg-ds-bg-surface/50 px-5 py-2.5 text-sm text-ds-text-muted cursor-not-allowed"
        >
          <Lock className="h-4 w-4" />
          Download Sample — Sign up to get yours
        </button>
      </div>
    </div>
  );
}

// ─── Main Demo Component ────────────────────────────────────
export function Demo() {
  const [activeTab, setActiveTab] = useState<TabId>("chat");

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">
            See What You Get for{" "}
            <span className="text-gradient">£10</span>
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-xl mx-auto">
            Try our interactive demo. No signup required.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Glassmorphism card */}
          <div className="glass rounded-2xl overflow-hidden border border-ds-border-default/50">
            {/* Tab selector */}
            <div className="flex border-b border-ds-border-default bg-ds-bg-secondary/50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 ${
                      isActive
                        ? "text-ds-text-accent border-ds-accent-primary bg-ds-accent-primary/5"
                        : "text-ds-text-muted border-transparent hover:text-ds-text-secondary hover:bg-ds-bg-surface/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === "chat" && <ChatDemo />}
              {activeTab === "graph" && <GraphDemo />}
              {activeTab === "pdf" && <PDFDemo />}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mt-10"
        >
          <Link to="/register">
            <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>
              Start Your Free Trial
            </Button>
          </Link>
          <p className="mt-3 text-sm text-ds-text-muted">
            No credit card required. 3 free questions included.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
