import { z } from 'zod';

/**
 * Zod schema for validating Ethereum addresses.
 * - Must be exactly 42 characters (0x prefix + 40 hex characters)
 * - Must start with 0x
 * - Must contain only valid hexadecimal characters
 */
export const ethereumAddressSchema = z
  .string()
  .max(42, { message: 'Address must be exactly 42 characters' })
  .regex(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Enter a valid Ethereum address starting with 0x',
  });

export type EthereumAddress = z.infer<typeof ethereumAddressSchema>;

/**
 * Validates an Ethereum address using the schema.
 * @param address - The address string to validate
 * @returns Object with success boolean and either data or error
 */
export function validateEthereumAddress(address: string) {
  return ethereumAddressSchema.safeParse(address);
}
