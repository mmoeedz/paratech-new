import { Reveal } from "./Reveal";

export function WorkflowDiagram({ nodes }: { nodes: string[] }) {
  return (
    <div>
      {/* Horizontal flow from desktop up — five 132px-min cards plus
          connectors need ~740px, so this can't switch on before lg (1024px)
          without clipping against the section's overflow-hidden at tablet
          widths. */}
      <ol className="hidden items-stretch lg:flex">
        {nodes.map((node, i) => (
          <li key={node} className="flex flex-1 items-center last:flex-none">
            <Reveal delay={i * 0.07} y={10} className="shrink-0">
              <div className="flex w-[132px] flex-col gap-2 rounded-lg border border-line bg-elevated px-4 py-3.5">
                <span className="font-mono text-[10px] text-copper">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium leading-snug text-cloud">
                  {node}
                </span>
              </div>
            </Reveal>
            {i < nodes.length - 1 && (
              <span
                aria-hidden="true"
                className="flow-line-h mx-2.5 flex-1"
              />
            )}
          </li>
        ))}
      </ol>

      {/* Vertical flow below desktop */}
      <ol className="flex flex-col items-center lg:hidden">
        {nodes.map((node, i) => (
          <li key={node} className="flex w-full flex-col items-center">
            <Reveal delay={i * 0.06} y={10} className="w-full max-w-[260px]">
              <div className="flex flex-col gap-2 rounded-lg border border-line bg-elevated px-4 py-3.5">
                <span className="font-mono text-[10px] text-copper">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-cloud">{node}</span>
              </div>
            </Reveal>
            {i < nodes.length - 1 && (
              <span aria-hidden="true" className="flow-line-v my-2 h-7" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
