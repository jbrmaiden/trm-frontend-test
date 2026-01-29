import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useSanctionedStore } from '@/stores/sanctionedStore';
import { ethereumAddressSchema } from '@/components/AddAddressDialog/validation';


export interface UseAddAddressFormReturn {
  address: string;
  setAddress: (value: string) => void;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  /** Whether form submission is in progress */
  isSubmitting: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
  handleCancel: () => void;
}

/**
 * Hook to manage the Add Address form state, validation, and store integration.
 *
 * Features:
 * - Form state management (input value, error, dialog visibility, loading)
 * - Zod validation for Ethereum address format
 * - Address normalization to lowercase
 * - Case-insensitive duplicate detection
 * - Error clearing on new input
 * - Loading state for async operations (future-proofed)
 *
 * @returns Form state and handlers
 */
export function useAddAddressForm(): UseAddAddressFormReturn {
  const [address, setAddressValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** reusing Store hooks */
  const addresses = useSanctionedStore((state) => state.addresses);
  const addAddress = useSanctionedStore((state) => state.addAddress);

  const setAddress = (value: string) => {
    setAddressValue(value);
    if (error) {
      setError(null);
    }
  };

  const resetForm = () => {
    setAddressValue('');
    setError(null);
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate with Zod
    const result = ethereumAddressSchema.safeParse(address);
    if (!result.success) {
      const errorMessage = result.error.issues[0].message;
      setError(errorMessage);
      toast.error('Invalid address', { description: errorMessage });
      setIsSubmitting(false);
      return;
    }

    // Normalize to lowercase for duplicate check and storage
    const normalizedAddress = address.toLowerCase();

    // Check for duplicates (case-insensitive)
    const isDuplicate = addresses.some(
      (existingAddress) => existingAddress.toLowerCase() === normalizedAddress
    );

    if (isDuplicate) {
      const errorMessage = 'This address is already being monitored';
      setError(errorMessage);
      toast.error('Duplicate address', { description: errorMessage });
      setIsSubmitting(false);
      return;
    }

    // Add normalized address to store
    addAddress(normalizedAddress);
    toast.success('Address added', {
      description: `Now monitoring ${normalizedAddress.slice(0, 10)}...${normalizedAddress.slice(-8)}`,
    });

    // Success: close dialog and reset form
    setIsSubmitting(false);
    setIsOpen(false);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    setIsOpen(false);
  };

  return {
    address,
    setAddress,
    error,
    isOpen,
    setIsOpen,
    isSubmitting,
    handleSubmit,
    handleCancel,
  };
}
