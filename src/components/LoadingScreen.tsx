const LoadingScreen = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-synclulu-bg flex flex-col items-center justify-center">
      <div className="relative">
        {/* Cloud logo placeholder */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-synclulu-violet to-synclulu-violet-dark flex items-center justify-center shadow-lg">
          <span className="text-4xl">☁️</span>
        </div>

        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-3xl bg-synclulu-violet/30 pulse-ring" />
      </div>

      <h1 className="font-display text-3xl font-bold mt-6 gradient-text">synclulu</h1>
      <p className="text-synclulu-muted text-sm mt-2">Wird geladen...</p>
    </div>
  );
};

export default LoadingScreen;
