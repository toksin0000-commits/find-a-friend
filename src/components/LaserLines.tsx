"use client";

export default function LaserLines() {
  return (
    <>
      {/* ČÁRA 1 */}
      <div className="h-px absolute top-80 -left-4 w-1/5 rotate-90 origin-center transform data-cara='1' bg-linear-to-r from-blue-400/60 via-white/80 to-emerald-400/60 **laser-flow laser1 line-rotate1**"></div>

      {/* ČÁRA 2 */}
      <div className="h-px absolute top-10 right-10 w-1/4 rotate-90 origin-center transform data-cara='2' bg-linear-to-r from-purple-400/60 via-pink-300/70 to-rose-400/60 **laser-flow laser2 line-rotate2**"></div>

      {/* ČÁRA 3 */}
      <div className="h-px absolute top-20 left-20 w-1/3 rotate-90 origin-center transform data-cara='3' bg-linear-to-r from-emerald-400/60 via-cyan-300/80 to-teal-400/60 **laser-flow laser3 line-rotate3**"></div>

      {/* ČÁRA 4 */}
      <div className="h-px absolute top-25 right-20 w-1/6 rotate-90 origin-center transform data-cara='4' bg-linear-to-r from-orange-400/60 via-yellow-300/70 to-red-400/60 **laser-flow laser4 line-rotate4**"></div>

      {/* ČÁRA 5 */}
      <div className="h-px absolute top-35 left-10 w-2/5 rotate-90 origin-center transform data-cara='5' bg-linear-to-r from-indigo-400/60 via-sky-300/80 to-cyan-400/60 **laser-flow laser5 line-rotate5**"></div>

      {/* ČÁRA 6 */}
      <div className="h-px absolute top-42 right-5 w-1/3 rotate-90 origin-center transform data-cara='6' bg-linear-to-r from-lime-400/60 via-emerald-300/70 to-green-400/60 **laser-flow laser6 line-rotate6**"></div>

      {/* ČÁRA 7 */}
      <div className="h-px absolute top-50 left-15 w-2/5 origin-center transform data-cara='7' bg-linear-to-r from-violet-400/60 via-purple-300/80 to-fuchsia-400/60 **laser-flow laser7 line-rotate7**"></div>

      {/* ČÁRA 8 */}
      <div className="h-px absolute top-60 right-25 w-1/5 origin-center transform data-cara='8' bg-linear-to-r from-amber-400/60 via-orange-300/70 to-red-500/60 **laser-flow laser8 line-rotate8**"></div>

      {/* ČÁRA 9 */}
      <div className="h-px absolute top-70 left-30 w-1/4 origin-center transform data-cara='9' bg-linear-to-r from-sky-400/60 via-blue-300/80 to-indigo-400/60 **laser-flow laser9 line-rotate9**"></div>

      {/* ČÁRA 10 */}
      <div className="h-px absolute top-82 right-12 w-3/5 origin-center transform data-cara='10' bg-linear-to-r from-pink-400/60 via-rose-300/70 to-red-400/60 **laser-flow laser10 line-rotate10**"></div>
    </>
  );
}
