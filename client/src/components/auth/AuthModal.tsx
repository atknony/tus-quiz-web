import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import VerifyEmailForm from "./VerifyEmailForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ open, onOpenChange, defaultTab = "login" }: AuthModalProps) {
  const [pendingVerification, setPendingVerification] = useState<{
    userId: number;
    email: string;
  } | null>(null);

  const handleRegistrationSuccess = (userId: number, email: string) => {
    setPendingVerification({ userId, email });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setPendingVerification(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        {pendingVerification ? (
          <>
            <DialogHeader>
              <div className="text-eyebrow text-muted-foreground">Doğrulama</div>
              <DialogTitle className="font-serif text-h1 text-foreground">E-posta Doğrulama</DialogTitle>
            </DialogHeader>
            <VerifyEmailForm
              userId={pendingVerification.userId}
              email={pendingVerification.email}
              onSuccess={() => {
                setPendingVerification(null);
                onOpenChange(false);
              }}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="text-eyebrow text-muted-foreground">Hesap</div>
              <DialogTitle className="font-serif text-h1 text-foreground">TUS Quiz</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue={defaultTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto border-b border-border rounded-none">
                <TabsTrigger
                  value="login"
                  className="rounded-none border-b-2 border-transparent bg-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground px-3 py-2.5"
                >
                  Giriş Yap
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-none border-b-2 border-transparent bg-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground px-3 py-2.5"
                >
                  Kayıt Ol
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm onSuccess={() => onOpenChange(false)} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm onSuccess={handleRegistrationSuccess} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
