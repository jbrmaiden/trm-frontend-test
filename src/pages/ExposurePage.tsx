import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { usePrice } from '../hooks/usePrice';
import { useAddressesBalances } from '../hooks/useAddressesBalances';
import { useSanctionedStore } from '@/stores/sanctionedStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AddAddressDialog } from '@/components/AddAddressDialog';
import AddressCard from '@/components/AddressCard';
import SaveStatusIndicator from '@/components/SaveStatusIndicator';
import BigNumber from 'bignumber.js';

const ExposurePage: React.FC = () => {
  const addresses = useSanctionedStore((s) => s.addresses);
  const { data: price, isLoading: priceLoading, error: priceError } = usePrice();

  // Fetch all balances for total calculation
  const balanceQueries = useAddressesBalances(addresses);

  // Show toast when price error occurs
  useEffect(() => {
    if (priceError) {
      toast.error('Failed to fetch ETH price', {
        id: 'price-error',
        description: 'Could not load current ETH price',
      });
    }
  }, [priceError]);

  if (priceLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading ETH price...</p>
      </div>
    );
  }

  if (priceError) {
    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Price</AlertTitle>
          <AlertDescription>
            Unable to fetch ETH price. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate total USD exposure from all balances
  const totalUsd = balanceQueries
    .reduce((sum, query) => {
      if (query.data && price) {
        const usdValue = new BigNumber(query.data).multipliedBy(price);
        return sum.plus(usdValue);
      }
      return sum;
    }, new BigNumber(0))
    .toFormat(2);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl mb-2">
              Sanctioned Address Exposure
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Monitor ETH balances and USD exposure across sanctioned addresses
            </p>
          </div>
          <AddAddressDialog />
        </div>

        {/* Total Exposure Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Total Exposure</CardTitle>
            <CardDescription className="text-center">
              Aggregate USD value across all monitored addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-4">
                ${totalUsd}
              </div>
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <Badge variant="secondary">
                  ETH Price: ${price?.toLocaleString()} USD
                </Badge>
                <Badge variant="outline">
                  {addresses.length} Addresses
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end pb-4">
        <SaveStatusIndicator />
        </div>

        {/* Addresses Grid or Empty State */}
        {addresses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-2">No addresses monitored</p>
              <p className="text-sm text-muted-foreground">
                Click &quot;+ Add Address&quot; to start monitoring an Ethereum address.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address) => (
              <AddressCard key={address} address={address} ethPrice={price!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExposurePage;