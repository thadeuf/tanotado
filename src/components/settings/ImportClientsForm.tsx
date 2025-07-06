import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ImportClientsFormProps {
  onSuccess: () => void;
}

export const ImportClientsForm: React.FC<ImportClientsFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const clientNomenclature = user?.clientNomenclature || 'cliente';

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Nome': 'Exemplo Cliente',
        'Email': 'cliente@exemplo.com',
        'WhatsApp': '11999998888',
        'CPF': '123.456.789-00',
        'Data de Nascimento': '01/01/1990',
        'Endereço': 'Rua Exemplo, 123',
        'Observações': 'Cliente inicial',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `modelo_importacao_${clientNomenclature}.xlsx`);
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setIsImporting(true);
    toast({
      title: `Iniciando importação de ${clientNomenclature}s...`,
      description: 'Isso pode levar alguns instantes.',
    });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const clientsToInsert = json.map((row: any) => ({
          user_id: user.id,
          name: row['Nome'],
          email: row['Email'],
          whatsapp: row['WhatsApp'],
          cpf: row['CPF'],
          birth_date: row['Data de Nascimento'] ? new Date(row['Data de Nascimento']) : null,
          address: row['Endereço'],
          notes: row['Observações'],
        }));

        const { error } = await supabase.from('clients').insert(clientsToInsert);

        if (error) throw error;

        toast({
          title: 'Importação Concluída!',
          description: `${clientsToInsert.length} ${clientNomenclature}s foram importados com sucesso.`,
        });
        onSuccess();
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na Importação',
        description: `Não foi possível importar o arquivo. Verifique o formato e tente novamente. Detalhe: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file-upload">Arquivo XLSX</Label>
        <Input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} />
      </div>
      <Button variant="outline" onClick={downloadTemplate} className="w-full">
        Baixar Modelo da Planilha
      </Button>
      <DialogFooter>
        <Button onClick={handleImport} disabled={!file || isImporting}>
          {isImporting ? 'Importando...' : `Importar ${clientNomenclature}s`}
        </Button>
      </DialogFooter>
    </div>
  );
};
