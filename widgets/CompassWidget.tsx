import { FlexWidget, SvgWidget } from "react-native-android-widget";

export function buildCompassSvg(heading: number): string {
  const h = ((heading % 360) + 360) % 360;
  const ticks: string[] = [];

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 * Math.PI) / 180;
    const isMajor = i % 3 === 0;
    const inner = isMajor ? 34 : 37;
    const outer = 44;
    const x1 = 50 + inner * Math.sin(angle);
    const y1 = 50 - inner * Math.cos(angle);
    const x2 = 50 + outer * Math.sin(angle);
    const y2 = 50 - outer * Math.cos(angle);

    ticks.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${isMajor ? "#FFFFFF" : "#555555"}" stroke-width="${isMajor ? 3 : 2}" stroke-linecap="round"/>`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="49" fill="#1C1C1E" opacity="0.92"/>
    <circle cx="50" cy="50" r="48" fill="none" stroke="#3A3A3C" stroke-width="2"/>
    ${ticks.join("")}
    <g transform="rotate(${(-h).toFixed(2)} 50 50)">
      <polygon points="50,17 55.2,46 50,42 44.8,46" fill="#EF4444"/>
      <polygon points="50,83 55.2,54 50,58 44.8,54" fill="#8E8E93"/>
    </g>
    <text x="50" y="27" fill="#FFFFFF" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">N</text>
  </svg>`;
}

export function CompassWidget({ heading = 0 }: { heading?: number | null }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: "#1C1C1E",
      }}
    >
      <SvgWidget
        svg={buildCompassSvg(heading ?? 0)}
        style={{
          width: "match_parent",
          height: "match_parent",
        }}
      />
    </FlexWidget>
  );
}