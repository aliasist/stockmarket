import React from 'react';

export default function StockChartWidget({ symbol }: { symbol: string }) {
  if (!symbol) return null;
  return (
    <div className="my-4">
      <iframe
        title={`TradingView Chart for ${symbol}`}
        src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=light&style=1&timezone=Etc/UTC&withdateranges=1&hideideas=1&hidevolume=1&hidelegend=1&hide_side_toolbar=1&allow_symbol_change=1&details=0&hotlist=0&calendar=0&news=0&width=100%25&height=400`}
        width="100%"
        height="400"
        frameBorder="0"
        allowFullScreen
        style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
      />
    </div>
  );
}
