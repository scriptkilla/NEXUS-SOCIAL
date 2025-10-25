import React from 'react';
import type { CryptoCurrency } from '../../types';
import { CRYPTO_CURRENCIES } from '../../constants';

interface TipDropdownProps {
  onSelect: (crypto: CryptoCurrency) => void;
}

const TipDropdown: React.FC<TipDropdownProps> = ({ onSelect }) => {
  return (
    <div className="absolute bottom-full mb-2 right-0 w-56 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden animate-fade-in-up z-20">
      <div className="p-2 text-sm text-[var(--text-secondary)] font-semibold">Tip with</div>
      {CRYPTO_CURRENCIES.map(crypto => (
        <button
          key={crypto.id}
          onClick={() => onSelect(crypto)}
          className="w-full flex items-center gap-3 text-left px-3 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-glass)] transition-colors duration-200"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${crypto.gradient}`}>
            <crypto.icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">{crypto.name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{crypto.symbol}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default TipDropdown;
