import { useState, useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useUpdateMyProfile, getGetCurrentAuthUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SEX_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];

function isProfileComplete(user: Record<string, unknown> | null | undefined): boolean {
  if (!user) return true;
  return !!(
    user.firstName &&
    user.lastName &&
    user.age &&
    user.sex &&
    user.location
  );
}

export default function ProfileCompletionGate() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const typedUser = user as Record<string, unknown> | null | undefined;
  const needsCompletion = isAuthenticated && !authLoading && !isProfileComplete(typedUser);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (needsCompletion && typedUser) {
      setFirstName((typedUser.firstName as string) || "");
      setLastName((typedUser.lastName as string) || "");
      setAge((typedUser.age as number)?.toString() || "");
      setSex((typedUser.sex as string) || "");
      setLocation((typedUser.location as string) || "");
    }
  }, [needsCompletion]);

  const { mutate: updateProfile, isPending } = useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetCurrentAuthUserQueryKey() });
      },
    },
  });

  if (!needsCompletion) return null;

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    const ageNum = Number(age);
    if (!age || isNaN(ageNum) || ageNum < 13 || ageNum > 120) e.age = "Must be between 13 and 120";
    if (!sex) e.sex = "Required";
    if (!location.trim()) e.location = "Required";
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
        age: Number(age),
        sex,
        location: location.trim(),
      },
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <UserCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Complete your profile</h2>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Fill in these details to start using Visagram. This information helps connect you with the right travel community.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Age *</label>
            <Input
              type="number"
              min={13}
              max={120}
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="Your age"
              className={errors.age ? "border-rose-500" : ""}
            />
            {errors.age && <p className="text-xs text-rose-400 mt-1">{errors.age}</p>}
          </div>

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

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Location *</label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. London, UK or New York, USA"
              className={errors.location ? "border-rose-500" : ""}
            />
            {errors.location && <p className="text-xs text-rose-400 mt-1">{errors.location}</p>}
            <p className="text-xs text-muted-foreground mt-1">Where you're based (city, country)</p>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : "Save & Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
