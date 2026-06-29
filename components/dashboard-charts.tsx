"use client";

export function DashboardCharts({ data, currency }: { data: { label: string; value: number }[]; currency: string }) {
  // Find the max value to scale the bars
  const maxVal = Math.max(...data.map((d) => d.value), 1); // fallback to 1 to avoid division by zero
  
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "XOF",
      maximumFractionDigits: 0,
      notation: "compact", // formats large numbers like 1,5M
      compactDisplay: "short"
    }).format(n);

  return (
    <div style={{ padding: "16px 0", height: "200px", display: "flex", alignItems: "flex-end", gap: "12px", justifyContent: "space-between" }}>
      {data.map((item, index) => {
        const heightPercent = Math.max((item.value / maxVal) * 100, 2); // min 2% height
        return (
          <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "8px" }} className="group">
            {/* Tooltip-like value display on top of bar */}
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#4b5563" }}>
              {item.value > 0 ? formatMoney(item.value) : "0"}
            </span>
            
            {/* The Bar */}
            <div 
              style={{
                width: "100%",
                maxWidth: "40px",
                height: `120px`,
                backgroundColor: "#f3f4f6",
                borderRadius: "6px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div 
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${heightPercent}%`,
                  backgroundColor: "#3b82f6",
                  borderRadius: "6px",
                  transition: "height 0.5s ease-out"
                }}
              />
            </div>
            
            {/* Label (e.g. Month) */}
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
