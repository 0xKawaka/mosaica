import React, { useState } from 'react';
import './TooltipHelp.css';

interface TooltipHelpProps {
  pixelPrice: string;
  tokensPerPixel: string;
  targetRaise: string;
  halfTotalSupplyToken: string;
  symbol: string;
}

const TooltipHelp: React.FC<TooltipHelpProps> = ({pixelPrice, tokensPerPixel, symbol, targetRaise, halfTotalSupplyToken})  => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="tooltip-help">
      <div className="tooltip-content">
        <div className="tooltip-close" onClick={handleClose}>×</div>
        <h3>Placing a Pixel</h3>
        <p>
          You can place a pixel on the canvas for {pixelPrice} ETH.
          In return, you'll receive {tokensPerPixel} {symbol} tokens.
        </p>
        <p>
          Once all the pixels are placed, the {targetRaise} ETH raised along with {halfTotalSupplyToken} {symbol} will be added to a forever burned Ekubo liquidity pool. 
        </p>
      </div>
    </div>
  );
};

export default TooltipHelp;
