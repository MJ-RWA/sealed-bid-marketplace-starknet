use starknet::ContractAddress;

// ==========================================
// 1. GLOBAL TYPES (Structs & Enums)
// ==========================================

#[derive(Drop, Serde, Copy, starknet::Store, PartialEq, Default)]
pub enum JobStatus {
    #[default]
    Bidding,
    Reveal,
    Shortlisted,
    Finalized,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct Job {
    pub employer: ContractAddress,
    pub price_weight: u8,
    pub timeline_weight: u8,
    pub status: JobStatus,
}

#[derive(Drop, Serde, Copy, starknet::Store)]
pub struct Bid {
    pub bidder: ContractAddress,
    pub commitment: felt252,
    pub price: u256,
    pub timeline: u32,
    pub is_revealed: bool,
}

// ==========================================
// 2. THE INTERFACE (The Menu)
// ==========================================

#[starknet::interface]
pub trait IMarketplace<TContractState> {
    fn create_job(ref self: TContractState, price_weight: u8, timeline_weight: u8) -> u64;
    fn submit_bid(ref self: TContractState, job_id: u64, commitment: felt252);
    fn start_reveal_phase(ref self: TContractState, job_id: u64);
    fn reveal_bid(ref self: TContractState, job_id: u64, price: u256, timeline: u32, salt: felt252);
    fn finalize_and_shortlist(ref self: TContractState, job_id: u64);
    fn select_winner(ref self: TContractState, job_id: u64, winner: ContractAddress);
    
    // Getters for the Backend/Frontend
    fn get_job(self: @TContractState, job_id: u64) -> Job;
    fn get_bid(self: @TContractState, job_id: u64, bidder: ContractAddress) -> Bid;
    fn get_shortlist_candidate(self: @TContractState, job_id: u64, rank: u32) -> ContractAddress;
}

// ==========================================
// 3. THE CONTRACT MODULE
// ==========================================

#[starknet::contract]
pub mod FairBid_Sparktensor_Final_V1 {
    use super::{ContractAddress, JobStatus, Job, Bid};
    use starknet::storage::{Map, StoragePathEntry};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use core::poseidon::poseidon_hash_span;

    #[storage]
    struct Storage {
        next_job_id: u64,
        jobs: Map<u64, Job>,
        bids: Map<(u64, ContractAddress), Bid>,
        // Registry to track who bid on what
        job_bidder_count: Map<u64, u32>,
        job_bidder_at_index: Map<(u64, u32), ContractAddress>,
        // THE LAW: On-chain Shortlist (Top 5)
        shortlist_addr: Map<(u64, u32), ContractAddress>,
        shortlist_score: Map<(u64, u32), u256>,
        sparktensor_entropy: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        JobCreated: JobCreated,
        BidCommitted: BidCommitted,
        BidRevealed: BidRevealed,
        ShortlistCreated: ShortlistCreated,
        WinnerSelected: WinnerSelected,
    }

    #[derive(Drop, starknet::Event)]
    pub struct JobCreated { pub job_id: u64, pub employer: ContractAddress }
    #[derive(Drop, starknet::Event)]
    pub struct BidCommitted { pub job_id: u64, pub bidder: ContractAddress }
    #[derive(Drop, starknet::Event)]
    pub struct BidRevealed { pub job_id: u64, pub bidder: ContractAddress, pub price: u256 }
    #[derive(Drop, starknet::Event)]
    pub struct ShortlistCreated { pub job_id: u64 }
    #[derive(Drop, starknet::Event)]
    pub struct WinnerSelected { pub job_id: u64, pub winner: ContractAddress }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.next_job_id.write(1);
        self.sparktensor_entropy.write(0x2202202612345);
    }

    #[abi(embed_v0)]
    impl MarketplaceImpl of super::IMarketplace<ContractState> {
        
        fn create_job(ref self: ContractState, price_weight: u8, timeline_weight: u8) -> u64 {
            let job_id = self.next_job_id.read();
            let employer = starknet::get_caller_address();
            
            let new_job = Job {
                employer,
                price_weight,
                timeline_weight,
                status: JobStatus::Bidding,
            };

            self.jobs.entry(job_id).write(new_job);

            // --- THE INITIALIZATION LAW (Now K=5) ---
            let mut i: u32 = 0;
            while i < 5 {
                self.shortlist_score.entry((job_id, i)).write(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF_u256);
                i += 1;
            };

            self.next_job_id.write(job_id + 1);
            self.emit(JobCreated { job_id, employer });
            job_id
        }

        fn submit_bid(ref self: ContractState, job_id: u64, commitment: felt252) {
            let bidder = starknet::get_caller_address();
            let job = self.jobs.entry(job_id).read();
            assert(job.status == JobStatus::Bidding, 'Job not in bidding phase');

            // 1. Save the Bid
            let new_bid = Bid { bidder, commitment, price: 0, timeline: 0, is_revealed: false };
            self.bids.entry((job_id, bidder)).write(new_bid);

            // 2. Register the Bidder in the Address Book
            let count = self.job_bidder_count.entry(job_id).read();
            self.job_bidder_at_index.entry((job_id, count)).write(bidder);
            self.job_bidder_count.entry(job_id).write(count + 1);

            self.emit(BidCommitted { job_id, bidder });
        }

