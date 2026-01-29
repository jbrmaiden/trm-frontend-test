import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBalance } from '../../hooks/useBalance';
import { useSanctionedStore } from '@/stores/sanctionedStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import BigNumber from 'bignumber.js';

interface AddressCardProps {
  address: string;
  ethPrice: number;
}

/**
 * AddressCard component that displays balance information for a single Ethereum address.
 * Each card manages its own data fetching via useBalance hook.
 */
function AddressCard({ address, ethPrice }: AddressCardProps) {
  const { data, isLoading, error } = useBalance(address);
  const removeAddress = useSanctionedStore((s) => s.removeAddress);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Calculate formatted values
  const eth = data ? new BigNumber(data).toFormat(6) : '—';
  const usd = data ? new BigNumber(data).multipliedBy(ethPrice).toFormat(2) : '—';

  function handleRemove() {
    removeAddress(address);
    setIsDialogOpen(false);
    toast.success('Address removed', {
      description: `Stopped monitoring ${address.slice(0, 10)}...${address.slice(-8)}`,
    });
  }

  function handleCancel() {
    setIsDialogOpen(false);
  }

  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      {/* Delete button and status indicator in top-right corner */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {/* Delete button with confirmation dialog */}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label={`Remove address ${address}`}
          >
            <Trash2 className="h-4 w-4" />
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogBackdrop />
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Address</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to stop monitoring this address?
                  <span className="block mt-2 font-mono text-xs break-all">
                    {address}
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRemove}>
                  Remove
                </Button>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialog>

        {/* Status indicator */}
        {isLoading ? (
          <div
            className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"
            title="Loading"
          />
        ) : error ? (
          <div className="w-3 h-3 rounded-full bg-red-500" title="Error loading data" />
        ) : (
          <div
            className="w-3 h-3 rounded-full bg-green-500"
            title="Data loaded successfully"
          />
        )}
      </div>

      <CardHeader className="pb-3 pr-12 mt-4">
        <CardTitle className="text-sm font-mono break-all leading-tight">
          {address}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">ETH Balance</span>
            <span className="font-semibold text-right">
              {isLoading ? <LoadingSpinner size="sm" /> : <span>{eth} ETH</span>}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">USD Value</span>
            <span className="font-semibold text-green-600 text-right">
              {isLoading ? <LoadingSpinner size="sm" /> : <span>${usd}</span>}
            </span>
          </div>
          {error && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                Failed to load
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AddressCard;
