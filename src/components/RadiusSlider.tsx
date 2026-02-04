import { useState, useRef, useCallback } from 'react';
import { Target, Expand } from 'lucide-react';

interface RadiusSliderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

const RadiusSlider = ({ value, min = 100, max = 5000, onChange }: RadiusSliderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  // Preset values for quick selection
  const presets = [
    { value: 100, label: '100m', emoji: '🏠' },
    { value: 500, label: '500m', emoji: '🏘️' },
    { value: 1000, label: '1km', emoji: '🏙️' },
    { value: 2500, label: '2.5km', emoji: '🌆' },
    { value: 5000, label: '5km', emoji: '🌍' },
  ];

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);

    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }, [onChange]);

  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Calculate percentage for gradient
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-synclulu-violet/10 flex items-center justify-center">
            <Target size={16} className="text-synclulu-violet" />
          </div>
          <span className="font-semibold text-synclulu-text">Suchradius</span>
        </div>
        <div className="flex items-center gap-1.5 bg-synclulu-violet text-white px-3 py-1.5 rounded-xl">
          <Expand size={14} />
          <span className="font-bold text-sm">{formatDistance(value)}</span>
        </div>
      </div>

      {/* Slider */}
      <div
        ref={sliderRef}
        className="relative py-2"
      >
        <input
          type="range"
          min={min}
          max={max}
          step={50}
          value={value}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-3 appearance-none cursor-pointer rounded-full"
          style={{
            background: `linear-gradient(to right, #8B5CF6 0%, #A78BFA ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`,
          }}
        />

        {/* Custom thumb indicator */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 pointer-events-none
            transition-transform duration-100
            ${isDragging ? 'scale-125' : 'scale-100'}
          `}
          style={{ left: `calc(${percentage}% - 10px)` }}
        >
          <div className="w-5 h-5 rounded-full bg-white border-4 border-synclulu-violet shadow-lg" />
        </div>
      </div>

      {/* Scale markers */}
      <div className="flex justify-between px-1 mt-1 mb-4">
        {['100m', '1km', '2.5km', '5km'].map((label, i) => (
          <span key={i} className="text-[10px] text-synclulu-muted">{label}</span>
        ))}
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className={`
              flex-1 py-2 px-1 rounded-xl text-center transition-all duration-200
              ${value === preset.value
                ? 'bg-synclulu-violet text-white shadow-lg scale-105'
                : 'bg-synclulu-soft text-synclulu-muted hover:bg-synclulu-violet/10'
              }
            `}
          >
            <span className="block text-sm mb-0.5">{preset.emoji}</span>
            <span className="text-[10px] font-semibold">{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RadiusSlider;
