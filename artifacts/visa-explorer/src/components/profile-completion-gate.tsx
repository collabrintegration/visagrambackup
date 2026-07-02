import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  useUpdateMyProfile,
  useGetCurrentAuthUser,
  getGetCurrentAuthUserQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocationAutocomplete from "@/components/location-autocomplete";

const SEX_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const MAX_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().split("T")[0];
})();

const MIN_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d.toISOString().split("T")[0];
})();

type AnyUser = Record<string, unknown> | null | undefined;

function isProfileComplete(user: AnyUser): boolean {
  if (!user) return true;
  return !!(user.firstName && user.lastName && (user.dateOfBirth || user.age) && user.sex && user.location);
}

export default function ProfileCompletionGate() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query so we can invalidate and see the updated user immediately
  const { data: authEnvelope, isLoading: userLoading } = useGetCurrentAuthUser({
    query: {
      queryKey: getGetCurrentAuthUserQueryKey(),
      enabled: isAuthenticated,
    },
  });
  const rqUser = (authEnvelope as { user?: AnyUser } | undefined)?.user as AnyUser;

  const [done, setDone] = useState(false);

  const isLoading = authLoading || userLoading;
  const needsCompletion = !done && isAuthenticated && !isLoading && !!rqUser && !isProfileComplete(rqUser);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (needsCompletion && rqUser) {
      setFirstName((rqUser.firstName as string) || "");
      setLastName((rqUser.lastName as string) || "");
      setDob((rqUser.dateOfBirth as string) || "");
      setSex((rqUser.sex as string) || "");
      setLocation((rqUser.location as string) || "");
    }
  }, [needsCompletion]);

  const { mutate: updateProfile, isPending } = useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        // Dismiss immediately — don't wait for SWR/RQ refetch
        setDone(true);
        // Invalidate so profile page reflects new data
        void queryClient.invalidateQueries({ queryKey: getGetCurrentAuthUserQueryKey() });
      },
      onError: () => {
        setErrors({ submit: "Something went wrong. Please try again." });
      },
    },
  });

  if (!needsCompletion) return null;

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    if (!dob) {
      e.dob = "Required";
    } else {
      const dobDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
      if (age < 13) e.dob = "You must be at least 13 years old";
      if (age > 120) e.dob = "Please enter a valid date of birth";
    }
    if (!sex) e.sex = "Required";
    if (!location.trim()) e.location = "Please enter your city";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    updateProfile({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
        sex,
        location: location.trim(),
      },
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 max-h-[95dvh] overflow-y-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <UserCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Complete your profile</h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Fill in these details to start using Visagram.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">First name *</label>
              <Input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                className={errors.firstName ? "border-rose-500" : ""}
              />
              {errors.firstName && <p className="text-xs text-rose-400 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Last name *</label>
              <Input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last name"
                className={errors.lastName ? "border-rose-500" : ""}
              />
              {errors.lastName && <p className="text-xs text-rose-400 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Date of birth */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date of birth *</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={MAX_DOB}
              min={MIN_DOB}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 [color-scheme:dark] ${
                errors.dob ? "border-rose-500" : "border-border"
              }`}
            />
            {errors.dob
              ? <p className="text-xs text-rose-400 mt-1">{errors.dob}</p>
              : <p className="text-xs text-muted-foreground mt-1">Your age will be calculated automatically.</p>
            }
          </div>

          {/* Gender */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Gender *</label>
            <div className="flex flex-wrap gap-2">
              {SEX_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSex(opt)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    sex === opt
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {errors.sex && <p className="text-xs text-rose-400 mt-1">{errors.sex}</p>}
          </div>

          {/* Location autocomplete */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Location *</label>
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="Type a city name…"
              hasError={!!errors.location}
            />
            {errors.location
              ? <p className="text-xs text-rose-400 mt-1">{errors.location}</p>
              : <p className="text-xs text-muted-foreground mt-1">Start typing and pick from the suggestions.</p>
            }
          </div>

          {errors.submit && (
            <p className="text-xs text-rose-400 text-center">{errors.submit}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save & Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
