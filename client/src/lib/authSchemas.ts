import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "E-posta zorunludur."),
  password: z.string().min(1, "Şifre zorunludur."),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Kullanıcı adı en az 3 karakter olmalıdır.")
      .max(30, "Kullanıcı adı en fazla 30 karakter olabilir.")
      .regex(/^[a-zA-Z0-9_]+$/, "Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir."),
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalıdır.")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Şifre en az bir özel karakter içermelidir."
      ),
    confirmPassword: z.string(),
    dateOfBirth: z.string().min(1, "Doğum tarihi zorunludur."),
    university: z.string().min(1, "Üniversite seçiniz."),
    captchaToken: z.string().min(1, "Lütfen robot olmadığınızı doğrulayın."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor.",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  userId: z.number(),
  otp: z.string().length(6, "6 haneli kodu giriniz."),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type VerifyEmailData = z.infer<typeof verifyEmailSchema>;
