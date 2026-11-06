import React from 'react';
import { MarketPulse } from './MarketPulse';

/**
 * Modular Stats Strip wrapping the live Market Pulse ticker.
 * Extracted for reuse and keeping page layouts compact.
 */
export const StatsStrip: React.FC = () => {
  return <MarketPulse />;
};

