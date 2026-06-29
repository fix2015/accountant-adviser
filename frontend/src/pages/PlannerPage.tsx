import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, AlertTriangle, CheckCircle2, Info, CalendarPlus, Download, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { getPlanner } from "@/api/chat";
import type { PlannerMonth, PlannerAction } from "@/types";

const CACHE_KEY = "planner_cache";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getCachedPlanner(): PlannerMonth[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { months, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return months;
  } catch {
    return null;
  }
}

function setCachedPlanner(months: PlannerMonth[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ months, timestamp: Date.now() }));
}

function generateICSEvent(action: PlannerAction, monthStr: string): string {
  // Parse deadline or use month start
  let dateStr = action.deadline;
  if (!dateStr || dateStr === "Ongoing") {
    // Use first day of the month as fallback
    const months: Record<string, string> = {
      January: "01", February: "02", March: "03", April: "04",
      May: "05", June: "06", July: "07", August: "08",
      September: "09", October: "10", November: "11", December: "12",
    };
    const parts = monthStr.split(" ");
    const m = months[parts[0]] || "01";
    const y = parts[1] || "2026";
    dateStr = `${y}-${m}-01`;
  }
  const d = dateStr.replace(/-/g, "");
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Accountant Adviser//EN",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${d}`,
    `SUMMARY:${action.title}`,
    `DESCRIPTION:${action.description.replace(/\n/g, "\\n")}`,
    `DTSTAMP:${now}`,
    `UID:${d}-${action.title.replace(/\s/g, "-").toLowerCase()}@ai-adviser`,
    `CATEGORIES:${action.priority.toUpperCase()}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Tax Reminder: ${action.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function generateAllICS(months: PlannerMonth[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const events: string[] = [];
  const monthsMap: Record<string, string> = {
    January: "01", February: "02", March: "03", April: "04",
    May: "05", June: "06", July: "07", August: "08",
    September: "09", October: "10", November: "11", December: "12",
  };

  for (const month of months) {
    for (const action of month.actions) {
      let dateStr = action.deadline;
      if (!dateStr || dateStr === "Ongoing") {
        const parts = month.month.split(" ");
        const m = monthsMap[parts[0]] || "01";
        const y = parts[1] || "2026";
        dateStr = `${y}-${m}-01`;
      }
      const d = dateStr.replace(/-/g, "");
      events.push([
        "BEGIN:VEVENT",
        `DTSTART;VALUE=DATE:${d}`,
        `DTEND;VALUE=DATE:${d}`,
        `SUMMARY:${action.title}`,
        `DESCRIPTION:${action.description.replace(/\n/g, "\\n")}`,
        `DTSTAMP:${now}`,
        `UID:${d}-${action.title.replace(/\s/g, "-").toLowerCase()}@ai-adviser`,
        `CATEGORIES:${action.priority.toUpperCase()}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:Tax Reminder: ${action.title}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"));
    }
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Accountant Adviser//EN",
    "X-WR-CALNAME:Tax Year Planner",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

const priorityConfig = {
  high: {
    color: "bg-ds-feedback-error/15 text-ds-feedback-error border-ds-feedback-error/30",
    icon: AlertTriangle,
    label: "High",
  },
  medium: {
    color: "bg-ds-feedback-warning/15 text-ds-feedback-warning border-ds-feedback-warning/30",
    icon: Clock,
    label: "Medium",
  },
  low: {
    color: "bg-ds-feedback-success/15 text-ds-feedback-success border-ds-feedback-success/30",
    icon: CheckCircle2,
    label: "Low",
  },
};

function parseDeadline(action: PlannerAction, monthStr: string): string {
  if (action.deadline && action.deadline !== "Ongoing") return action.deadline;
  const monthsMap: Record<string, string> = {
    January: "01", February: "02", March: "03", April: "04",
    May: "05", June: "06", July: "07", August: "08",
    September: "09", October: "10", November: "11", December: "12",
  };
  const parts = monthStr.split(" ");
  const m = monthsMap[parts[0]] || "01";
  const y = parts[1] || "2026";
  return `${y}-${m}-01`;
}

function openGoogleCalendar(action: PlannerAction, monthStr: string) {
  const date = parseDeadline(action, monthStr).replace(/-/g, "");
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", action.title);
  url.searchParams.set("dates", `${date}/${date}`);
  url.searchParams.set("details", action.description);
  url.searchParams.set("sf", "true");
  window.open(url.toString(), "_blank");
}

