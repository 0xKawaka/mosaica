import React from 'react';
import './OwnedPixels.css';
import { DrawingInfos, PixelInfos } from '../customTypes';
import { formatBigIntWith18DecimalsAndPrecision } from '../dojo/decimalsHandler';

interface OwnedPixelsProps {
  pixels: PixelInfos[];
  drawing: DrawingInfos;
  balanceToken: bigint | undefined;
  ethBalance: bigint | undefined;
  userAddress: string | undefined;
}



const OwnedPixels: React.FC<OwnedPixelsProps> = ({ pixels, drawing, balanceToken, ethBalance, userAddress }) => {
  // Filter pixels owned by the user
  let ownedPixels: PixelInfos[] = [];
  if(userAddress){
    ownedPixels = pixels.filter(pixel => pixel.owner.toLowerCase() === userAddress.toLowerCase());
  }

  return (
    <div className="owned-pixels">
      
        <div>
          <div className='owned-pixels-balance-title'>Balance</div> 
          {balanceToken !== undefined &&
            <div className='owned-pixels-balance'>{formatBigIntWith18DecimalsAndPrecision(balanceToken, 6)} {drawing.symbol}</div>
          }
          {ethBalance !== undefined &&
            <div className='owned-pixels-balance'>{formatBigIntWith18DecimalsAndPrecision(ethBalance, 8)} ETH</div>
          }
        </div>

      <div className='owned-pixels-title'>Your Pixels</div>
      <p>Total: {ownedPixels.length}</p>
      {ownedPixels.length === 0 ? (
        <p className="no-owned">You don't own any pixels.</p>
      ) : (
        <ul className="owned-list">
          {ownedPixels.map((pixel, index) => (
            <li key={index} className="owned-item">
              <div className="pixel-info">
                Pixel at ({pixel.x}, {pixel.y})
              </div>
              <div className="pixel-color" style={{ backgroundColor: pixel.color }}></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OwnedPixels;
