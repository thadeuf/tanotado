
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConflictInfo {
  date: Date;
  time: string;
  title: string;
}

interface AppointmentRecurrenceConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  conflicts: ConflictInfo[];
  recurrenceDates: Date[];
  isLoading?: boolean;
}

const AppointmentRecurrenceConfirmDialog: React.FC<AppointmentRecurrenceConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  conflicts,
  recurrenceDates,
  isLoading = false,
}) => {
  const hasConflicts = conflicts.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasConflicts ? 'Conflitos Detectados' : 'Confirmar Agendamentos Recorrentes'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasConflicts && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Foram detectados conflitos com agendamentos existentes nas seguintes datas:
              </AlertDescription>
            </Alert>
          )}

          {hasConflicts && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {conflicts.map((conflict, index) => (
                <div key={index} className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                  <strong>{format(conflict.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong> às {conflict.time}
                  <br />
                  <span className="text-muted-foreground">{conflict.title}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">
              {hasConflicts ? 'Todas as datas que serão criadas:' : 'Serão criados agendamentos nas seguintes datas:'}
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recurrenceDates.map((date, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              ))}
            </div>
          </div>

          {hasConflicts && (
            <p className="text-sm text-muted-foreground">
              Ao confirmar, os agendamentos serão criados mesmo com os conflitos detectados.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Criando...' : hasConflicts ? 'Criar Mesmo Assim' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentRecurrenceConfirmDialog;
