import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Save, Pencil, Trash2, Loader2, X } from 'lucide-react';

type Group = {
  id: string;
  name: string;
};

const defaultGroups: Group[] = [
  { id: uuidv4(), name: 'Adolescentes' },
  { id: uuidv4(), name: 'Adultos' },
  { id: uuidv4(), name: 'Casal' },
  { id: uuidv4(), name: 'Crianças' },
  { id: uuidv4(), name: 'Famílias' },
  { id: uuidv4(), name: 'Idosos' },
];

interface GroupSettingsFormProps {
    onSuccess: () => void;
}

export const GroupSettingsForm: React.FC<GroupSettingsFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['user_settings_groups', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('user_settings').select('client_groups_template').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading) {
      const savedGroups = userSettings?.client_groups_template as Group[] | undefined;
      if (savedGroups && Array.isArray(savedGroups) && savedGroups.length > 0) {
        setGroups(savedGroups);
      } else {
        setGroups(defaultGroups);
      }
    }
  }, [userSettings, isLoading]);

  const updateGroupsMutation = useMutation({
    mutationFn: async (updatedGroups: Group[]) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from('user_settings').upsert({ user_id: user.id, client_groups_template: updatedGroups }, { onConflict: 'user_id' });
      if (error) throw error;
      return updatedGroups;
    },
    onSuccess: (data) => {
      toast({ title: "Grupos salvos com sucesso!" });
      queryClient.setQueryData(['user_settings_groups', user?.id], (old: any) => ({ ...old, client_groups_template: data }));
      setEditingGroupId(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar grupos", description: error.message, variant: "destructive" });
    },
  });

  const handleAddNewGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = { id: uuidv4(), name: newGroupName.trim() };
      const updatedGroups = [...groups, newGroup];
      setGroups(updatedGroups);
      updateGroupsMutation.mutate(updatedGroups);
      setNewGroupName('');
    }
  };

  const handleStartEditing = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };
  
  const handleCancelEditing = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleSaveEditing = () => {
    if (editingGroupId && editingGroupName.trim()) {
      const updatedGroups = groups.map(g => g.id === editingGroupId ? { ...g, name: editingGroupName.trim() } : g);
      setGroups(updatedGroups);
      updateGroupsMutation.mutate(updatedGroups);
    }
  };
  
  const handleDeleteGroup = () => {
    if (groupToDelete) {
      const updatedGroups = groups.filter(g => g.id !== groupToDelete.id);
      setGroups(updatedGroups);
      updateGroupsMutation.mutate(updatedGroups);
      setGroupToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-64 pr-4">
        <div className="space-y-2">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : (
            groups.map(group => (
              <div key={group.id} className="flex items-center gap-2 p-2 border rounded-lg">
                {editingGroupId === group.id ? (
                  <>
                    <Input value={editingGroupName} onChange={(e) => setEditingGroupName(e.target.value)} className="h-8" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveEditing()}/>
                    <Button size="icon" className="h-8 w-8" onClick={handleSaveEditing}><Save className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEditing}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{group.name}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEditing(group)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setGroupToDelete(group)}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="flex items-center gap-2 pt-4 border-t">
        <Input placeholder="Nome do novo grupo" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNewGroup()} />
        <Button onClick={handleAddNewGroup} disabled={!newGroupName.trim()}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>
      
      <div className="flex justify-end pt-2">
        <Button variant="outline" onClick={onSuccess}>Fechar</Button>
      </div>

      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo "{groupToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};