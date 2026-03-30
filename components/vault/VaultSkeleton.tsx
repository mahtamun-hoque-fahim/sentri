export default function VaultSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4  rounded-xl border"
          style={{ borderColor: "#2A3244", animationDelay: `${i * 0.06}s` }}
        >
          <div className="shimmer w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="shimmer h-3.5 rounded w-1/3" />
            <div className="shimmer h-2.5 rounded w-1/2" />
          </div>
          <div className="shimmer h-5 w-14 rounded-full hidden sm:block" />
        </div>
      ))}
    </div>
  );
}
