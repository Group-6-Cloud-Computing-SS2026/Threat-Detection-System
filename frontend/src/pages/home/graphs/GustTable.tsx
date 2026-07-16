import { homeInnerFrameClass, homePanelClass } from "../homeSurface.ts";
import { gustRawData } from "./graphsData.ts";
import { useHorizontalDragScroll } from "../../../shared/hooks";

export default function GustTable() {
  const gustTableDrag = useHorizontalDragScroll();
  let lastGustSet = "";

  return (
    <article className={`${homePanelClass} overflow-hidden p-0`}>
      <div
        className={`${homeInnerFrameClass} cursor-grab overflow-x-auto active:cursor-grabbing`}
        {...gustTableDrag}
      >
        <table className="min-w-[1040px] border-collapse text-sm">
          <colgroup>
            <col className="lg:w-[14%]" />
            <col className="lg:w-[11%]" />
            <col className="lg:w-[8%]" />
            <col className="lg:w-[10%]" />
            <col className="lg:w-[10%]" />
            <col className="lg:w-[10%]" />
            <col className="lg:w-[13%]" />
            <col className="lg:w-[10%]" />
            <col className="lg:w-[10%]" />
            <col className="lg:w-[10%]" />
          </colgroup>
          <thead>
            <tr className="bg-brand-carbon-black-800">
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-left align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                <span className="block">Set</span>
                <span className="block">Description</span>
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-left align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                Size
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-left align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                Nodes
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                <span className="block">Avg Seq</span>
                <span className="block">1</span>
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                <span className="block">Avg</span>
                <span className="block">Parallel</span>
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                <span className="block">Avg Seq</span>
                <span className="block">2</span>
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                <span className="block">Avg Total</span>
                <span className="block">Time</span>
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                Std Dev
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                <span className="block">Scaled</span>
                <span className="block">Speedup</span>
              </th>
              <th className="text-brand-alabaster-grey-100 px-4 py-3 text-right align-bottom leading-tight tracking-[0.16em] whitespace-nowrap uppercase">
                Efficiency
              </th>
            </tr>
          </thead>
          <tbody>
            {gustRawData.map((row) => {
              const displaySet = row.set !== lastGustSet ? row.set : "";
              lastGustSet = row.set;
              const stateClass =
                row.sp >= 7
                  ? "text-brand-light-green-300"
                  : row.sp >= 3.5
                    ? "text-brand-brick-red-200"
                    : "text-brand-brick-red-300";

              return (
                <tr
                  key={`${row.set}-${row.sz}-${row.n}`}
                  className="border-brand-carbon-black-700/70 hover:bg-brand-carbon-black-800/55 border-t transition"
                >
                  <td className="text-brand-alabaster-grey-100 px-4 py-3 font-semibold">
                    {displaySet}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3">
                    {row.sz}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3">
                    {row.n}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {row.s1.toFixed(3)}s
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {row.p.toFixed(3)}s
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {row.s2.toFixed(3)}s
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
                    {row.sp.toFixed(2)}x
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 text-right tabular-nums">
                    {row.eff}%
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
