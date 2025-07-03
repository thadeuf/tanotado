// src/components/OnboardingFlow.tsx
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../contexts/AuthContext';
// Importando os ícones que serão usados
import { CheckCircle, Users, Briefcase, Sparkles, ChevronsUpDown, Check, CalendarCheck, FileText, Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
// Importando o componente de Alerta
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [nomenclature, setNomenclature] = useState('');
  const [customNomenclature, setCustomNomenclature] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [appointmentLabel, setAppointmentLabel] = useState('');
  const [customAppointmentLabel, setCustomAppointmentLabel] = useState('');
  // Adicionando estados para a nova etapa
  const [recordLabel, setRecordLabel] = useState('');
  const [customRecordLabel, setCustomRecordLabel] = useState('');
  const [openPopover, setOpenPopover] = useState(false);
  const [search, setSearch] = useState("");

  const { updateUser } = useAuth();

  const specialtyOptions = [
    'Psicóloga(o)', 'Nutricionista', 'Fisioterapeuta', 'Fonoaudiólogo(a)',
    'Terapeuta Ocupacional', 'Médico', 'Dermatologista', 'Psiquiatra',
    'Endocrinologista', 'Ginecologista', 'Dentista', 'Personal Trainer',
    'Terapeuta', 'Acupunturista', 'Massoterapeuta', 'Coach',
    'Psicanalista', 'Enfermeiro', 'Advogado(a)', 'Contador(a)',
    'Consultor', 'Arquiteto(a)', 'Designer de Interiores', 'Social Media',
    'Esteticista', 'Cabeleireiro(a)', 'Maquiador(a)', 'Manicure',
    'Personal Organizer', 'Professor(a) Particular', 'Pet Sitter / Dog Walker',
    'Outro'
  ];

  // Lista para verificar se a especialidade é da área da saúde
  const healthSpecialties = [
    'Psicóloga(o)', 'Nutricionista', 'Fisioterapeuta', 'Fonoaudiólogo(a)',
    'Terapeuta Ocupacional', 'Médico', 'Dermatologista', 'Psiquiatra',
    'Endocrinologista', 'Ginecologista', 'Dentista', 'Terapeuta',
    'Psicanalista', 'Enfermeiro'
  ];

  const isHealthProfessional = healthSpecialties.includes(specialty);

  const filteredSpecialties = useMemo(() => {
    if (!search) return specialtyOptions;
    return specialtyOptions.filter(option =>
      option.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const nomenclatureOptions = [
    { value: 'paciente', label: 'Paciente' },
    { value: 'cliente', label: 'Cliente' },
    { value: 'outro', label: 'Outro (personalizar)' }
  ];

  const appointmentLabelOptions = [
    { value: 'agendamento', label: 'Agendamento' },
    { value: 'reuniao', label: 'Reunião' },
    { value: 'evento', label: 'Evento' },
    { value: 'outro', label: 'Outro (personalizar)' }
  ];
  
  // Opções para a nova etapa
  const recordLabelOptions = [
    { value: 'prontuario', label: 'Prontuário' },
    { value: 'ficha_cliente', label: 'Ficha do Cliente' },
    { value: 'outro', label: 'Outro (personalizar)' }
  ];

  const handleNext = () => {
    // Agora o fluxo tem 5 etapas
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinish = async () => {
    const finalNomenclature = nomenclature === 'outro' ? customNomenclature : nomenclature;
    const finalSpecialty = specialty === 'Outro' ? customSpecialty : specialty;
    const finalAppointmentLabel = appointmentLabel === 'outro' ? customAppointmentLabel : appointmentLabel;
    const finalRecordLabel = recordLabel === 'outro' ? customRecordLabel : recordLabel;

    await updateUser({
      hasCompletedOnboarding: true,
      clientNomenclature: finalNomenclature,
      specialty: finalSpecialty,
      appointment_label: finalAppointmentLabel,
      specialty_label: finalRecordLabel, // Salvando o novo dado
    });
  };

  // Barra de progresso atualizada para 5 etapas
  const progress = (currentStep / 5) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <Briefcase className="mx-auto h-12 w-12 text-tanotado-blue" />
              <h3 className="text-lg font-semibold text-tanotado-navy">
                Qual é a sua especialidade?
              </h3>
              <p className="text-sm text-muted-foreground">
                Isso nos ajuda a personalizar melhor sua experiência.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Popover open={openPopover} onOpenChange={setOpenPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-11">
                    {specialty || "Selecione sua especialidade"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Pesquisar especialidade..." value={search} onValueChange={setSearch} />
                    <CommandList>
                      <CommandEmpty>Nenhuma especialidade encontrada.</CommandEmpty>
                      <CommandGroup>
                        {filteredSpecialties.map((option) => (
                          <CommandItem
                            key={option}
                            value={option}
                            onSelect={() => {
                              setSpecialty(option);
                              setOpenPopover(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", specialty === option ? "opacity-100" : "opacity-0")} />
                            {option}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {specialty === 'Outro' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="custom-specialty">Qual sua especialidade?</Label>
                <Input id="custom-specialty" placeholder="Digite sua especialidade" value={customSpecialty} onChange={(e) => setCustomSpecialty(e.target.value)} className="h-11"/>
              </div>
            )}
            <Button onClick={handleNext} disabled={!specialty || (specialty === 'Outro' && !customSpecialty)} className="w-full h-11 bg-gradient-to-r from-tanotado-pink to-tanotado-purple">Próximo</Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <Users className="mx-auto h-12 w-12 text-tanotado-pink" />
              <h3 className="text-lg font-semibold text-tanotado-navy">
                Como você se refere aos seus clientes?
              </h3>
              <p className="text-sm text-muted-foreground">
                Escolha a nomenclatura que mais se adequa ao seu trabalho.
              </p>
            </div>
            <div className="space-y-3">
              {nomenclatureOptions.map((option) => (
                <button key={option.value} onClick={() => setNomenclature(option.value)} className={`w-full p-3 rounded-lg border-2 transition-all text-left ${nomenclature === option.value ? 'border-tanotado-pink bg-tanotado-pink/10' : 'border-gray-200 hover:border-tanotado-pink/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {nomenclature === option.value && (<CheckCircle className="h-5 w-5 text-tanotado-pink" />)}
                  </div>
                </button>
              ))}
            </div>
            {nomenclature === 'outro' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="custom-nomenclature">Como você chama seus clientes?</Label>
                <Input id="custom-nomenclature" placeholder="Ex: Consulente, Atendido, etc." value={customNomenclature} onChange={(e) => setCustomNomenclature(e.target.value)} className="h-11"/>
              </div>
            )}
            <Button onClick={handleNext} disabled={!nomenclature || (nomenclature === 'outro' && !customNomenclature)} className="w-full h-11 bg-gradient-to-r from-tanotado-pink to-tanotado-purple">Próximo</Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <CalendarCheck className="mx-auto h-12 w-12 text-tanotado-purple" />
              <h3 className="text-lg font-semibold text-tanotado-navy">
                Como prefere chamar o agendamento?
              </h3>
              <p className="text-sm text-muted-foreground">
                Esta palavra será usada em lembretes e notificações.
              </p>
            </div>
            <div className="space-y-3">
              {appointmentLabelOptions.map((option) => (
                <button key={option.value} onClick={() => setAppointmentLabel(option.value)} className={`w-full p-3 rounded-lg border-2 transition-all text-left ${appointmentLabel === option.value ? 'border-tanotado-purple bg-tanotado-purple/10' : 'border-gray-200 hover:border-tanotado-purple/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {appointmentLabel === option.value && (<CheckCircle className="h-5 w-5 text-tanotado-purple" />)}
                  </div>
                </button>
              ))}
            </div>
            {appointmentLabel === 'outro' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="custom-appointment-label">Digite o nome desejado</Label>
                <Input id="custom-appointment-label" placeholder="Ex: Sessão, Consulta" value={customAppointmentLabel} onChange={(e) => setCustomAppointmentLabel(e.target.value)} className="h-11" />
              </div>
            )}
            <Button onClick={handleNext} disabled={!appointmentLabel || (appointmentLabel === 'outro' && !customAppointmentLabel)} className="w-full h-11 bg-gradient-to-r from-tanotado-pink to-tanotado-purple">Próximo</Button>
          </div>
        );
      case 4: // NOVA ETAPA
        return (
            <div className="space-y-4 animate-fade-in">
                <div className="text-center space-y-2">
                    <FileText className="mx-auto h-12 w-12 text-tanotado-green" />
                    <h3 className="text-lg font-semibold text-tanotado-navy">Como prefere chamar o registro dos atendimentos?</h3>
                </div>
                {isHealthProfessional && (
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Aviso Importante</AlertTitle>
                        <AlertDescription>
                            Todos os profissionais da área da saúde regulamentados por conselhos têm obrigação de manter prontuário do paciente conforme a legislação brasileira.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="space-y-3">
                    {recordLabelOptions.map((option) => (
                        <button key={option.value} onClick={() => setRecordLabel(option.value)} className={`w-full p-3 rounded-lg border-2 transition-all text-left ${recordLabel === option.value ? 'border-tanotado-green bg-tanotado-green/10' : 'border-gray-200 hover:border-tanotado-green/50'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{option.label}</span>
                                {recordLabel === option.value && (<CheckCircle className="h-5 w-5 text-tanotado-green" />)}
                            </div>
                        </button>
                    ))}
                </div>
                {recordLabel === 'outro' && (
                    <div className="space-y-2 animate-fade-in">
                        <Label htmlFor="custom-record-label">Digite o nome desejado</Label>
                        <Input id="custom-record-label" placeholder="Máx. 20 caracteres" value={customRecordLabel} onChange={(e) => setCustomRecordLabel(e.target.value)} maxLength={20} className="h-11" />
                    </div>
                )}
                <Button onClick={handleNext} disabled={!recordLabel || (recordLabel === 'outro' && !customRecordLabel)} className="w-full h-11 bg-gradient-to-r from-tanotado-pink to-tanotado-purple">Próximo</Button>
            </div>
        );
      case 5: // ETAPA FINAL
        return (
            <div className="space-y-6 animate-fade-in text-center">
                <Sparkles className="mx-auto h-12 w-12 text-tanotado-green" />
                <h3 className="text-xl font-semibold text-tanotado-navy">
                    Tudo pronto para começar!
                </h3>
                <p className="text-muted-foreground">
                    Suas preferências foram salvas. Você pode alterá-las a qualquer momento nas configurações.
                </p>
                <Button
                    onClick={handleFinish}
                    className="w-full h-11 bg-gradient-to-r from-tanotado-blue to-tanotado-green"
                >
                    Finalizar e Ir para a Agenda
                </Button>
            </div>
        )
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tanotado-pink/10 via-tanotado-blue/10 to-tanotado-purple/10 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <img
            src="/lovable-uploads/a142e49f-c405-4af5-96d0-7ae0ebbb6627.png"
            alt="Tanotado Logo"
            className="w-32 h-32 mx-auto"
          />
          <div>
            <CardTitle className="text-2xl text-tanotado-navy">Configuração Inicial</CardTitle>
            <CardDescription className="text-sm mt-2">
              Vamos personalizar o tanotado para você
            </CardDescription>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Etapa {currentStep} de 5
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;