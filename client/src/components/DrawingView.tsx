import React, { useState, useEffect, useMemo } from 'react';
import './DrawingView.css';
import ColorSelector from './ColorSelector';
import PendingPixels from './PendingPixels';
import FailedPixels from './FailedPixels';
import { DrawingInfos, PixelInfos } from '../customTypes';
import { useDojo } from '../dojo/useDojo';
import { Account, Provider, Contract, AccountInterface } from 'starknet';
import { hexStringToRGB, rgbToHex } from '../utils/colorFunctions';
import { useComponentValue, useQuerySync } from "@dojoengine/react";
import { type Entity } from "@dojoengine/recs";
import { bigIntToHexString } from '../dojo/adrsParser';
import OwnedPixels from './OwnedPixels';
import { U256Math } from '../dojo/U256Helper';
import { ETH } from '../dojo/constants';
import erc20abi from '../dojo/abi/erc20';
import TooltipHelp from './TooltipHelp';
import { formatBigIntWith18DecimalsAndPrecision } from '../dojo/decimalsHandler';
import CanvasContainer from './CanvasContainer';

interface DrawingViewProps {
  entities: Entity[];
  drawing: DrawingInfos;
  account: Account | AccountInterface | undefined;
}


const DrawingView: React.FC<DrawingViewProps> = ({ entities, account, drawing }) => {
  
  console.log("DrawingView");  
  const { setup: { systemCalls: { colorPixels }, clientComponents: {Drawing, Pixel}, toriiClient, contractsAdrs } } = useDojo();

  useQuerySync(toriiClient, [Drawing, Pixel] as any, []);


  let ownedPixels: PixelInfos[] = [];
  let grid: PixelInfos[][] = Array(drawing.pixelsColumnCount).fill(null).map(() => Array(drawing.pixelsRowCount).fill(null));
  for (const entityId of entities) {
    const pixel = useComponentValue(Pixel, entityId);
    if (pixel) {
      let owner = bigIntToHexString(pixel.owner);
      if (owner === account?.address) {
        ownedPixels.push({
          owner: owner,
          color: rgbToHex(pixel.r, pixel.g, pixel.b),
          x: pixel.x,
          y: pixel.y,
        });
      }
        grid[pixel.x][pixel.y] = {
          owner: owner,
          color: rgbToHex(pixel.r, pixel.g, pixel.b),
          x: pixel.x,
          y: pixel.y,
        };
    }
  
  }
  for (let x = 0; x < drawing.pixelsColumnCount; x++) {
    for (let y = 0; y < drawing.pixelsRowCount; y++) {
      if (grid[x][y] === null) {
        grid[x][y] = {
          owner: '',
          color: '',
          x,
          y,
        };
      }
    }
  }

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [pendingPixels, setPendingPixels] = useState<{ x: number; y: number; color: string; isCommitting: boolean; error: boolean }[]>([]);
  const [failedPixels, setFailedPixels] = useState<{ x: number; y: number; color: string }[]>([]); // Track failed pixels
  const [balanceToken, setBalanceToken] = useState<bigint | undefined>();
  const [ethBalance, setEthBalance] = useState<bigint | undefined>();
  const [totalSupplyToken, setTotalSupplyToken] = useState<bigint>(BigInt(0));




  function updateBalanceToken() {
    if(account) {
      const tokenContract = new Contract(erc20abi, drawing.token, account);
      tokenContract.balance_of(account.address).then((res: bigint) => {
        console.log("Balance token", res);
        setBalanceToken(res);
      });
    }
  }
  function updateEthBalance() {
    if(account) {
      const ethContract = new Contract(erc20abi, ETH, account);
      ethContract.balanceOf(account.address).then((res: bigint) => {
        console.log("Balance eth", res);
        setEthBalance(res);
      });
    }
  }
  useEffect(() => {
    if(account) {
      const tokenContract = new Contract(erc20abi, drawing.token, account);
      tokenContract.total_supply().then((res: bigint) => {
        console.log("Total supply token", res);
        setTotalSupplyToken(res);
      });
    }
  }, []);

  useEffect(() => {
    updateBalanceToken();
    updateEthBalance();
  }, [account]);  

  const handlePixelClick = (x: number, y: number) => {
    if (selectedColor && !grid[x][y].owner) {
      const newPendingPixels = [...pendingPixels];
      const isAlreadyPending = newPendingPixels.some((pixel) => pixel.x === x && pixel.y === y);
  
      if (!isAlreadyPending) {
        newPendingPixels.push({ x, y, color: selectedColor, isCommitting: false, error: false });
        setPendingPixels(newPendingPixels);
      }
    }
  };
  

  const handleCommit = async () => {
    if(!account) return;

    const commitPendingPixels = pendingPixels.filter((pixel) => !pixel.isCommitting);
  
    if (commitPendingPixels.length === 0) return;
  
    const updatedPendingPixels = pendingPixels.map((pixel) =>
      commitPendingPixels.includes(pixel) ? { ...pixel, isCommitting: true } : pixel
    );
    setPendingPixels(updatedPendingPixels);
  
    let x: number[] = [];
    let y: number[] = [];
    let r: number[] = [];
    let g: number[] = [];
    let b: number[] = [];
  
    commitPendingPixels.forEach(({ x: xCoord, y: yCoord, color }) => {
      const { r: red, g: green, b: blue } = hexStringToRGB(color);
      x.push(xCoord);
      y.push(yCoord);
      r.push(red);
      g.push(green);
      b.push(blue);
    });
    let res = await colorPixels(account, drawing.id, x, y, r, g, b, U256Math.multiplyByBigint(drawing.pricePerPixel, BigInt(x.length)), BigInt(contractsAdrs.MemeArt));
  
    if (res) {
      // const newGrid = [...grid];
      // commitPendingPixels.forEach(({ x, y, color }) => {
      //   newGrid[x][y] = { ...newGrid[x][y], owner: account.address, color }; // Update owner and color
      // });
      setPendingPixels(pendingPixels.filter((pixel) => !commitPendingPixels.includes(pixel)));
      updateBalanceToken();
      updateEthBalance();
    } else {
      const newFailedPixels = commitPendingPixels.map(({ x, y, color }) => ({ x, y, color }));
      setFailedPixels([...failedPixels, ...newFailedPixels]);
      const updatedWithError = pendingPixels.map((pixel) =>
        commitPendingPixels.includes(pixel) ? { ...pixel, isCommitting: false, error: true } : pixel
      );
      setPendingPixels(updatedWithError);
    }
  };
  
  const handleCancelPixel = (x: number, y: number) => {
    const newPendingPixels = pendingPixels.filter((pixel) => pixel.x !== x || pixel.y !== y);
    setPendingPixels(newPendingPixels);
  
    // const newGrid = [...grid];
    // newGrid[x][y] = { ...newGrid[x][y], owner: '', color: '' };
  };
  

  return (
    <div className="DrawingView">
      <div className="controls">
      <TooltipHelp pixelPrice={formatBigIntWith18DecimalsAndPrecision(drawing.pricePerPixel.low, 7)} tokensPerPixel={formatBigIntWith18DecimalsAndPrecision(drawing.tokenPerPixel.low, 5)} symbol={drawing.symbol} targetRaise={formatBigIntWith18DecimalsAndPrecision(drawing.raiseTarget.low, 5)} halfTotalSupplyToken={formatBigIntWith18DecimalsAndPrecision(totalSupplyToken / BigInt(2), 5)} />
        {pendingPixels.length > 0 && <PendingPixels
          pendingPixels={pendingPixels}
          onCommit={handleCommit}
          onCancelPixel={handleCancelPixel}
        />}
        {failedPixels.length > 0 && <FailedPixels failedPixels={failedPixels} />}
        {ownedPixels.length > 0 && <OwnedPixels pixels={ownedPixels} drawing={drawing} balanceToken={balanceToken} ethBalance={ethBalance} userAddress={account?.address} />}
      </div>
      {/* <CanvasPixelGrid grid={grid} onPixelClick={handlePixelClick} pendingPixels={pendingPixels} /> */}
      <CanvasContainer grid={grid} onPixelClick={handlePixelClick} pendingPixels={pendingPixels} />
      {/* <PixelGrid PixelDojo={Pixel} entities={entities} columnCount={drawing.pixelsColumnCount} rowCount={drawing.pixelsRowCount} onPixelClick={handlePixelClick} pendingPixels={pendingPixels} /> */}
      <ColorSelector selectedColor={selectedColor} onSelectColor={setSelectedColor} />
    </div>
  );
};

export default DrawingView;
