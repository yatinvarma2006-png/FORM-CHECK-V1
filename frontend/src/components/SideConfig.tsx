/**
 * SideConfig — bowling-only dropdowns for arm side and front leg side.
 */

interface Props {
  armSide: string;
  legSide: string;
  onArmSideChange: (side: string) => void;
  onLegSideChange: (side: string) => void;
}

export default function SideConfig({
  armSide,
  legSide,
  onArmSideChange,
  onLegSideChange,
}: Props) {
  return (
    <div className="animate-fade-in glass-card p-6 max-w-lg mx-auto">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Bowling Configuration
      </h3>
      <p className="text-sm text-gray-400 mb-5">
        Select which side of the body faces the camera for the bowling arm and front leg.
        This depends on the bowler's handedness and camera position.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="arm-side" className="block text-sm font-medium text-gray-300 mb-2">
            Bowling Arm Side
          </label>
          <select
            id="arm-side"
            value={armSide}
            onChange={(e) => onArmSideChange(e.target.value)}
            className="select-field"
          >
            <option value="right">Right</option>
            <option value="left">Left</option>
          </select>
        </div>

        <div>
          <label htmlFor="leg-side" className="block text-sm font-medium text-gray-300 mb-2">
            Front Leg Side
          </label>
          <select
            id="leg-side"
            value={legSide}
            onChange={(e) => onLegSideChange(e.target.value)}
            className="select-field"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </div>
  );
}
