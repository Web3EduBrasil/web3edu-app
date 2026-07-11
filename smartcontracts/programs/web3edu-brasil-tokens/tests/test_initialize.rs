
use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::{instruction::Instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

#[test]
fn test_initialize() {
    let program_id = web3edu_brasil_tokens::id();
    let payer = Keypair::new();
    let counter = Pubkey::find_program_address(
        &[web3edu_brasil_tokens::constants::COUNTER_SEED],
        &program_id,
    )
    .0;
    let mut svm = LiteSVM::new();
    let bytes = include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/web3edu_brasil_tokens.so"
    ));
    svm.add_program(program_id, bytes).unwrap();
    svm.airdrop(&payer.pubkey(), 1_000_000_000).unwrap();

    let instruction = Instruction::new_with_bytes(
        program_id,
        &web3edu_brasil_tokens::instruction::Initialize {}.data(),
        web3edu_brasil_tokens::accounts::Initialize {
            payer: payer.pubkey(),
            counter,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[instruction], Some(&payer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&payer]).unwrap();

    let res = svm.send_transaction(tx);
    assert!(res.is_ok());

    let counter_account = svm.get_account(&counter).unwrap();
    let mut data: &[u8] = &counter_account.data;
    let counter_state = web3edu_brasil_tokens::state::Counter::try_deserialize(&mut data).unwrap();
    assert_eq!(counter_state.count, 0);
    assert_eq!(counter_state.authority, payer.pubkey());

    let instruction = Instruction::new_with_bytes(
        program_id,
        &web3edu_brasil_tokens::instruction::Increment {}.data(),
        web3edu_brasil_tokens::accounts::Increment {
            counter,
            authority: payer.pubkey(),
        }
        .to_account_metas(None),
    );

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[instruction], Some(&payer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[&payer]).unwrap();

    let res = svm.send_transaction(tx);
    assert!(res.is_ok());

    let counter_account = svm.get_account(&counter).unwrap();
    let mut data: &[u8] = &counter_account.data;
    let counter_state = web3edu_brasil_tokens::state::Counter::try_deserialize(&mut data).unwrap();
    assert_eq!(counter_state.count, 1);
    assert_eq!(counter_state.authority, payer.pubkey());
}
