import { Trash2 } from 'lucide-react';
import { useBalance } from '../hooks/useBalance';
import { useSanctionedStore } from '@/stores/sanctionedStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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

  // Calculate formatted values
  const eth = data ? new BigNumber(data).toFormat(6) : '—';
  const usd = data ? new BigNumber(data).multipliedBy(ethPrice).toFormat(2) : '—';

  function handleRemove() {
    removeAddress(address);
  }

  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      {/* Delete button and status indicator in top-right corner */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleRemove}
          aria-label={`Remove address ${address}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

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
