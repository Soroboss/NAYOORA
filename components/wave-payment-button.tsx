"use client";

import { useState } from "react";

export function WavePaymentButton({ amountDue, treasurerPhone = "" }: { amountDue: number, treasurerPhone?: string }) {
  const [clicked, setClicked] = useState(false);

  const handleWavePayment = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setClicked(true);
    // Deep link pattern for Wave. If on mobile, this prompts to open the app.
    // If we have an API later, we can replace this with a fetch call to get a checkout URL.
  };

  // Fallback direct link to Wave app with amount (This uses a generic scheme)
  const waveLink = `wave://transfer?amount=${amountDue}&phone=${treasurerPhone}`;

  return (
    <a 
      href={waveLink}
      onClick={handleWavePayment}
      style={{ 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 16px", 
        background: "#1cceed", // Wave Blue color
        color: "white", 
        textDecoration: "none",
        borderRadius: "8px", 
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        marginRight: "8px",
        boxShadow: "0 2px 4px rgba(28, 206, 237, 0.3)",
        transition: "transform 0.1s, box-shadow 0.1s"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 4px 6px rgba(28, 206, 237, 0.4)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(28, 206, 237, 0.3)";
      }}
    >
      <span style={{ marginRight: "6px", fontSize: "16px", fontWeight: "bold" }}>🌊</span> Payer avec Wave
    </a>
  );
}