        fn start_reveal_phase(ref self: ContractState, job_id: u64) {
            let mut job = self.jobs.entry(job_id).read();
            assert(starknet::get_caller_address() == job.employer, 'Only employer');
            assert(job.status == JobStatus::Bidding, 'Not in bidding phase');

            job.status = JobStatus::Reveal;
            self.jobs.entry(job_id).write(job);
        }

        fn reveal_bid(ref self: ContractState, job_id: u64, price: u256, timeline: u32, salt: felt252) {
            let bidder = starknet::get_caller_address();
            let job = self.jobs.entry(job_id).read();
            assert(job.status == JobStatus::Reveal, 'Not in reveal phase');

            let mut bid = self.bids.entry((job_id, bidder)).read();
            assert(!bid.is_revealed, 'Already revealed');

            // Cryptographic Verification (Poseidon Hash)
            let mut hash_data = ArrayTrait::new();
            hash_data.append(price.low.into());
            hash_data.append(price.high.into());
            hash_data.append(timeline.into());
            hash_data.append(salt);
            let calculated_hash = poseidon_hash_span(hash_data.span());

            assert(calculated_hash == bid.commitment, 'Invalid price or salt');

            // Save the revealed details
            bid.price = price;
            bid.timeline = timeline;
            bid.is_revealed = true;
            self.bids.entry((job_id, bidder)).write(bid);

            self.emit(BidRevealed { job_id, bidder, price });
        }

        fn finalize_and_shortlist(ref self: ContractState, job_id: u64) {
            let mut job = self.jobs.entry(job_id).read();
            assert(starknet::get_caller_address() == job.employer, 'Only employer');
            assert(job.status == JobStatus::Reveal, 'Not in reveal phase');

            let bidder_count = self.job_bidder_count.entry(job_id).read();
            
            // --- THE ON-CHAIN SORTING LAW (Now K=5) ---
            let mut i: u32 = 0;
            while i < bidder_count {
                let addr = self.job_bidder_at_index.entry((job_id, i)).read();
                let bid = self.bids.entry((job_id, addr)).read();

                if bid.is_revealed {
                    let score = (bid.price * job.price_weight.into()) + (bid.timeline.into() * job.timeline_weight.into());

                    // Check if score belongs in Top 5 (Index 4 is the 5th chair)
                    let current_5th_score = self.shortlist_score.entry((job_id, 4)).read();
                    if score < current_5th_score {
                        let mut j: u32 = 4;
                        // Shift people down to make room
                        while j > 0 {
                            let score_above = self.shortlist_score.entry((job_id, j - 1)).read();
                            if score < score_above {
                                // Move the one above into my current spot
                                let addr_above = self.shortlist_addr.entry((job_id, j - 1)).read();
                                self.shortlist_score.entry((job_id, j)).write(score_above);
                                self.shortlist_addr.entry((job_id, j)).write(addr_above);
                                j -= 1;
                            } else {
                                break;
                            }
                        };
                        // Place the new winner
                        self.shortlist_score.entry((job_id, j)).write(score);
                        self.shortlist_addr.entry((job_id, j)).write(addr);
                    }
                }
                i += 1;
            };

            job.status = JobStatus::Shortlisted;
            self.jobs.entry(job_id).write(job);
            self.emit(ShortlistCreated { job_id });
        }

        fn select_winner(ref self: ContractState, job_id: u64, winner: ContractAddress) {
            let mut job = self.jobs.entry(job_id).read();
            assert(starknet::get_caller_address() == job.employer, 'Only employer');
            assert(job.status == JobStatus::Shortlisted, 'Not shortlisted');

            // --- THE ENFORCEMENT (Verify winner is in Top 5) ---
            let mut on_shortlist = false;
            let mut i: u32 = 0;
            while i < 5 {
                if self.shortlist_addr.entry((job_id, i)).read() == winner {
                    on_shortlist = true;
                    break;
                }
                i += 1;
            };
            assert(on_shortlist, 'Winner not in Top 5');

            job.status = JobStatus::Finalized;
            self.jobs.entry(job_id).write(job);
            self.emit(WinnerSelected { job_id, winner });
        }

        // Getters
        fn get_job(self: @ContractState, job_id: u64) -> Job { self.jobs.entry(job_id).read() }
        fn get_bid(self: @ContractState, job_id: u64, bidder: ContractAddress) -> Bid { self.bids.entry((job_id, bidder)).read() }
        fn get_shortlist_candidate(self: @ContractState, job_id: u64, rank: u32) -> ContractAddress { self.shortlist_addr.entry((job_id, rank)).read() }
    }
}