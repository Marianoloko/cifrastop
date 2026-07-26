import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, MessageSquare, Zap, Star, ShieldCheck } from "lucide-react";

export function Paywall() {
  const whatsappNumber = "5598987150431";

  const plans = [
    {
      id: "mensal",
      title: "Plano Mensal",
      price: "R$ 15,00",
      period: "por mês",
      description: "Acesso completo a todas as ferramentas por 30 dias.",
      badge: "Popular",
      message: "Olá! Gostaria de assinar o Plano Mensal de R$ 15,00 no CifraStop.",
    },
    {
      id: "diferenciado",
      title: "Plano Diferenciado",
      price: "Sob Consulta",
      period: "3 a 6 meses",
      description: "Pacotes flexíveis para quem estuda música regularmente.",
      badge: "Flexível",
      message: "Olá! Tenho interesse no Plano Diferenciado (3 a 6 meses) no CifraStop. Como funciona?",
    },
    {
      id: "anual",
      title: "Plano Anual",
      price: "R$ 120,00",
      period: "por ano",
      description: "Melhor custo-benefício! Economia garantida para o ano todo.",
      badge: "Melhor Valor",
      featured: true,
      message: "Olá! Gostaria de aproveitar a promoção e assinar o Plano Anual de R$ 120,00 no CifraStop.",
    },
  ];

  const handleOpenWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="py-12 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Escolha seu Plano de Acesso</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Assine diretamente pelo WhatsApp e libere seu acesso instantaneamente.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative flex flex-col justify-between border-2 transition-all duration-300 ${
              plan.featured
                ? "border-primary shadow-2xl scale-105 bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold">
                {plan.badge}
              </div>
            )}
            <div>
              <CardHeader>
                <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="ml-2 text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" /> Acesso a cifras ilimitadas
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" /> Afinador e Metrônomo integrados
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary" /> Gravador e Repertório
                </div>
              </CardContent>
            </div>

            <div className="p-6 pt-0">
              <Button
                onClick={() => handleOpenWhatsApp(plan.message)}
                className={`w-full py-6 font-bold flex items-center justify-center gap-2 ${
                  plan.featured ? "bg-primary text-primary-foreground" : ""
                }`}
                variant={plan.featured ? "default" : "outline"}
              >
                <MessageSquare className="w-5 h-5" />
                Assinar via WhatsApp
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
