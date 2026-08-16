/**
 * SportSelector — two premium cards for choosing Bowling or Deadlift.
 */
import type { Sport } from "../types";

interface Props {
  onSelect: (sport: Sport) => void;
}

const sports: { key: Sport; name: string; description: string; icon: string }[] = [
  {
    key: "bowling",
    name: "Cricket Bowling",
    description:
      "Analyze fast-bowling action from a side-on view. Checks elbow extension, front-knee angle, and shoulder-hip separation.",
    icon: "🏏",
  },
  {
    key: "deadlift",
    name: "Conventional Deadlift",
    description:
      "Analyze deadlift form from a side-on view. Checks hip-shoulder rise ratio, hip lockout angle, and knee lockout angle.",
    icon: "🏋️",
  },
];

export default function SportSelector({ onSelect }: Props) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-3">Choose Your Sport</h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          Select the movement you'd like to analyze. Film from a side-on camera
          angle for best results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {sports.map((s) => (
          <button
            key={s.key}
            id={`sport-${s.key}`}
            onClick={() => onSelect(s.key)}
            className="group glass-card p-8 text-left cursor-pointer
                       transition-all duration-300 hover:scale-[1.03]
                       hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {s.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-300 transition-colors">
              {s.name}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {s.description}
            </p>
            <div
              className="mt-5 flex items-center gap-2 text-sm font-medium
                         text-brand-400 opacity-0 group-hover:opacity-100
                         transition-opacity duration-300"
            >
              Get started
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
