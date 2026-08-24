"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  UtensilsCrossed,
  TrendingUp,
  Dumbbell,
  Send,
  MessageCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import MemberProgress from "@/app/components/MemberProgress";

type AssistantTab = "diet" | "progress" | "insights";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DietPlanForm = {
  goal: string;
  currentWeight: string;
  targetWeight: string;
  dietType: string;
  height: string;
  activityLevel: string;
};

const TABS: { id: AssistantTab; label: string; icon: typeof Dumbbell }[] = [
  { id: "diet", label: "Diet Assistant", icon: UtensilsCrossed },
  { id: "progress", label: "Member Progress", icon: TrendingUp },
  { id: "insights", label: "Gym Insights", icon: Dumbbell },
];

const SUGGESTIONS: { insights: string[] } = {
  insights: [
    "How is my gym performing?",
    "How many active members do I have?",
    "What should I focus on this week?",
  ],
};

const GOALS = ["Fat Loss", "Muscle Gain", "Weight Gain", "Maintenance"];
const DIET_TYPES = ["Vegetarian", "Non-Vegetarian"];
const ACTIVITY_LEVELS = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
];

const INITIAL_FORM: DietPlanForm = {
  goal: "",
  currentWeight: "",
  targetWeight: "",
  dietType: "",
  height: "",
  activityLevel: "",
};

const inputClasses =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20";

const labelClasses =
  "mb-1.5 block text-sm font-medium text-slate-700";

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<AssistantTab>("diet");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  // Incremented on every tab change so stale in-flight responses are discarded.
  const requestIdRef = useRef(0);

  // Diet plan state
  const [form, setForm] = useState<DietPlanForm>(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [dietResult, setDietResult] = useState("");
  const [dietError, setDietError] = useState("");

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleTabChange = (tab: AssistantTab) => {
    // Invalidate any in-flight request so its result can't be added to the new tab.
    requestIdRef.current += 1;
    setActiveTab(tab);
    setMessages([]);
    setInput("");
    setIsLoading(false);
    // Reset diet state so a fresh form is shown when returning to Diet Assistant.
    setForm(INITIAL_FORM);
    setFormError("");
    setDietResult("");
    setDietError("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend(suggestion);
  };

  const handleSend = async (questionOverride?: string) => {
    const question = (questionOverride ?? input).trim();
    if (!question || isLoading) return;

    const requestId = requestIdRef.current;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: activeTab, question }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to get a response.");
      }

      // Tab changed while this request was in-flight — discard the stale response.
      if (requestId !== requestIdRef.current) return;

      const aiMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      // Ignore errors from requests invalidated by a tab change.
      if (requestId !== requestIdRef.current) return;

      const errorMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleFormChange = (field: keyof DietPlanForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
    setDietError("");
  };

  const handleGenerateDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setDietError("");

    const currentWeight = Number(form.currentWeight);
    const targetWeight = Number(form.targetWeight);

    if (!form.goal) {
      setFormError("Please select a goal.");
      return;
    }
    if (!form.currentWeight || !(currentWeight > 0)) {
      setFormError("Please enter a valid current weight greater than 0.");
      return;
    }
    if (!form.targetWeight || !(targetWeight > 0)) {
      setFormError("Please enter a valid target weight greater than 0.");
      return;
    }
    if (!form.dietType) {
      setFormError("Please select a diet type.");
      return;
    }

    const requestId = requestIdRef.current;
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "diet",
          dietPlan: {
            goal: form.goal,
            currentWeight,
            targetWeight,
            dietType: form.dietType,
            height: form.height ? Number(form.height) : undefined,
            activityLevel: form.activityLevel || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate diet plan.");
      }

      if (requestId !== requestIdRef.current) return;

      setDietResult(data.content);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error("Diet plan generation error:", error);
      setDietError(
        "Unable to generate the diet plan right now. Please try again."
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const renderDietForm = () => (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Create a Personalized Diet Plan
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter a few details and let AI create a practical diet plan.
        </p>
      </div>

      <form
        onSubmit={handleGenerateDietPlan}
        className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
      >
        {/* Goal */}
        <div>
          <label htmlFor="goal" className={labelClasses}>
            Goal <span className="text-red-500">*</span>
          </label>
          <select
            id="goal"
            value={form.goal}
            onChange={(e) => handleFormChange("goal", e.target.value)}
            className={inputClasses}
          >
            <option value="">Select goal</option>
            {GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </div>

        {/* Current Weight */}
        <div>
          <label htmlFor="currentWeight" className={labelClasses}>
            Current Weight <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="currentWeight"
              type="number"
              min="0"
              step="0.1"
              value={form.currentWeight}
              onChange={(e) => handleFormChange("currentWeight", e.target.value)}
              placeholder="Enter current weight"
              className={inputClasses}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              kg
            </span>
          </div>
        </div>

        {/* Target Weight */}
        <div>
          <label htmlFor="targetWeight" className={labelClasses}>
            Target Weight <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="targetWeight"
              type="number"
              min="0"
              step="0.1"
              value={form.targetWeight}
              onChange={(e) => handleFormChange("targetWeight", e.target.value)}
              placeholder="Enter target weight"
              className={inputClasses}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              kg
            </span>
          </div>
        </div>

        {/* Diet Type */}
        <div>
          <label htmlFor="dietType" className={labelClasses}>
            Diet Type <span className="text-red-500">*</span>
          </label>
          <select
            id="dietType"
            value={form.dietType}
            onChange={(e) => handleFormChange("dietType", e.target.value)}
            className={inputClasses}
          >
            <option value="">Select diet type</option>
            {DIET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Height (optional) */}
        <div>
          <label htmlFor="height" className={labelClasses}>
            Height <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <input
              id="height"
              type="number"
              min="0"
              step="0.1"
              value={form.height}
              onChange={(e) => handleFormChange("height", e.target.value)}
              placeholder="Enter height"
              className={inputClasses}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              cm
            </span>
          </div>
        </div>

        {/* Activity Level (optional) */}
        <div>
          <label htmlFor="activityLevel" className={labelClasses}>
            Activity Level{" "}
            <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <select
            id="activityLevel"
            value={form.activityLevel}
            onChange={(e) => handleFormChange("activityLevel", e.target.value)}
            className={inputClasses}
          >
            <option value="">Select activity level</option>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {formError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {dietError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{dietError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating your personalized diet plan...
            </>
          ) : (
            "Generate Diet Plan"
          )}
        </button>
      </form>
    </div>
  );

  const renderDietResult = () => (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Your Diet Plan
        </h2>
        <button
          type="button"
          onClick={() => {
            setDietResult("");
            setForm(INITIAL_FORM);
          }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Create New Plan
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
          {dietResult}
        </pre>
      </div>
    </div>
  );

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 -mt-7 pb-6 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          AI Assistant
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Smart insights for your gym
        </p>
      </div>

      {/* Tabs / Cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={[
                "flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-all",
                isActive
                  ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  isActive
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "diet" ? (
        dietResult ? (
          renderDietResult()
        ) : (
          renderDietForm()
        )
      ) : activeTab === "progress" ? (
        <MemberProgress variant="progress" />
      ) : (
        <MemberProgress variant="insights" />
      )}
    </main>
  );
}