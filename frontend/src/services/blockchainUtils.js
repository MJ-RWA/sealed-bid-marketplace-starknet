import { hash } from "starknet";

/**
 * Generates a Poseidon Hash for a Sealed Bid
 * Logic: hash([price_low, price_high, timeline, salt])
 */
export const generateBidCommitment = (price, timeline, salt) => {
    // 1. Convert price to BigInt
    const priceBigInt = BigInt(price);
    
    // 2. Split u256 into low and high 128-bit parts
    const uint128Max = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
    const low = priceBigInt & uint128Max;
    const high = priceBigInt >> 128n;

    // 3. Format data for Poseidon (all must be BigInts)
    const dataToHash = [
        low,
        high,
        BigInt(timeline),
        BigInt(salt)
    ];

    // 4. Generate the hash using the correct Starknet v6 export
    return hash.computePoseidonHashOnElements(dataToHash);
};

/**
 * Generates a random 128-bit salt
 */
export const generateRandomSalt = () => {
    return "0x" + Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};