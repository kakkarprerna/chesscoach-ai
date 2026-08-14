"use client";

interface CoachTipProps {
  type: "great" | "good" | "mistake" | "opportunity" | "info";
  title: string;
  message: string;
}

const styles = {
  great: {
    icon: "⭐",
    label: "Great move!",
    box: "border-violet-200 bg-violet-50",
    iconBox: "bg-violet-100",
    title: "text-violet-900",
    text: "text-violet-800",
  },
  good: {
    icon: "👍",
    label: "Nice!",
    box: "border-blue-200 bg-blue-50",
    iconBox: "bg-blue-100",
    title: "text-blue-900",
    text: "text-blue-800",
  },
  mistake: {
    icon: "💡",
    label: "Let's learn from this",
    box: "border-orange-200 bg-orange-50",
    iconBox: "bg-orange-100",
    title: "text-orange-900",
    text: "text-orange-800",
  },
  opportunity: {
    icon: "🔎",
    label: "You had an idea!",
    box: "border-yellow-200 bg-yellow-50",
    iconBox: "bg-yellow-100",
    title: "text-yellow-900",
    text: "text-yellow-800",
  },
  info: {
    icon: "♟",
    label: "Coach tip",
    box: "border-slate-200 bg-slate-50",
    iconBox: "bg-slate-100",
    title: "text-slate-900",
    text: "text-slate-700",
  },
};

export default function CoachTip({
  type,
  title,
  message,
}: CoachTipProps) {
  const style = styles[type];

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${style.box}`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${style.iconBox}`}
        >
          {style.icon}
        </div>

        <div>
          <p
            className={`text-xs font-bold uppercase tracking-wide ${style.title}`}
          >
            {style.label}
          </p>

          <h3
            className={`mt-1 text-lg font-bold ${style.title}`}
          >
            {title}
          </h3>

          <p
            className={`mt-2 text-sm leading-6 ${style.text}`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
