/**
 * Phantom-Style Wallet Operations
 * 100% client-side, secure, fast
 */

import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { encryptData, decryptData } from './crypto';

const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const USDC_MINT = new PublicKey(import.meta.env.VITE_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Create Solana connection
export const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

/**
 * Generate new Solana keypair
 * Returns: { publicKey, privateKey (base58) }
 */
export function generateKeypair(): { publicKey: string; privateKey: string } {
  const keypair = Keypair.generate();
  
  return {
    publicKey: keypair.publicKey.toBase58(),
    privateKey: Buffer.from(keypair.secretKey).toString('base64'),
  };
}

/**
 * Encrypt private key with PIN
 * Returns: { encrypted, iv, salt }
 */
export async function encryptPrivateKey(
  privateKey: string,
  pin: string
): Promise<{ encrypted: string; iv: string; salt: string }> {
  return encryptData(privateKey, pin);
}

/**
 * Decrypt private key with PIN
 * Returns: privateKey (base64)
 */
export async function decryptPrivateKey(
  encrypted: string,
  pin: string,
  iv: string,
  salt: string
): Promise<string> {
  return decryptData(encrypted, pin, iv, salt);
}

/**
 * Get Keypair from encrypted private key
 */
export async function getKeypairFromEncrypted(
  encrypted: string,
  pin: string,
  iv: string,
  salt: string
): Promise<Keypair> {
  const privateKeyBase64 = await decryptPrivateKey(encrypted, pin, iv, salt);
  const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
  return Keypair.fromSecretKey(privateKeyBytes);
}

/**
 * Get USDC balance for wallet
 * Returns: balance in USDC (6 decimals)
 */
export async function getUSDCBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    
    // Get associated token account for USDC
    const tokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      publicKey
    );
    
    // Get token account balance
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    
    if (!balance.value) {
      return 0;
    }
    
    // USDC has 6 decimals
    return parseFloat(balance.value.uiAmount?.toString() || '0');
  } catch (error) {
    console.error('Failed to get USDC balance:', error);
    return 0;
  }
}

/**
 * Get SOL balance for wallet
 * Returns: balance in SOL
 */
export async function getSOLBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Failed to get SOL balance:', error);
    return 0;
  }
}

/**
 * Send USDC to recipient
 * Returns: transaction signature
 */
export async function sendUSDC(
  senderKeypair: Keypair,
  recipientAddress: string,
  amount: number
): Promise<string> {
  try {
    const recipientPublicKey = new PublicKey(recipientAddress);
    
    // Get sender's USDC token account
    const senderTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      senderKeypair.publicKey
    );
    
    // Get recipient's USDC token account
    const recipientTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      recipientPublicKey
    );
    
    // USDC has 6 decimals
    const amountInSmallestUnit = Math.floor(amount * 1_000_000);
    
    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      senderKeypair.publicKey,
      amountInSmallestUnit,
      [],
      TOKEN_PROGRAM_ID
    );
    
    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderKeypair.publicKey;
    
    // Sign transaction
    transaction.sign(senderKeypair);
    
    // Send transaction
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      }
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error('Failed to send USDC:', error);
    throw new Error('Transaction failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get transaction details from signature
 */
export async function getTransactionDetails(signature: string) {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    
    return tx;
  } catch (error) {
    console.error('Failed to get transaction:', error);
    return null;
  }
}

/**
 * Check if wallet has USDC token account
 */
export async function hasUSDCTokenAccount(walletAddress: string): Promise<boolean> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const tokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      publicKey
    );
    
    const accountInfo = await connection.getAccountInfo(tokenAccount);
    return accountInfo !== null;
  } catch {
    return false;
  }
}

/**
 * Estimate transaction fee
 * Returns: fee in SOL
 */
export async function estimateTransactionFee(): Promise<number> {
  try {
    // Get recent fee for a simple transfer
    const { feeCalculator } = await connection.getRecentBlockhash();
    return feeCalculator.lamportsPerSignature / LAMPORTS_PER_SOL;
  } catch {
    // Fallback estimate
    return 0.000005; // 5000 lamports
  }
}
