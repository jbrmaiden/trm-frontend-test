import React from 'react';
import { useBalance } from '../hooks/useBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
 *
 * This pattern ensures hooks are called consistently (no dynamic hook calls in loops),
 * and makes it easy to refactor into table rows later.
 */
function AddressCard({ address, ethPrice }: AddressCardProps) {
  const { data, isLoading, error } = useBalance(address);

  // Calculate formatted values
  const eth = data ? new BigNumber(data).toFormat(6) : '—';
  const usd = data ? new BigNumber(data).multipliedBy(ethPrice).toFormat(2) : '—';

  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      {/* Status indicator as a small dot in top-right corner */}
      <div className="absolute top-3 right-3">
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

      <CardHeader className="pb-3 pr-8">
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
