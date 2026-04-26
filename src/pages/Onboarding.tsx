import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    emoji: '✦',
    title: 'One Moment. Not a Hundred.',
    description: 'MOMENTO delivers exactly one offer when three context signals align. No spam. No noise.',
  },
  {
    emoji: '🏪',
    title: 'Merchant Quiet Clock',
    description: 'We detect when a local merchant needs customers using real-time Payone transaction data.',
  },
  {
    emoji: '🧠',
    title: 'Your Intent, On-Device',
    description: 'Your browsing patterns are analyzed entirely on your phone. Nothing leaves your device.',
  },
  {
    emoji: '🌤️',
    title: 'City Ambient Clock',
    description: 'Weather, time-of-day, and local context help us find the perfect moment.',
  },
  {
    emoji: '🔒',
    title: 'Privacy First',
    description: 'Choose your location tier. Tier 4 means zero location data. You control everything.',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--momento-bg)]">
      <div className="w-full max-w-sm space-y-8 animate-fade-in" key={step}>
        <div className="text-center space-y-4">
          <div className="text-6xl">{STEPS[step].emoji}</div>
          <h2 className="text-2xl font-bold text-[var(--momento-text)]">
            {STEPS[step].title}
          </h2>
          <p className="text-sm text-[var(--momento-text-muted)] leading-relaxed">
            {STEPS[step].description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-[var(--momento-accent)]' : 'bg-[var(--momento-border)]'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-3 bg-[var(--momento-accent)] hover:bg-[var(--momento-accent-hover)] rounded-xl text-white font-semibold transition-colors"
        >
          {step < STEPS.length - 1 ? 'Next' : 'Get Started'}
        </button>

        {step < STEPS.length - 1 && (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 text-sm text-[var(--momento-text-muted)] hover:text-[var(--momento-text)]"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
