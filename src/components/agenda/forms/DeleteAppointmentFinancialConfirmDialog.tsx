
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteAppointmentFinancialConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteWithoutFinancial: () => void;
  onDeleteWithFinancial: () => void;
  isRecurring?: boolean;
  isLoading?: boolean;
}

const DeleteAppointmentFinancialConfirmDialog: React.FC<DeleteAppointmentFinancialConfirmDialogProps> = ({
  isOpen,
  onClose,
  onDeleteWithoutFinancial,
  onDeleteWithFinancial,
  isRecurring = false,
  isLoading = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Registros Financeiros</AlertDialogTitle>
          <AlertDialogDescription>
            {isRecurring 
              ? "Deseja excluir também os registros financeiros relacionados a esta série de agendamentos?"
              : "Deseja excluir também os registros financeiros relacionados a este agendamento?"
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteWithoutFinancial}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Excluindo...' : 'Não, Manter Registros'}
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onDeleteWithFinancial}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Excluindo...' : 'Sim, Excluir Tudo'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAppointmentFinancialConfirmDialog;
