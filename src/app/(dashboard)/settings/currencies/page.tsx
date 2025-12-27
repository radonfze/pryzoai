import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Globe } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function CurrenciesPage() {
  // Mock currencies
  const currencies = [
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", rate: 1, isBase: true },
    { code: "USD", name: "US Dollar", symbol: "$", rate: 3.6725, isBase: false },
    { code: "EUR", name: "Euro", symbol: "€", rate: 4.0213, isBase: false },
    { code: "GBP", name: "British Pound", symbol: "£", rate: 4.6582, isBase: false },
    { code: "SAR", name: "Saudi Riyal", symbol: "﷼", rate: 0.9793, isBase: false },
    { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 0.0441, isBase: false },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Currencies</h2>
          <p className="text-muted-foreground">Manage currencies and exchange rates</p>
        </div>
        <Link href="/settings/currencies/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Currency</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {currencies.map((currency) => (
          <Card key={currency.code} className={currency.isBase ? "border-primary" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">{currency.symbol}</span>
                  <span>{currency.code}</span>
                </CardTitle>
                {currency.isBase && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Base</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{currency.name}</p>
              <div className="mt-2 text-lg font-mono">
                {currency.isBase ? "1.00" : currency.rate.toFixed(4)} AED
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Exchange Rate Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Exchange rates are shown relative to the base currency (AED). 
            Rates are updated manually or via integration with exchange rate providers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
