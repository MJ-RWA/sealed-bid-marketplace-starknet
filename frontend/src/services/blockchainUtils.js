import { hash } from "starknet";

export const normalizeAddress = (addr) => {
    if (!addr) return "";
    // Converts to BigInt and back to hex to remove all leading zero/case differences
    try {
        return "0x" + BigInt(addr).toString(16).toLowerCase();
    } catch (e) {
        return addr.toLowerCase();
    }
};

export const generateBidCommitment = (price, timeline, salt) => {
    const priceBigInt = BigInt(price);
    const uint128Max = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
    const low = priceBigInt & uint128Max;
    const high = priceBigInt >> 128n;
    const dataToHash = [low, high, BigInt(timeline), BigInt(salt)];
    return hash.computePoseidonHashOnElements(dataToHash);
};

export const generateRandomSalt = () => {
    return "0x" + Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};