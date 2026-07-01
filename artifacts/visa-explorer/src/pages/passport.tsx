import { useState } from "react";
import { Link } from "wouter";
import { useListCountries, getListCountriesQueryKey, useListDestinationsByPassport, getListDestinationsByPassportQueryKey } from "@workspace/api-client-react";
import { CheckCircle2, FileWarning, HelpCircle, AlertCircle, ArrowRight, Loader2, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PassportPower() {
  const [selectedPassport, setSelectedPassport] = useState<string>("US");

  const { data: countries, isLoading: loadingCountries } = useListCountries(
    {}, 
    { query: { queryKey: getListCountriesQueryKey({}) } }
  );

  const { data: passportData, isLoading: loadingData } = useListDestinationsByPassport(
    { passportCode: selectedPassport },
    { 
      query: { 
        enabled: !!selectedPassport,
        queryKey: getListDestinationsByPassportQueryKey({ passportCode: selectedPassport }) 
      } 
    }
  );

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'visa_free': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900';
      case 'visa_on_arrival': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900';
      case 'evisa': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900';
      case 'visa_required': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'visa_free': return <CheckCircle2 className="w-4 h-4" />;
      case 'visa_on_arrival': return <HelpCircle className="w-4 h-4" />;
      case 'evisa': return <FileWarning className="w-4 h-4" />;
      case 'visa_required': return <AlertCircle className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-serif font-bold mb-4">Passport Power</h1>
            <p className="text-primary-foreground/80 mb-8">
              Select your passport to see exactly where you can travel and what rules apply.
            </p>

            {loadingCountries ? (
              <div className="h-14 bg-white/10 rounded-md animate-pulse"></div>
            ) : (
              <select 
                className="w-full md:w-96 h-14 px-4 bg-card text-foreground border border-border rounded-md shadow-sm text-lg font-medium focus:outline-none focus:ring-2 focus:ring-secondary"
                value={selectedPassport}
                onChange={(e) => setSelectedPassport(e.target.value)}
              >
                {countries?.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {loadingData ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          </div>
        ) : passportData ? (
          <div className="space-y-12">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="text-4xl font-serif font-bold text-green-600 mb-2">{passportData.visaFreeCount}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visa Free</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="text-4xl font-serif font-bold text-blue-600 mb-2">{passportData.visaOnArrivalCount}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visa on Arrival</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="text-4xl font-serif font-bold text-amber-600 mb-2">{passportData.evisaCount}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">e-Visa</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="text-4xl font-serif font-bold text-red-600 mb-2">{passportData.visaRequiredCount}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visa Required</div>
              </div>
            </div>

            {/* Destinations List */}
            <div>
              <h2 className="text-2xl font-serif font-bold mb-6 border-b border-border pb-4">Destinations ({passportData.totalDestinations})</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {passportData.destinations.map(dest => (
                  <Link 
                    key={dest.id} 
                    href={`/visa/${dest.id}`}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:border-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{dest.destinationCountryFlag}</span>
                      <span className="font-bold group-hover:text-secondary transition-colors">{dest.destinationCountryName}</span>
                    </div>
                    
                    <Badge variant="outline" className={`ml-2 whitespace-nowrap capitalize text-[10px] px-2 py-0.5 border ${getTypeColor(dest.entryType)}`}>
                      {dest.entryType.replace(/_/g, ' ')}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
