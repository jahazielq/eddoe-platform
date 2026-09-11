import Link from "next/link";

interface RingStation {
  order: number;
  isDemo: boolean;
  href: string;
}

/**
 * Diagrama circular del circuito de estaciones: un anillo con la estación
 * demo y las seis estaciones distribuidas geométricamente, unidas por un
 * trazo guía y con una insignia central. Sólo se muestran números/"Demo",
 * nunca nombres de competencias.
 */
export function StationRing({ stations }: { stations: RingStation[] }) {
  const total = stations.length;
  const radius = 40; // % del contenedor
  const nodes = stations.map((st, i) => {
    const angle = (i / total) * 2 * Math.PI - Math.PI / 2; // arranca arriba
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return { ...st, x, y };
  });

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#c9a227"
          strokeWidth="0.6"
          strokeDasharray="2.5 2.5"
          opacity="0.6"
        />
        <circle cx="50" cy="50" r={radius + 6} fill="none" stroke="#041e42" strokeWidth="0.3" opacity="0.15" />
      </svg>

      {/* Insignia central */}
      <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-gold bg-navy text-center shadow-lg">
        <img src="/logo-eddoe.png" alt="" className="h-10 w-10" />
        <span className="mt-1 font-serif text-xs font-bold tracking-wide text-gold">EDDOE</span>
      </div>

      {nodes.map((node, i) => (
        <Link
          key={node.order}
          href={node.href}
          className="group absolute flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 text-center shadow-md transition-transform duration-150 hover:z-10 hover:scale-110 hover:shadow-xl"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            backgroundColor: i % 2 === 0 ? "#041e42" : "#c9a227",
            borderColor: i % 2 === 0 ? "#c9a227" : "#041e42",
          }}
        >
          <span
            className="text-[0.65rem] font-bold uppercase tracking-wide"
            style={{ color: i % 2 === 0 ? "#c9a227" : "#041e42" }}
          >
            {node.isDemo ? "Demo" : "Estación"}
          </span>
          {!node.isDemo && (
            <span className="text-xl font-bold" style={{ color: i % 2 === 0 ? "#ffffff" : "#041e42" }}>
              {node.order}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
