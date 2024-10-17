// utils/pixelUtils.ts
import { PixelInfos } from '../customTypes';
import { rgbToHex } from '../utils/colorFunctions';
import { bigIntToHexString } from '../dojo/adrsParser';
import { Entity, getComponentValue} from '@dojoengine/recs';

export const processPixelData = (
  entities: Entity[],
  Pixel: any,
  accountAddress: string | undefined,
  drawing: { pixelsColumnCount: number; pixelsRowCount: number }
): { ownedPixels: PixelInfos[]; grid: PixelInfos[][] } => {
  let owned: PixelInfos[] = [];
  let newGrid: PixelInfos[][] = Array(drawing.pixelsColumnCount)
    .fill(null)
    .map(() => Array(drawing.pixelsRowCount).fill(null));

  for (const entityId of entities) {
    const pixel = getComponentValue(Pixel, entityId);
    if (pixel) {
      const owner = bigIntToHexString(pixel.owner);
      const color = rgbToHex(pixel.r, pixel.g, pixel.b);
      const pixelData = { owner, color, x: pixel.x, y: pixel.y };
      if (owner === accountAddress) owned.push(pixelData);
      newGrid[pixel.x][pixel.y] = pixelData;
    }
  }

  for (let x = 0; x < drawing.pixelsColumnCount; x++) {
    for (let y = 0; y < drawing.pixelsRowCount; y++) {
      if (newGrid[x][y] === null) newGrid[x][y] = { owner: '', color: '', x, y };
    }
  }

  return { ownedPixels: owned, grid: newGrid };
};