function openOutlookCalendar(action: PlannerAction, monthStr: string) {
  const date = parseDeadline(action, monthStr);
  const url = new URL("https://outlook.live.com/calendar/0/action/compose");
  url.searchParams.set("subject", action.title);
  url.searchParams.set("body", action.description);
  url.searchParams.set("startdt", date);
  url.searchParams.set("enddt", date);
  url.searchParams.set("allday", "true");
  window.open(url.toString(), "_blank");
}

function ActionCard({ action, index, monthStr }: { action: PlannerAction; index: number; monthStr: string }) {
  const config = priorityConfig[action.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const Icon = config.icon;
  const [showCalMenu, setShowCalMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:border-ds-border-strong transition-colors">
        <div className="flex items-start gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.priority === "high" ? "bg-ds-feedback-error/10" : action.priority === "low" ? "bg-ds-feedback-success/10" : "bg-ds-feedback-warning/10"}`}>
            <Icon className={`h-4 w-4 ${action.priority === "high" ? "text-ds-feedback-error" : action.priority === "low" ? "text-ds-feedback-success" : "text-ds-feedback-warning"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-semibold text-ds-text-primary truncate">
                {action.title}
              </h4>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${config.color}`}>
                {config.label}
              </span>
            </div>
            <p className="text-xs text-ds-text-secondary leading-relaxed">
              {action.description}
            </p>
            <div className="flex items-center justify-between mt-2">
              {action.deadline && (
                <div className="flex items-center gap-1.5 text-xs text-ds-text-muted">
                  <Calendar className="h-3 w-3" />
                  <span>Deadline: {action.deadline}</span>
                </div>
              )}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCalMenu(!showCalMenu); }}
                  className="flex items-center gap-1 text-[10px] text-ds-text-accent hover:text-ds-accent-primary transition-colors"
                >
                  <CalendarPlus className="h-3 w-3" />
                  Add to Calendar
                </button>
                {showCalMenu && (
                  <div className="absolute right-0 bottom-6 z-10 w-44 rounded-lg border border-ds-border-default bg-ds-bg-tertiary shadow-xl py-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openGoogleCalendar(action, monthStr); setShowCalMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface transition-colors"
                    >
                      Google Calendar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openOutlookCalendar(action, monthStr); setShowCalMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface transition-colors"
                    >
                      Outlook Calendar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadICS(generateICSEvent(action, monthStr), `${action.title.replace(/\s+/g, "_")}.ics`);
                        setShowCalMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface transition-colors"
                    >
                      Apple Calendar (.ics)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function PlannerPage() {
  const [months, setMonths] = useState<PlannerMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadPlanner = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCachedPlanner();
      if (cached) {
        setMonths(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const data = await getPlanner();
      setMonths(data.months);
      setCachedPlanner(data.months);
    } catch {
      setError("Failed to generate tax planner");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPlanner();
  }, [loadPlanner]);

  const handleRefresh = () => {
    setRefreshing(true);
    localStorage.removeItem(CACHE_KEY);
    loadPlanner(true);
  };

  const handleAddAllToCalendar = () => {
    const ics = generateAllICS(months);
    downloadICS(ics, "Tax_Year_Planner_2026-27.ics");
    toast("success", "All events downloaded — import into your calendar app");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-ds-text-secondary animate-pulse">
          Generating your personalised tax plan...
        </p>
      </div>
    );
  }

  if (error && months.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-md text-center p-8">
          <Info className="h-10 w-10 text-ds-text-accent mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-ds-text-primary mb-2">
            Upload documents for a personalised plan
          </h2>
          <p className="text-sm text-ds-text-secondary">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20">
                <Calendar className="h-5 w-5 text-ds-text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ds-text-primary">
                  Tax Year Planner
                </h1>
                <p className="text-sm text-ds-text-secondary">
                  Your personalised 12-month tax action plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Refresh
              </Button>
              {months.length > 0 && (
                <Button
                  variant="glow"
                  size="sm"
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  onClick={handleAddAllToCalendar}
                >
                  Add All to Calendar
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-ds-border-default" />

          <div className="space-y-8">
            {months.map((month, monthIndex) => (
              <motion.div
                key={month.month}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: monthIndex * 0.08 }}
                className="relative pl-12"
              >
                <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-ds-accent-primary/20 border-2 border-ds-accent-primary" />

                <h3 className="text-base font-semibold text-ds-text-primary mb-3">
                  {month.month}
                </h3>

                <div className="space-y-3">
                  {month.actions.map((action, actionIndex) => (
                    <ActionCard
                      key={`${month.month}-${actionIndex}`}
                      action={action}
                      index={actionIndex}
                      monthStr={month.month}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
