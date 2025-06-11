// src/pages/MessageSettings.tsx

import React from 'react';
import { MessageSettingsForm } from '@/components/settings/MessageSettingsForm';

const MessageSettings: React.FC = () => {
  return (
    // Adicionando padding diretamente na página
    <div className="animate-fade-in p-6">
      <MessageSettingsForm />
    </div>
  );
};

export default MessageSettings;