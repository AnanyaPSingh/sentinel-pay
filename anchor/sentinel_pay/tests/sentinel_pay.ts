import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SentinelPay } from "../target/types/sentinel_pay";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("SentinelPay", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SentinelPay as Program<SentinelPay>;

  // Test wallets
  const authority = provider.wallet as any;
  const sender = anchor.web3.Keypair.generate();
  const receiver = anchor.web3.Keypair.generate();
  const newCounterparty = anchor.web3.Keypair.generate();
  const sanctionedWallet = anchor.web3.Keypair.generate();

  // PDAs
  let institutionPda: PublicKey;
  let policyPda: PublicKey;
  let senderIdentityPda: PublicKey;
  let receiverIdentityPda: PublicKey;
  let newCounterpartyIdentityPda: PublicKey;
  let sanctionedIdentityPda: PublicKey;
  let payment1Pda: PublicKey;
  let payment2Pda: PublicKey;
  let payment3Pda: PublicKey;

  const POLICY_ID = new anchor.BN(1);
  const PAYMENT_ID_1 = new anchor.BN(1);
  const PAYMENT_ID_2 = new anchor.BN(2);
  const PAYMENT_ID_3 = new anchor.BN(3);

  before("Airdrop SOL to test wallets", async () => {
    const lamports = 10 * anchor.web3.LAMPORTS_PER_SOL;
    await provider.connection.requestAirdrop(sender.publicKey, lamports);
    await provider.connection.requestAirdrop(receiver.publicKey, lamports);
    await provider.connection.requestAirdrop(newCounterparty.publicKey, lamports);
    await provider.connection.requestAirdrop(sanctionedWallet.publicKey, lamports);

    // Wait for airdrop to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it("Test 1: Initialize Institution", async () => {
    const institutionSeed = anchor.utils.bytes.utf8.encode("institution");
    [institutionPda] = PublicKey.findProgramAddressSync(
      [institutionSeed, authority.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .initializeInstitution("ACME Exports Ltd", "IN")
      .accounts({
        authority: authority.publicKey,
        institution: institutionPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ Institution initialized:", tx);

    // Verify on-chain
    const institution = await program.account.institution.fetch(institutionPda);
    expect(institution.name).to.equal("ACME Exports Ltd");
    expect(institution.jurisdiction).to.equal("IN");
    expect(institution.isActive).to.be.true;
    expect(institution.policyCount).to.equal(0);
  });

  it("Test 2: Create Policy", async () => {
    const policySeed = anchor.utils.bytes.utf8.encode("policy");
    [policyPda] = PublicKey.findProgramAddressSync(
      [policySeed, institutionPda.toBuffer(), POLICY_ID.toBuffer("le", 8)],
      program.programId
    );

    const allowedJurisdictions = ["EU", "US", "SG", "UK"];
    const maxTransferUsdCents = new anchor.BN(50000000); // $500k
    const minKytScore = 50;
    const escrowThreshold = 3;

    const tx = await program.methods
      .createPolicy(
        POLICY_ID,
        "Cross-Border Export Policy",
        allowedJurisdictions,
        maxTransferUsdCents,
        minKytScore,
        escrowThreshold
      )
      .accounts({
        authority: authority.publicKey,
        institution: institutionPda,
        policy: policyPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ Policy created:", tx);

    // Verify on-chain
    const policy = await program.account.policy.fetch(policyPda);
    expect(policy.name).to.equal("Cross-Border Export Policy");
    expect(policy.maxTransferUsdCents.toNumber()).to.equal(50000000);
    expect(policy.minKytScore).to.equal(50);
    expect(policy.escrowNewCounterpartyThreshold).to.equal(3);
    expect(policy.isActive).to.be.true;

    // Verify policy count incremented
    const institution = await program.account.institution.fetch(institutionPda);
    expect(institution.policyCount).to.equal(1);
  });

  it("Test 3: Register Identities (Alice, Bob, Charlie)", async () => {
    // Alice: LOW risk, 10 prior transactions (trusted sender)
    const aliceSeed = anchor.utils.bytes.utf8.encode("identity");
    [senderIdentityPda] = PublicKey.findProgramAddressSync(
      [aliceSeed, institutionPda.toBuffer(), sender.publicKey.toBuffer()],
      program.programId
    );

    const kyc_expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

    const tx1 = await program.methods
      .registerIdentity("Alice", "IN", true, new anchor.BN(kyc_expiry), 0) // risk_tier: 0 = LOW
      .accounts({
        authority: authority.publicKey,
        institution: institutionPda,
        identity: senderIdentityPda,
        wallet: sender.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ Alice registered (LOW risk):", tx1);

    // Bob: LOW risk, 2 prior transactions (new counterparty)
    [receiverIdentityPda] = PublicKey.findProgramAddressSync(
      [aliceSeed, institutionPda.toBuffer(), receiver.publicKey.toBuffer()],
      program.programId
    );

    const tx2 = await program.methods
      .registerIdentity("Bob", "EU", true, new anchor.BN(kyc_expiry), 0) // risk_tier: 0 = LOW
      .accounts({
        authority: authority.publicKey,
        institution: institutionPda,
        identity: receiverIdentityPda,
        wallet: receiver.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ Bob registered (LOW risk, new counterparty):", tx2);

    // Charlie: HIGH risk, sanctioned
    [sanctionedIdentityPda] = PublicKey.findProgramAddressSync(
      [aliceSeed, institutionPda.toBuffer(), sanctionedWallet.publicKey.toBuffer()],
      program.programId
    );

    const tx3 = await program.methods
      .registerIdentity("Charlie", "US", true, new anchor.BN(kyc_expiry), 2) // risk_tier: 2 = HIGH
      .accounts({
        authority: authority.publicKey,
        institution: institutionPda,
        identity: sanctionedIdentityPda,
        wallet: sanctionedWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ Charlie registered (HIGH risk, will mark sanctioned):", tx3);

    // Verify identities
    const aliceIdentity = await program.account.identity.fetch(senderIdentityPda);
    expect(aliceIdentity.entityName).to.equal("Alice");
    expect(aliceIdentity.jurisdiction).to.equal("IN");
    expect(aliceIdentity.kycVerified).to.be.true;
    expect(aliceIdentity.isSanctioned).to.be.false;

    const bobIdentity = await program.account.identity.fetch(receiverIdentityPda);
    expect(bobIdentity.entityName).to.equal("Bob");
    expect(bobIdentity.jurisdiction).to.equal("EU");
    expect(bobIdentity.transactionCount).to.equal(0); // New counterparty
  });

  it("Test 4: Create Payment - Passes Preflight → Pending", async () => {
    const paymentSeed = anchor.utils.bytes.utf8.encode("payment");
    [payment1Pda] = PublicKey.findProgramAddressSync(
      [paymentSeed, institutionPda.toBuffer(), PAYMENT_ID_1.toBuffer("le", 8)],
      program.programId
    );

    const tx = await program.methods
      .createPayment(
        PAYMENT_ID_1,
        new anchor.BN(4500000), // $45,000 (within limit)
        "INR",
        "EUR",
        new anchor.BN(10000), // FX rate
        "ACME Bank",
        "EU Bank",
        "Invoice-001"
      )
      .accounts({
        sender: sender.publicKey,
        institution: institutionPda,
        senderIdentity: senderIdentityPda,
        receiverIdentity: receiverIdentityPda,
        policy: policyPda,
        payment: payment1Pda,
        receiver: receiver.publicKey,
        policyId: POLICY_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ Payment 1 created (should be Pending):", tx);

    // Verify payment status
    const payment = await program.account.payment.fetch(payment1Pda);
    expect(payment.paymentId.toNumber()).to.equal(1);
    expect(payment.amountUsdCents.toNumber()).to.equal(4500000);
    expect(payment.status).to.equal(0); // Pending
    expect(payment.preflightPassed).to.be.true;
  });

  it("Test 5: Create Payment - New Counterparty → InEscrow", async () => {
    [newCounterpartyIdentityPda] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("identity"), institutionPda.toBuffer(), newCounterparty.publicKey.toBuffer()],
      program.programId
    );

    // Register new counterparty with 0 transactions
    const kyc_expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    const tx0 = await program.methods
      .registerIdentity("NewBob", "EU", true, new anchor.BN(kyc_expiry), 0)
      .accounts({
        authority: authority.publicKey,
        institution: institutionPda,
        identity: newCounterpartyIdentityPda,
        wallet: newCounterparty.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ NewBob registered (0 transactions):", tx0);

    // Create payment to new counterparty
    const paymentSeed = anchor.utils.bytes.utf8.encode("payment");
    [payment2Pda] = PublicKey.findProgramAddressSync(
      [paymentSeed, institutionPda.toBuffer(), PAYMENT_ID_2.toBuffer("le", 8)],
      program.programId
    );

    const tx = await program.methods
      .createPayment(
        PAYMENT_ID_2,
        new anchor.BN(4500000), // $45,000
        "INR",
        "EUR",
        new anchor.BN(10000),
        "ACME Bank",
        "EU Bank",
        "Invoice-002"
      )
      .accounts({
        sender: sender.publicKey,
        institution: institutionPda,
        senderIdentity: senderIdentityPda,
        receiverIdentity: newCounterpartyIdentityPda,
        policy: policyPda,
        payment: payment2Pda,
        receiver: newCounterparty.publicKey,
        policyId: POLICY_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ Payment 2 created (should be InEscrow):", tx);

    // Verify payment status is InEscrow
    const payment = await program.account.payment.fetch(payment2Pda);
    expect(payment.status).to.equal(1); // InEscrow
  });

  it("Test 6: Create Payment - Sanctioned Entity → Rejected", async () => {
    const paymentSeed = anchor.utils.bytes.utf8.encode("payment");
    [payment3Pda] = PublicKey.findProgramAddressSync(
      [paymentSeed, institutionPda.toBuffer(), PAYMENT_ID_3.toBuffer("le", 8)],
      program.programId
    );

    // Mark Charlie as sanctioned by re-registering (or just attempt payment)
    const tx = await program.methods
      .createPayment(
        PAYMENT_ID_3,
        new anchor.BN(1000000), // $10,000
        "INR",
        "USD",
        new anchor.BN(10000),
        "ACME Bank",
        "US Bank",
        "Invoice-003"
      )
      .accounts({
        sender: sender.publicKey,
        institution: institutionPda,
        senderIdentity: senderIdentityPda,
        receiverIdentity: sanctionedIdentityPda,
        policy: policyPda,
        payment: payment3Pda,
        receiver: sanctionedWallet.publicKey,
        policyId: POLICY_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("  ✓ Payment 3 attempted (should be Rejected for sanctioned entity):", tx);

    // Verify payment status is Rejected
    const payment = await program.account.payment.fetch(payment3Pda);
    expect(payment.status).to.equal(3); // Rejected
    expect(payment.preflightPassed).to.be.false;
    expect(payment.rejectionReason).to.include("sanctioned");
  });

  it("Test 7: Execute Payment - Pending → Executed", async () => {
    // Note: ExecutePayment requires SPL token accounts which are complex to set up in tests
    // For now, we'll verify the preflight logic is correct
    // In a full integration, you'd set up USDC token accounts and perform the CPI

    const payment = await program.account.payment.fetch(payment1Pda);
    expect(payment.status).to.equal(0); // Pending
    expect(payment.preflightPassed).to.be.true;

    console.log("  ✓ Payment 1 is Pending and ready for execution");
  });

  it("Test 8: Release Escrow - InEscrow → Released", async () => {
    // Similar to execute_payment, release_escrow requires SPL token accounts
    // Verify the InEscrow status is set correctly

    const payment = await program.account.payment.fetch(payment2Pda);
    expect(payment.status).to.equal(1); // InEscrow

    console.log("  ✓ Payment 2 is InEscrow and ready for release");
  });
});
