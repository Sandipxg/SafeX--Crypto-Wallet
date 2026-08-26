/**
 * ============================================================================
 * 1. zeroizeBuffer(buffer: Uint8Array | null | undefined): void
 * ============================================================================
 * @description Actively overwrites every byte in a binary buffer with 0 (buffer.fill(0)).
 *              Prevents sensitive cryptographic keys (Argon2id keys, seed bytes)
 *              from lingering in unallocated RAM memory where they could be exposed
 *              to RAM dump attacks or side-channel memory leaks.
 *              Necessary because JavaScript's Garbage Collector does NOT zero out memory blocks.
 *
 * @where_used  apps/web/lib/crypto/vault.ts (inside finally {} blocks of createAndSaveVault & unlockVault)
 *
 * @when_used   Immediately after encryption or decryption completes.
 */
export function zeroizeBuffer(buffer: Uint8Array | null | undefined): void {
  if (!buffer) return
  buffer.fill(0)
}

/**
 * ============================================================================
 * 2. zeroizeArray(arr: Array<any>): void
 * ============================================================================
 * @description Safely clears array elements by overwriting each index with 0
 *              and truncating array length to 0.
 *
 * @where_used  Security utility for in-memory byte/array sanitization.
 */
export function zeroizeArray(arr: Array<any>): void {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = 0
  }
  arr.length = 0
}

/*
 ============================================================================
 📘 REVISION NOTES & SECURITY GUIDE: MEMORY ZEROIZATION vs GARBAGE COLLECTOR
 ============================================================================

 1. THE PROBLEM: WHY WE CANNOT RELY ON JAVASCRIPT'S GARBAGE COLLECTOR (GC)
    - Unpredictable Timing (Nondeterminism):
      The JS Garbage Collector (V8 engine) runs whenever it wants (e.g. when RAM
      pressure is high or CPU is idle). A secret key sitting in a variable could
      linger un-cleared in RAM for 30 seconds, 10 minutes, or several hours!

    - Garbage Collector DOES NOT Zero Out Memory:
      When GC frees a variable, it only deletes the pointer/reference and marks
      that memory address block as "available for future reuse".
      It DOES NOT write zeros over the RAM chip! The raw secret key bytes
      ([241, 12, 88, 99, 150]) physically remain sitting in RAM memory blocks
      until another program eventually overwrites them.

 2. ATTACK VECTORS FOR LINGERING RAM SECRETS:
    - Malicious Browser Extensions scanning unallocated browser process memory.
    - CPU Side-Channel Exploits (Spectre / Meltdown) inspecting RAM blocks.
    - Crash Dumps writing un-erased RAM bytes to hard drive crash log files.

 3. THE SOLUTION: ACTIVE MEMORY ZEROIZATION (zeroizeBuffer)
    - zeroizeBuffer executes INSTANTLY (deterministically).
    - It calls buffer.fill(0), which physically writes 0x00 bytes into every byte
      of the RAM memory block right now.
    - Wrapped inside try ... finally blocks in vault.ts so secret key bytes are
      100% erased from RAM the exact millisecond encryption/decryption finishes.
 ============================================================================
*/


