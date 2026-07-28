import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, MessageSquare } from "lucide-react";
import { fetchPlans, openWhatsApp, type Plan } from "@/lib/plans";

const FALLBACK: Plan[] = [
  {
    id: "mensal",
    name: "Plano Mensal",
    description: "Acesso completo a todas as ferramentas por 30 dias.",
    price_label: "R$ 15,00",
    period_label: "por mês",
    duration_days: 30,
    badge: "Popular",
    featured: false,
    whatsapp_message: "Olá! Gostaria de assinar o Plano Mensal de R$ 15,00 no CifraStop.",
    features: ["Acesso a cifras ilimitadas", "Afinador e Metrônomo integrados", "Gravador e Repertório"],
    rules: {},
    active: true,
    sort_order: 1,
  },
  {
    id: "personalizado",
    name: "Plano Personalizado",
    description: "Pacotes flexíveis para quem estuda música regularmente.",
    price_label: "Sob Consulta",
    period_label: "3 a 6 meses",
    duration_days: 90,
    badge: "Flexível",
    featured: false,
    whatsapp_message: "Olá! Tenho interesse em um Plano Personalizado no CifraStop. Pode me passar um orçamento?",
    features: ["Duração sob medida", "Suporte direto no WhatsApp", "Todos os recursos liberados"],
    rules: {},
    active: true,
    sort_order: 2,
  },
  {
    id: "anual",
    name: "Plano Anual",
    description: "Melhor custo-benefício! Economia garantida para o ano todo.",
    price_label: "R$ 120,00",
    period_label: "por ano",
    duration_days: 365,
    badge: "Melhor Valor",
    featured: true,
    whatsapp_message: "Olá! Gostaria de aproveitar a promoção e assinar o Plano Anual de R$ 120,00 no CifraStop.",
    features: ["Acesso a cifras ilimitadas", "Afinador e Metrônomo integrados", "Gravador e Repertório", "2 meses grátis"],
    rules: {},
    active: true,
    sort_order: 3,
  },
];

export function Paywall() {
  const { data } = useQuery({ queryKey: ["plans", "public"], queryFn: () => fetchPlans() });
  const plans = data && data.length > 0 ? data : FALLBACK;

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
                ? "border-primary shadow-2xl md:scale-105 bg-primary/5"
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
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price_label}</span>
                  <span className="ml-2 text-muted-foreground text-sm">{plan.period_label}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                  </div>
                ))}
              </CardContent>
            </div>

            <div className="p-6 pt-0">
              <Button
                onClick={() => openWhatsApp(plan.whatsapp_message)}
                className="w-full py-6 font-bold flex items-center justify-center gap-2"
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
