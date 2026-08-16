/**
 * DisclaimerBanner — always-visible amber banner with reference-data disclaimer.
 * Cannot be dismissed per spec requirements.
 */
export default function DisclaimerBanner() {
  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-start gap-3">
        <span className="text-amber-400 mt-0.5 flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <p className="text-sm text-amber-200/90 leading-relaxed">
          <span className="font-semibold text-amber-300">Disclaimer:</span>{" "}
          Reference thresholds in this build are starting estimates based on general
          biomechanics knowledge, not a specific cited study. Replace with sourced
          values before presenting results as validated for a competition or clinical
          context.
        </p>
      </div>
    </div>
  );
}
