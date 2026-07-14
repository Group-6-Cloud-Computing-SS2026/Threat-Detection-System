import { homeInnerFrameClass, homePanelClass } from "../homeSurface.ts";
import { amdahlRawData } from "./graphsData.ts";
import { formatOptionalNumber, formatSeconds } from "./graphsFormat.ts";
import { useHorizontalDragScroll } from "../../../shared/hooks";

export default function AmdahlTable() {
  const amdahlTableDrag = useHorizontalDragScroll();
  let lastAmdahlWl = "";

  return (
    <article className={`${homePanelClass} overflow-hidden p-0`}>
      <div
        className={`${homeInnerFrameClass} cursor-grab overflow-x-auto active:cursor-grabbing`}
        {...amdahlTableDrag}
      >
        <table className="min-w-[920px] border-collapse text-sm">
          <colgroup>
            <col className="lg:w-[16%]" />
            <col className="lg:w-[8%]" />
            <col className="lg:w-[11%]" />
            <col className="lg:w-[11%]" />
            <col className="lg:w-[11%]" />
            <col className="lg:w-[13%]" />
            <col className="lg:w-[10%]" />
            <col className="lg:w-[10%]" />
            <col className="lg:w-[10%]" />
          </colgroup>
          <thead>
            <tr className="bg-brand-carbon-black-800">
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-left tracking-[0.16em] whitespace-nowrap uppercase">
                Workload
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-left tracking-[0.16em] whitespace-nowrap uppercase">
                Nodes
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right tracking-[0.16em] whitespace-nowrap uppercase">
                Avg Seq 1
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right tracking-[0.16em] whitespace-nowrap uppercase">
                Avg Parallel
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right tracking-[0.16em] whitespace-nowrap uppercase">
                Avg Seq 2
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right tracking-[0.16em] whitespace-nowrap uppercase">
                Avg Total Time
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right tracking-[0.16em] whitespace-nowrap uppercase">
                Std Dev
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right tracking-[0.16em] whitespace-nowrap uppercase">
                Speedup
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right tracking-[0.16em] whitespace-nowrap uppercase">
                Efficiency
              </th>
            </tr>
          </thead>
          <tbody>
            {amdahlRawData.map((row) => {
              const displayWl = row.wl !== lastAmdahlWl ? row.wl : "";
              lastAmdahlWl = row.wl;
              const stateClass =
                row.sp === null
                  ? "text-brand-brick-red-300"
                  : row.sp >= 3
                    ? "text-brand-light-green-300"
                    : row.sp >= 1.2
                      ? "text-brand-brick-red-200"
                      : "text-brand-brick-red-300";

              return (
                <tr
                  key={`${row.wl}-${row.n}`}
                  className="border-brand-carbon-black-700/70 hover:bg-brand-carbon-black-800/55 border-t transition"
                >
                  <td className="text-brand-alabaster-grey-100 px-4 py-3 font-semibold">
                    {displayWl}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3">
                    {row.n}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {formatSeconds(row.s1)}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {formatSeconds(row.p)}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {formatSeconds(row.s2)}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {row.t.toFixed(3)}s
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    &plusmn;{row.sd.toFixed(2)}s
                  </td>
                  <td
                    className={`${stateClass} px-4 py-3 text-right font-semibold tabular-nums`}
                  >
                    {formatOptionalNumber(row.sp)}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {row.eff === null ? "N/A" : `${row.eff}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
