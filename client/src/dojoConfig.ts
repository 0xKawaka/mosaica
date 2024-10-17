import { createDojoConfig } from "@dojoengine/core";
import manifest from "./dojo/manifest.json";

 let dojoConfig = createDojoConfig({
    manifest,
});


// dojoConfig.rpcUrl = "https://api.cartridge.gg/x/starknet/sepolia";
// dojoConfig.toriiUrl = "https://api.cartridge.gg/x/meme-art/torii";
// dojoConfig.masterAddress = "0x70f190c20ae3ea468887ce82b86f3169a076c12b9e167997d8e5e080c5880b3";
// dojoConfig.masterPrivateKey  = "0x3ae2c43e497f11a7bde8fef74d83199f55161ac62ae953e7e3036e33a4965d5";

dojoConfig.rpcUrl = "https://api.cartridge.gg/x/mosaica/katana";
dojoConfig.toriiUrl = "https://api.cartridge.gg/x/mosaica/torii";
dojoConfig.masterAddress = "0x68594ce58eccc8e7a02d0afdbce365ea480a7c48341b5328d0bf44b32a957bc";
dojoConfig.masterPrivateKey  = "0x42eaf334357c3039f435e2f5fbd099696eb37a70891034da289e4305b83286b";

export {dojoConfig};

