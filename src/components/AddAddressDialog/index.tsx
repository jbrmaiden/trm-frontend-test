import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddAddressForm } from '@/hooks/useAddAddressForm';

/**
 * AddAddressDialog component for adding new Ethereum addresses to the watchlist.
 *
 * Features:
 * - Accessible dialog with focus trap and keyboard support
 * - Form validation with error display
 * - Loading state during submission
 * - Mobile responsive design
 */
function AddAddressDialog() {
  const {
    address,
    setAddress,
    error,
    isOpen,
    setIsOpen,
    isSubmitting,
    handleSubmit,
    handleCancel,
  } = useAddAddressForm();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        aria-label="Add new Ethereum address to watchlist"
      >
        <Plus className="h-4 w-4" />
        Add Address
      </DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>
                Enter an Ethereum address to monitor its balance and exposure.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="eth-address">Ethereum Address</Label>
                <Input
                  id="eth-address"
                  autoFocus
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  disabled={isSubmitting}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'address-error' : undefined}
                />
                {error && (
                  <p
                    id="address-error"
                    role="alert"
                    className="text-sm text-red-500"
                  >
                    {error}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                aria-label="Cancel adding address"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-label="Add address to watchlist"
              >
                {isSubmitting ? 'Adding...' : 'Add Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

export { AddAddressDialog };
