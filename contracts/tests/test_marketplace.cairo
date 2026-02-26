use fairbid_protocol::{IMarketplaceDispatcher, IMarketplaceDispatcherTrait};
use starknet::ContractAddress;
use snforge_std::{
    declare, ContractClassTrait, DeclareResult, 
    start_cheat_caller_address, stop_cheat_caller_address
};
use core::poseidon::poseidon_hash_span;

#[test]
fn test_full_marketplace_lifecycle() {
    // 1. DECLARE AND DEPLOY
    // We declare the unique module name defined in lib.cairo
    let declare_result = declare("FairBid_Sparktensor_V1").expect('Declaration failed');
    
    // We extract the class using pattern matching
    let contract_class = match declare_result {
        DeclareResult::Success(class) => class,
        DeclareResult::AlreadyDeclared(class) => class,
    };

    let (contract_address, _) = contract_class.deploy(@array![]).expect('Deployment failed');
    let dispatcher = IMarketplaceDispatcher { contract_address };

    // 2. DEFINE THE PLAYERS
    let employer: ContractAddress = 0x111.try_into().unwrap();
    let freelancer_1: ContractAddress = 0x222.try_into().unwrap();
    let freelancer_2: ContractAddress = 0x333.try_into().unwrap();

    // 3. MATH: PRE-CALCULATE THE HASHES
    // Bidder 1: Price 500, Timeline 10, Salt 0
    let mut data1 = ArrayTrait::new();
    data1.append(500_u128.into()); 
    data1.append(0_u128.into());   
    data1.append(10_u32.into());   
    data1.append(0);               
    let hash_1 = poseidon_hash_span(data1.span());

    // Bidder 2: Price 100, Timeline 5, Salt 0
    let mut data2 = ArrayTrait::new();
    data2.append(100_u128.into()); 
    data2.append(0_u128.into());   
    data2.append(5_u32.into());    
    data2.append(0);               
    let hash_2 = poseidon_hash_span(data2.span());

    // 4. PHASE 1: CREATE JOB
    start_cheat_caller_address(contract_address, employer);
    let job_id = dispatcher.create_job(50, 50);
    stop_cheat_caller_address(contract_address);

    // 5. PHASE 2: SUBMIT BIDS
    start_cheat_caller_address(contract_address, freelancer_1);
    dispatcher.submit_bid(job_id, hash_1); 
    stop_cheat_caller_address(contract_address);

    start_cheat_caller_address(contract_address, freelancer_2);
    dispatcher.submit_bid(job_id, hash_2); 
    stop_cheat_caller_address(contract_address);

    // 6. PHASE 3: REVEAL 
    start_cheat_caller_address(contract_address, employer);
    dispatcher.start_reveal_phase(job_id);
    stop_cheat_caller_address(contract_address);

    // Freelancer 1 reveals
    start_cheat_caller_address(contract_address, freelancer_1);
    dispatcher.reveal_bid(job_id, 500, 10, 0); 
    stop_cheat_caller_address(contract_address);

    // Freelancer 2 reveals (Winner)
    start_cheat_caller_address(contract_address, freelancer_2);
    dispatcher.reveal_bid(job_id, 100, 5, 0); 
    stop_cheat_caller_address(contract_address);

    // 7. PHASE 4: THE LAW (Shortlisting)
    start_cheat_caller_address(contract_address, employer);
    dispatcher.finalize_and_shortlist(job_id);
    
    // VERIFY: The contract should have selected Freelancer 2 (Price 100)
    let winner = dispatcher.get_shortlist_candidate(job_id, 0);
    assert(winner == freelancer_2, 'Law Failed: Wrong Winner!');
    
    // 8. PHASE 5: SELECTION
    dispatcher.select_winner(job_id, freelancer_2);
    stop_cheat_caller_address(contract_address);

    println!("Success: Marketplace Law Verified!");
}