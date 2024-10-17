import { connect, disconnect } from "starknetkit"
import { Account, RpcProvider, AccountInterface } from 'starknet';
import "./WalletWrapper.css";

// import { useAccount, useConnect } from "@starknet-react/core";

type MemesDrawingsProps = {
  setAccount: React.Dispatch<React.SetStateAction<Account | AccountInterface | undefined>>
  account: Account | AccountInterface | undefined;
  rpcUrl: string;
};


export default function WalletWrapper({setAccount, account, rpcUrl}: MemesDrawingsProps) {
// export default function WalletWrapper() {
  // const { connect, connectors } = useConnect();
  // const { address } = useAccount();


  // return (
  //   <div className="wallet-wrapper-container">
  //     {!address &&
  //     <ul>
  //       {connectors.map((connector) => (
  //         <li key={connector.id}>
  //           <button onClick={() => connect({ connector })}>
  //             {connector.name}
  //           </button>
  //         </li>
  //       ))}
  //     </ul>
  //     }
  //     {address && <div className="wallet-wrapper-address">{address}</div>}
  //   </div>
  // );

  const connectWallet = async () => {
    const { wallet, connectorData, connector } = await connect({modalMode: 'alwaysAsk'})
    if (wallet && connectorData && connector) {
      const provider = new RpcProvider({
        nodeUrl: rpcUrl,
      });
      console.log("wallet", wallet)
      setAccount(await connector.account(provider))
    }
  }

  return (
    <div className="wallet-wrapper-container">
      {!account && <div className="wallet-wrapper-connect" onClick={connectWallet}>Connect Wallet</div>}
      {account && <div className="wallet-wrapper-address">{account.address}</div>}
    </div>
  );
}


