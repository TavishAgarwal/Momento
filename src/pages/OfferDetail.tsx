import { useOffer } from '../context/OfferContext';
import OfferCard from '../components/OfferCard';

export default function OfferDetail() {
  const { currentOffer, setCurrentOffer } = useOffer();

  if (!currentOffer) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-[var(--momento-text-muted)]">No active offer</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-[var(--momento-text)]">Your Moment</h1>
      <OfferCard
        offer={currentOffer}
        onAccept={() => {}}
        onDismiss={() => setCurrentOffer(null)}
      />
    </div>
  );
}
