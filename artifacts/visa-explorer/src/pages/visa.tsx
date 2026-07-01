import { useParams, Link } from "wouter";
import { useGetVisa, getGetVisaQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Loader2, Calendar, Clock, DollarSign, ExternalLink, Info, CheckSquare, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VisaDetail() {
  const { id } = useParams<{ id: string }>();
  const visaId = parseInt(id || "0", 10);

  const { data: visa, isLoading } = useGetVisa(visaId, {
    query: {
      enabled: !!visaId,
      queryKey: getGetVisaQueryKey(visaId)
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!visa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold font-serif mb-2">Visa Record Not Found</h2>
        <Link href="/explore" className="text-secondary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-muted/30 border-b border-border py-8">
        <div className="container mx-auto px-4">
          <Link href={`/country/${visa.destinationCountryCode}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to {visa.destinationCountryName}
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 text-3xl md:text-5xl mb-4 font-serif font-bold">
                <span className="drop-shadow-sm">{visa.passportCountryFlag}</span>
                <ArrowRight className="text-muted-foreground w-8 h-8 md:w-10 md:h-10" />
                <span className="drop-shadow-sm">{visa.destinationCountryFlag}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-serif text-primary">
                {visa.passportCountryName} citizens traveling to {visa.destinationCountryName}
              </h1>
            </div>
            
            <Badge className="text-lg px-4 py-2 w-fit bg-primary text-primary-foreground">
              {visa.entryType.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-secondary" /> 
                Key Information
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" /> Fee
                  </div>
                  <div className="font-bold text-lg">{visa.fee !== null ? `${visa.fee} ${visa.feeCurrency || 'USD'}` : 'Free'}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Max Stay
                  </div>
                  <div className="font-bold text-lg">{visa.durationDays ? `${visa.durationDays} days` : 'Unlimited'}</div>
                </div>
                
                <div>
                  <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Processing
                  </div>
                  <div className="font-bold text-lg">{visa.processingDays ? `${visa.processingDays} days` : 'Instant'}</div>
                </div>

                <div>
                  <div className="text-muted-foreground text-sm font-medium mb-1 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" /> Validity
                  </div>
                  <div className="font-bold text-lg">{visa.validityDays ? `${visa.validityDays} days` : 'Varies'}</div>
                </div>
              </div>

              {visa.notes && (
                <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border/50 text-sm leading-relaxed">
                  <span className="font-semibold text-foreground mr-2">Note:</span>
                  <span className="text-muted-foreground">{visa.notes}</span>
                </div>
              )}
            </section>

            <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
               <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-secondary" /> 
                Requirements Checklist
              </h2>
              
              {visa.requirements && visa.requirements.length > 0 ? (
                <ul className="space-y-4">
                  {visa.requirements.map((req, idx) => (
                    <li key={idx} className="flex gap-3">
                      <div className="mt-0.5 text-secondary"><CheckCircle2 className="w-5 h-5" /></div>
                      <span className="text-foreground leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">No specific requirements listed for this visa type.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary text-primary-foreground rounded-xl p-6 shadow-sm">
              <h3 className="font-serif font-bold text-xl mb-4">Official Sources</h3>
              <p className="text-primary-foreground/80 text-sm mb-6 leading-relaxed">
                Always verify requirements with official government sources before traveling, as rules can change without notice.
              </p>
              {visa.officialUrl ? (
                <a 
                  href={visa.officialUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-secondary text-secondary-foreground py-3 rounded-md font-medium hover:bg-secondary/90 transition-colors"
                >
                  Visit Official Site <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <div className="text-sm italic text-primary-foreground/60 border border-primary-foreground/20 rounded p-3 text-center">
                  Official URL not provided. Please check the local embassy website.
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-serif font-bold text-lg mb-2">Metadata</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Visa Type</span>
                  <span className="font-medium capitalize">{visa.visaType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Entries Allowed</span>
                  <span className="font-medium capitalize">{visa.entries || 'Unknown'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-medium font-mono text-xs">VISA-{visa.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
