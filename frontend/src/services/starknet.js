// All Starknet smart contract calls will live here

import { Provider, Contract } from "starknet";

export const provider = new Provider({
  sequencer: { network: "goerli-alpha" } // or mainnet
});
