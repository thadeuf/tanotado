
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Users, User } from 'lucide-react';

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [nomenclature, setNomenclature] = useState('');
  const [customNomenclature, setCustomNomenclature] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const { updateUser } = useAuth();

  const nomenclatureOptions = [
    { value: 'paciente', label: 'Paciente' },
    { value: 'cliente', label: 'Cliente' },
    { value: 'outro', label: 'Outro (personalizar)' }
  ];

  const specialtyOptions = [
    { value: 'psicologo', label: 'Psicólogo(a)' },
    { value: 'otorrino', label: 'Otorrinolaringologista' },
    { value: 'medico', label: 'Médico(a)' },
    { value: 'pedagogo', label: 'Pedagogo(a)' },
    { value: 'dentista', label: 'Dentista' },
    { value: 'nutricionista', label: 'Nutricionista' },
    { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
    { value: 'fonoaudiologo', label: 'Fonoaudiólogo(a)' },
    { value: 'outro', label: 'Outro' }
  ];

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = async () => {
    const finalNomenclature = nomenclature === 'outro' ? customNomenclature : nomenclature;
    const finalSpecialty = specialty === 'outro' ? customSpecialty : specialty;

    await updateUser({
      hasCompletedOnboarding: true,
      clientNomenclature: finalNomenclature,
      specialty: finalSpecialty
    });
  };

  const progress = (currentStep / 2) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tanotado-pink/10 via-tanotado-blue/10 to-tanotado-purple/10 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 gradient-bg rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <div>
            <CardTitle className="text-2xl text-tanotado-navy">Configuração Inicial</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Vamos personalizar o tanotado para você
            </p>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Etapa {currentStep} de 2
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-2">
                <Users className="mx-auto h-12 w-12 text-tanotado-pink" />
                <h3 className="text-lg font-semibold text-tanotado-navy">
                  Como você se refere aos seus clientes?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Escolha a nomenclatura que mais se adequa ao seu trabalho
                </p>
              </div>

              <div className="space-y-3">
                {nomenclatureOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setNomenclature(option.value)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      nomenclature === option.value
                        ? 'border-tanotado-pink bg-tanotado-pink/10'
                        : 'border-gray-200 hover:border-tanotado-pink/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      {nomenclature === option.value && (
                        <CheckCircle className="h-5 w-5 text-tanotado-pink" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {nomenclature === 'outro' && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="custom-nomenclature">Como você chama seus clientes?</Label>
                  <Input
                    id="custom-nomenclature"
                    placeholder="Ex: Consulente, Atendido, etc."
                    value={customNomenclature}
                    onChange={(e) => setCustomNomenclature(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}

              <Button 
                onClick={handleNext}
                disabled={!nomenclature || (nomenclature === 'outro' && !customNomenclature)}
                className="w-full h-11 bg-gradient-to-r from-tanotado-pink to-tanotado-purple"
              >
                Próximo
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-2">
                <User className="mx-auto h-12 w-12 text-tanotado-blue" />
                <h3 className="text-lg font-semibold text-tanotado-navy">
                  Qual é a sua especialidade?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Isso nos ajuda a personalizar melhor sua experiência
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione sua especialidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {specialtyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {specialty === 'outro' && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="custom-specialty">Qual sua especialidade?</Label>
                  <Input
                    id="custom-specialty"
                    placeholder="Digite sua especialidade"
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}

              <Button 
                onClick={handleFinish}
                disabled={!specialty || (specialty === 'outro' && !customSpecialty)}
                className="w-full h-11 bg-gradient-to-r from-tanotado-blue to-tanotado-green"
              >
                Finalizar Configuração
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
