import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PRICING_PLANS = [
  {
    id: "plan-1",
    models: 1,
    price: 2.49,
    credits: 1,
    popular: false,
  },
  {
    id: "plan-3",
    models: 3,
    price: 5.00,
    credits: 3,
    popular: true,
  },
  {
    id: "plan-5",
    models: 5,
    price: 10.00,
    credits: 5,
    popular: false,
  },
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState(PRICING_PLANS[1]); // Default to middle plan
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'multibanco'>('mbway');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const createPaymentMutation = trpc.payment.createPayment.useMutation({
    onSuccess: (data) => {
      setPaymentData(data);
      toast.success("Pagamento iniciado com sucesso!");
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error("Erro ao processar pagamento: " + error.message);
      setIsProcessing(false);
    }
  });

  const handlePayment = async () => {
    if (paymentMethod === 'mbway' && !phoneNumber) {
      toast.error("Por favor, insira o número de telefone");
      return;
    }

    if (paymentMethod === 'mbway' && !/^(9[1236]\d{7}|2\d{8})$/.test(phoneNumber.replace(/\s/g, ''))) {
      toast.error("Número de telefone inválido");
      return;
    }

    setIsProcessing(true);

    try {
      await createPaymentMutation.mutateAsync({
        amount: selectedPlan.price,
        credits: selectedPlan.credits,
        method: paymentMethod,
        phoneNumber: paymentMethod === 'mbway' ? phoneNumber : undefined,
      });
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/editor">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Comprar Créditos</h1>
              <p className="text-sm text-gray-500">
                Escolha o seu plano e método de pagamento
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {!paymentData ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column: Plan Selection */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Escolha o seu plano</h2>
                  <p className="text-gray-600">
                    Cada crédito permite exportar 1 currículo sem marca de água
                  </p>
                </div>

                <div className="space-y-4">
                  {PRICING_PLANS.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                        selectedPlan.id === plan.id ? 'ring-2 ring-primary' : ''
                      } ${plan.popular ? 'relative' : ''}`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                            MAIS POPULAR
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {plan.models} {plan.models === 1 ? 'Modelo' : 'Modelos'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {plan.credits} {plan.credits === 1 ? 'crédito' : 'créditos'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            €{plan.price.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            €{(plan.price / plan.credits).toFixed(2)} por modelo
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">✨ O que está incluído:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Exportação PDF sem marca de água</li>
                    <li>• Acesso a todos os templates profissionais</li>
                    <li>• Personalização completa</li>
                    <li>• Créditos sem data de validade</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Payment Method */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Método de pagamento</h2>
                  <p className="text-gray-600">
                    Pagamento seguro através de IFTHENPay
                  </p>
                </div>

                <Card className="p-6">
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="space-y-4">
                      {/* MB Way */}
                      <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod === 'mbway' ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="mbway" id="mbway" />
                          <Label htmlFor="mbway" className="flex items-center gap-3 cursor-pointer flex-1">
                            <Smartphone className="w-6 h-6 text-primary" />
                            <div>
                              <div className="font-semibold">MB Way</div>
                              <div className="text-xs text-gray-500">Pagamento instantâneo via telemóvel</div>
                            </div>
                          </Label>
                        </div>
                        
                        {paymentMethod === 'mbway' && (
                          <div className="mt-4 pl-9">
                            <Label htmlFor="phone" className="text-sm">Número de telemóvel</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="912 345 678"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Receberá uma notificação na app MB Way
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Multibanco */}
                      <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod === 'multibanco' ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="multibanco" id="multibanco" />
                          <Label htmlFor="multibanco" className="flex items-center gap-3 cursor-pointer flex-1">
                            <CreditCard className="w-6 h-6 text-primary" />
                            <div>
                              <div className="font-semibold">Multibanco</div>
                              <div className="text-xs text-gray-500">Referência para pagamento em ATM</div>
                            </div>
                          </Label>
                        </div>
                        
                        {paymentMethod === 'multibanco' && (
                          <div className="mt-4 pl-9">
                            <p className="text-xs text-gray-600">
                              Será gerada uma referência Multibanco para pagamento em qualquer caixa ATM ou homebanking
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="mt-6 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">Total a pagar:</span>
                      <span className="text-2xl font-bold text-primary">
                        €{selectedPlan.price.toFixed(2)}
                      </span>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          A processar...
                        </>
                      ) : (
                        <>
                          {paymentMethod === 'mbway' ? (
                            <Smartphone className="w-5 h-5 mr-2" />
                          ) : (
                            <CreditCard className="w-5 h-5 mr-2" />
                          )}
                          Confirmar Pagamento
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500 mt-4">
                      Ao confirmar, concorda com os nossos{' '}
                      <a href="#" className="text-primary hover:underline">Termos e Condições</a>
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            // Payment Success/Instructions
            <Card className="p-8 max-w-2xl mx-auto">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {paymentMethod === 'mbway' ? 'Pagamento MB Way Iniciado' : 'Referência Multibanco Gerada'}
                  </h2>
                  <p className="text-gray-600">
                    {paymentMethod === 'mbway' 
                      ? 'Verifique a notificação na app MB Way e confirme o pagamento'
                      : 'Use a referência abaixo para efetuar o pagamento'}
                  </p>
                </div>

                {paymentMethod === 'multibanco' && paymentData.reference && (
                  <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-sm text-gray-500">Entidade</div>
                        <div className="text-xl font-mono font-bold">{paymentData.entity}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Referência</div>
                        <div className="text-xl font-mono font-bold">{paymentData.reference}</div>
                      </div>
                    </div>
                    <div className="text-left pt-3 border-t">
                      <div className="text-sm text-gray-500">Valor</div>
                      <div className="text-2xl font-bold text-primary">€{selectedPlan.price.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'mbway' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      Foi enviado um pedido de pagamento para o número <strong>{phoneNumber}</strong>.
                      Por favor, abra a app MB Way e confirme o pagamento.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 justify-center pt-4">
                  <Button variant="outline" onClick={() => setLocation('/editor')}>
                    Voltar ao Editor
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Novo Pagamento
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Os créditos serão adicionados automaticamente após confirmação do pagamento
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
