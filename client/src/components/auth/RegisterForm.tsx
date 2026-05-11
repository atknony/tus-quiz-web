import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { registerSchema, type RegisterData } from "@/lib/authSchemas";
import { useAuth } from "@/hooks/useAuth";
import { UNIVERSITIES } from "@/lib/universities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SurfaceCard } from "@/components/ui/surface-card";

interface RegisterFormProps {
  onSuccess: (userId: number, email: string) => void;
}

const inputClass = "bg-background border-border focus-visible:border-border-strong";

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      university: "",
      captchaToken: "",
    },
  });

  const onSubmit = async (data: RegisterData) => {
    setServerError(null);
    try {
      const { userId } = await register(data);
      onSuccess(userId, data.email);
    } catch (err: any) {
      setServerError(err?.message ?? "Kayıt başarısız. Lütfen tekrar deneyin.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 pt-4">
      <Field
        id="reg-username"
        label="Kullanıcı Adı"
        placeholder="kullanici_adi"
        error={form.formState.errors.username?.message}
        registerProps={form.register("username")}
      />

      <Field
        id="reg-email"
        label="E-posta"
        type="email"
        placeholder="ornek@email.com"
        error={form.formState.errors.email?.message}
        registerProps={form.register("email")}
      />

      <Field
        id="reg-dob"
        label="Doğum Tarihi"
        type="date"
        error={form.formState.errors.dateOfBirth?.message}
        registerProps={form.register("dateOfBirth")}
      />

      <div className="space-y-2">
        <Label className="text-caption text-muted-foreground">Üniversite</Label>
        <Select
          onValueChange={(val) => form.setValue("university", val, { shouldValidate: true })}
        >
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder="Üniversitenizi seçin" />
          </SelectTrigger>
          <SelectContent>
            {UNIVERSITIES.length === 0 ? (
              <SelectItem value="__empty__" disabled>
                Üniversite listesi henüz eklenmedi
              </SelectItem>
            ) : (
              UNIVERSITIES.map((uni) => (
                <SelectItem key={uni} value={uni}>
                  {uni}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {form.formState.errors.university && (
          <p className="text-caption text-danger">{form.formState.errors.university.message}</p>
        )}
      </div>

      <Field
        id="reg-password"
        label="Şifre"
        type="password"
        placeholder="••••••••"
        error={form.formState.errors.password?.message}
        registerProps={form.register("password")}
      />

      <Field
        id="reg-confirm"
        label="Şifre Tekrar"
        type="password"
        placeholder="••••••••"
        error={form.formState.errors.confirmPassword?.message}
        registerProps={form.register("confirmPassword")}
      />

      <div className="pt-1">
        <div className="rounded-xl border border-border bg-surface p-2 inline-block">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={(token) =>
              form.setValue("captchaToken", token, { shouldValidate: true })
            }
            onError={() => form.setValue("captchaToken", "", { shouldValidate: true })}
            onExpire={() => form.setValue("captchaToken", "", { shouldValidate: true })}
          />
        </div>
        {form.formState.errors.captchaToken && (
          <p className="text-caption text-danger mt-1.5">
            {form.formState.errors.captchaToken.message}
          </p>
        )}
      </div>

      {serverError && (
        <SurfaceCard variant="inset" tone="danger" padding="sm">
          <p className="text-caption text-danger">{serverError}</p>
        </SurfaceCard>
      )}

      <Button type="submit" className="w-full h-11" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Kayıt yapılıyor…" : "Kayıt Ol"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  placeholder,
  type = "text",
  error,
  registerProps,
}: {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
  error?: string;
  registerProps: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-caption text-muted-foreground">
        {label}
      </Label>
      <Input id={id} type={type} placeholder={placeholder} className={inputClass} {...registerProps} />
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}
