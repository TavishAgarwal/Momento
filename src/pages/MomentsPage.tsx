import { useOffer } from '../context/OfferContext';
import { getRelativeTime } from '../utils/helpers';

export default function MomentsPage() {
  const { offerHistory, clearHistory } = useOffer();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Your Moments</h1>
        {offerHistory.length > 0 && (
          <button onClick={clearHistory} className="text-xs text-red-500 hover:underline font-medium">Clear all</button>
        )}
      </div>

      {offerHistory.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-12 text-center mt-8 shadow-sm">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Waiting for the right moment.</h2>
          <p className="text-sm text-gray-500">
            When the weather, merchant activity, and your preferences align, your first moment will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offerHistory.map(offer => (
            <div key={offer.id} className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-4 space-y-2 animate-fade-in shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{offer.merchantName}</h3>
                <span className="text-xs text-gray-500">
                  {getRelativeTime(offer.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{offer.contextPrompt || offer.params.featuredProduct}</p>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {offer.params.discount}% off
                </span>
                <span className={`text-xs font-medium ${
                  offer.status === 'accepted' ? 'text-green-600' : offer.status === 'expired' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {offer.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
