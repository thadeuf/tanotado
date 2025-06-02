
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cake, Gift, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BirthdaysSection: React.FC = () => {
  const birthdaysToday = [
    {
      name: 'Maria Silva',
      age: 45,
      phone: '+55 11 99999-9999',
      profileImage: null
    },
    {
      name: 'João Santos',
      age: 32,
      phone: '+55 11 88888-8888',
      profileImage: null
    },
    {
      name: 'Ana Costa',
      age: 28,
      phone: '+55 11 77777-7777',
      profileImage: null
    }
  ];

  const handleCall = (phone: string, name: string) => {
    console.log(`Ligando para ${name}: ${phone}`);
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${name}! 🎉 Feliz aniversário! Desejamos um dia cheio de alegrias e realizações! 🎂🎈`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-tanotado-navy flex items-center gap-2">
          <Cake className="h-5 w-5 text-tanotado-pink" />
          Aniversariantes do Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        {birthdaysToday.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum aniversariante hoje</p>
          </div>
        ) : (
          <div className="space-y-4">
            {birthdaysToday.map((person, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-tanotado-pink to-tanotado-purple rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-tanotado-navy">{person.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {person.age} anos hoje 🎂
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCall(person.phone, person.name)}
                    className="h-8 w-8 p-0"
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleWhatsApp(person.phone, person.name)}
                    className="bg-green-500 hover:bg-green-600 text-white h-8 w-8 p-0"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BirthdaysSection;
