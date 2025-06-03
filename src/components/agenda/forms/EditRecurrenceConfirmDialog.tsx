
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

interface EditRecurrenceConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSingle: () => void;
  onEditSeries: () => void;
  conflicts: ConflictInfo[];
  isLoading?: boolean;
}

const EditRecurrenceConfirmDialog: React.FC<EditRecurrenceConfirmDialogProps> = ({
  isOpen,
  onClose,
  onEditSingle,
  onEditSeries,
  conflicts,
  isLoading = false,
}) => {
  const hasConflicts = conflicts.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasConflicts ? 'Conflitos Detectados' : 'Editar Agendamento Recorrente'}
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

          <div className="text-sm text-muted-foreground">
            <p>Este é um agendamento recorrente. Como você gostaria de proceder?</p>
            {hasConflicts && (
              <p className="mt-2 font-medium">
                Ao editar a série inteira, os agendamentos serão criados mesmo com os conflitos detectados.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
              Cancelar
            </Button>
            <Button 
              variant="secondary" 
              onClick={onEditSingle} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Editando...' : 'Apenas Este'}
            </Button>
            <Button 
              onClick={onEditSeries} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Editando...' : hasConflicts ? 'Editar Série Mesmo Assim' : 'Toda a Série'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRecurrenceConfirmDialog;
