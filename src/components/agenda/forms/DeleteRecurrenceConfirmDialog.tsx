
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

interface DeleteRecurrenceConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteSingle: () => void;
  onDeleteSeries: () => void;
  isLoading?: boolean;
}

const DeleteRecurrenceConfirmDialog: React.FC<DeleteRecurrenceConfirmDialogProps> = ({
  isOpen,
  onClose,
  onDeleteSingle,
  onDeleteSeries,
  isLoading = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Agendamento Recorrente</AlertDialogTitle>
          <AlertDialogDescription>
            Este agendamento faz parte de uma série recorrente. O que você gostaria de fazer?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteSingle}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Excluindo...' : 'Apenas Este'}
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onDeleteSeries}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Excluindo...' : 'Toda a Série'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRecurrenceConfirmDialog;
