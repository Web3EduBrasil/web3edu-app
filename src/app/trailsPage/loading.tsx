export default function Loading() {
  return (
    <div className="flex w-full h-full justify-start items-center flex-col overflow-y-scroll px-12 mt-4">
      <div className="flex w-full items-center md:flex-row flex-col gap-3 mb-4">
        <div className="skeleton h-8 w-52 rounded-lg" />
        <div className="skeleton h-8 w-40 rounded-lg" />
      </div>
      <div className="w-full h-full gap-7 mb-8 flex flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton w-full max-w-80 h-80 rounded-box" />
        ))}
      </div>
    </div>
  );
}
