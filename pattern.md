# Padrão do Projeto - Tanotado (Versão Completa)

Este documento descreve os padrões, tecnologias e convenções utilizadas no desenvolvimento do projeto Tanotado. O objetivo é servir como um guia para manter a consistência e a qualidade do código.

## 1. Tecnologias Principais

-   **Linguagem:** TypeScript
-   **Framework Principal:** React (utilizando Vite.js como bundler)
-   **Backend & Banco de Dados:** Supabase (cliente acessado via `@supabase/supabase-js`)
-   **Estilização:** Tailwind CSS com `shadcn/ui` para componentes, class-variance-authority (CVA) para variantes.
-   **Roteamento:** React Router DOM.
-   **Gerenciamento de Estado (Server):** TanStack Query (React Query) para caching e sincronização de dados do servidor.
-   **Gerenciamento de Estado (Client):** Context API do React para estado global (ex: `AuthContext`) e `useState` para estado local.
-   **Formulários:** React Hook Form para gerenciamento de estado de formulários.
-   **Validação de Schemas:** Zod, integrado com React Hook Form através do `@hookform/resolvers/zod`.
-   **Componentes de UI:**
    -   `react-big-calendar` para a visualização de agenda.
    -   `recharts` para gráficos.
    -   `react-datepicker`, `react-phone-number-input`, `input-otp` para inputs específicos.
    -   `embla-carousel-react` para carrosséis.
    -   `@radix-ui/*` como base para muitos componentes `shadcn/ui`.
-   **Ícones:** Lucide React.
-   **Manipulação de Datas:** `date-fns`.
-   **Editor de Texto:** Tiptap para o editor de Rich Text.
-   **Integração com IA:** OpenAI API para funcionalidades de assistente.

## 2. Estrutura de Diretórios Detalhada

A estrutura de diretórios é organizada por funcionalidade (`feature-based`), o que promove alta coesão e baixo acoplamento.

```
/src
|-- /components/              # Componentes React reutilizáveis
|   |-- /admin/               # Componentes específicos do painel de Admin
|   |   |-- AdminSettingsForm.tsx
|   |   |-- ClientInfoDialog.tsx
|   |   `-- MigrateUsersDialog.tsx
|   |-- /agenda/              # Componentes da funcionalidade de Agenda
|   |   |-- AppointmentForm.tsx
|   |   |-- ClientAppointmentsList.tsx
|   |   |-- DateSelector.tsx
|   |   `-- TimeSlots.tsx
|   |-- /auth/                # Componentes de autenticação
|   |   |-- ForgotPasswordForm.tsx
|   |   `-- ResetPasswordForm.tsx
|   |-- /chat/                # Componentes do ChatPopup de IA
|   |   `-- ChatPopup.tsx
|   |-- /documents/           # Componentes para geração e listagem de documentos
|   |   |-- CreateWithAIDialog.tsx
|   |   |-- EditSavedDocumentDialog.tsx
|   |   |-- GenerateDocumentDialog.tsx
|   |   `-- SavedDocumentsList.tsx
|   |-- /financial/           # Componentes da área financeira
|   |   |-- ClientFinancialRecords.tsx
|   |   `-- TransactionForm.tsx
|   |-- /forms/               # Formulários complexos e reutilizáveis
|   |   `-- ClientForm.tsx
|   |-- /notes/               # Componentes para notas de sessão e insights de IA
|   |   |-- InsightsAIDialog.tsx
|   |   |-- RecordingNoticeModal.tsx
|   |   `-- SessionNotesDialog.tsx
|   |-- /prontuarios/         # Componentes relacionados a prontuários
|   |   |-- ProntuarioContainer.tsx
|   |   `-- RecordForm.tsx
|   |-- /settings/            # Componentes da página de Configurações
|   |   |-- AgendaSettingsForm.tsx
|   |   |-- GroupSettingsForm.tsx
|   |   |-- ImportClientsForm.tsx
|   |   |-- MessageSettingsForm.tsx
|   |   |-- MyAccountForm.tsx
|   |   `-- ResetPasswordForm.tsx
|   |-- /stripe/              # Componentes relacionados à integração com Stripe
|   |   `-- AddressModal.tsx
|   |-- /ui/                  # Componentes base da UI (gerenciados por shadcn/ui)
|   |   |-- accordion.tsx
|   |   |-- alert-dialog.tsx
|   |   |-- alert.tsx
|   |   |-- aspect-ratio.tsx
|   |   |-- avatar.tsx
|   |   |-- badge.tsx
|   |   |-- breadcrumb.tsx
|   |   |-- button.tsx
|   |   |-- calendar.tsx
|   |   |-- card.tsx
|   |   |-- carousel.tsx
|   |   |-- chart.tsx
|   |   |-- checkbox.tsx
|   |   |-- collapsible.tsx
|   |   |-- command.tsx
|   |   |-- context-menu.tsx
|   |   |-- CpfInput.tsx
|   |   |-- DateInput.tsx
|   |   |-- dialog.tsx
|   |   |-- drawer.tsx
|   |   |-- dropdown-menu.tsx
|   |   |-- form.tsx
|   |   |-- hover-card.tsx
|   |   |-- input-otp.tsx
|   |   |-- input.tsx
|   |   |-- label.tsx
|   |   |-- masked-input.tsx
|   |   |-- menubar.tsx
|   |   |-- navigation-menu.tsx
|   |   |-- pagination.tsx
|   |   |-- phone-input.tsx
|   |   |-- popover.tsx
|   |   |-- progress.tsx
|   |   |-- radio-group.tsx
|   |   |-- resizable.tsx
|   |   |-- RichTextEditor.tsx
|   |   |-- scroll-area.tsx
|   |   |-- select.tsx
|   |   |-- separator.tsx
|   |   |-- sheet.tsx
|   |   |-- sidebar.tsx
|   |   |-- skeleton.tsx
|   |   |-- slider.tsx
|   |   |-- sonner.tsx
|   |   |-- switch.tsx
|   |   |-- table.tsx
|   |   |-- tabs.tsx
|   |   |-- textarea.tsx
|   |   |-- toast.tsx
|   |   |-- toaster.tsx
|   |   |-- toggle-group.tsx
|   |   |-- toggle.tsx
|   |   `-- tooltip.tsx
|   |-- AppSidebar.tsx
|   |-- AuthLayout.tsx
|   |-- ClientProfileSidebar.tsx
|   |-- LoginForm.tsx
|   |-- OnboardingFlow.tsx
|   `-- RegisterForm.tsx
|
|-- /contexts/                # Contextos React para estado global
|   `-- AuthContext.tsx
|
|-- /hooks/                   # Hooks customizados para lógica reutilizável
|   |-- use-mobile.tsx
|   |-- use-toast.ts
|   |-- useAppointments.ts
|   |-- useClients.ts
|   |-- usePayments.ts
|   `-- useUserSettings.ts
|
|-- /integrations/            # Módulos de integração com serviços externos
|   `-- /supabase/
|       |-- client.ts
|       `-- types.ts
|
|-- /lib/                     # Funções e utilitários genéricos
|   |-- calendarLocalizer.ts
|   |-- openai.ts
|   |-- templateUtils.ts
|   |-- TiptapNodeToText.ts
|   `-- utils.ts
|
|-- /pages/                   # Componentes que representam rotas/páginas
|   |-- /admin/
|   |   |-- MessageReports.tsx
|   |   `-- WhatsappInstances.tsx
|   |-- AdminDashboard.tsx
|   |-- Agenda.css
|   |-- Agenda.tsx
|   |-- AiPosts.tsx
|   |-- Clients.tsx
|   |-- Dashboard.tsx
|   |-- DocumentTemplates.tsx
|   |-- EditClient.tsx
|   |-- EditDocumentTemplate.tsx
|   |-- Financial.tsx
|   |-- Help.tsx
|   |-- Index.tsx
|   |-- IntegracaoReceitaSaude.tsx
|   |-- Login.tsx
|   |-- ManageSubscription.tsx
|   |-- MessageSettings.tsx
|   |-- NotFound.tsx
|   |-- PatientBooking.tsx
|   |-- PatientRegistration.tsx
|   |-- Prontuarios.tsx
|   |-- Register.tsx
|   |-- Settings.tsx
|   `-- Subscription.tsx
|
|-- /types/                   # Definições de tipo globais
|   `-- auth.ts
|
|-- App.css                   # Estilos CSS legados ou específicos
|-- App.tsx                   # Componente Raiz da aplicação e configuração de rotas
|-- index.css                 # Configuração base do Tailwind e variáveis de tema
|-- main.tsx                  # Ponto de entrada da aplicação
`-- vite-env.d.ts             # Tipos de ambiente do Vite
```

### 3. Padrões de Componentes e UI

A interface do usuário (UI) do projeto é construída sobre um sistema de design coeso e moderno, priorizando a reutilização, a consistência e a manutenibilidade. A abordagem segue os princípios do Atomic Design, onde componentes menores e independentes (átomos, moléculas) são compostos para criar estruturas maiores e mais complexas (organismos, templates, páginas).

#### 3.1. Base de Componentes com `shadcn/ui`

O projeto utiliza `shadcn/ui` como a principal biblioteca de componentes. A principal característica dessa abordagem é que os componentes não são importados de uma biblioteca externa, mas sim "copiados" para o projeto, residindo em `src/components/ui/`.

-   **Controle Total:** Ter o código dos componentes diretamente no projeto (ex: `button.tsx`, `card.tsx`, `dialog.tsx`) oferece total controle sobre sua estilização, comportamento e API.
-   **Primitivos Radix UI:** A maioria dos componentes de `shadcn/ui` é construída sobre os primitivos headless da **Radix UI** (ex: `@radix-ui/react-dialog` em `dialog.tsx`, `@radix-ui/react-avatar` em `avatar.tsx`). Isso garante que os componentes sejam acessíveis e sigam as melhores práticas de WAI-ARIA.
-   **Consistência:** Garante que todos os elementos interativos como `Dialog`, `DropdownMenu`, `Popover` e `Tooltip` tenham uma aparência e comportamento consistentes em toda a aplicação.

#### 3.2. Estilização com Tailwind CSS e CVA

-   **Utility-First:** A estilização é feita primariamente com as classes utilitárias do **Tailwind CSS**. Isso permite criar interfaces complexas rapidamente sem sair do HTML/JSX. As configurações do Tailwind estão em `tailwind.config.js` e os estilos base em `src/index.css`.
-   **`cn` Utility:** A função utilitária `cn` (de `src/lib/utils.ts`) é usada extensivamente para mesclar classes do Tailwind de forma condicional e limpa, combinando `clsx` e `tailwind-merge`.
-   **Variantes de Componentes (CVA):** A biblioteca `class-variance-authority` é usada para criar variantes estilísticas de um mesmo componente. Um exemplo claro é o `buttonVariants` em `src/components/ui/button.tsx`, que define estilos para diferentes `variant` (default, destructive, outline, etc.) e `size` (default, sm, lg, icon).

#### 3.3. Composição e Estrutura

-   **Componentes Funcionais:** Todos os componentes do projeto são funcionais e utilizam Hooks do React.
-   **Nomenclatura:** Os arquivos e os componentes seguem a convenção `PascalCase` (ex: `AppointmentForm.tsx`, `ClientProfileSidebar.tsx`).
-   **Organismos e Templates:** Componentes complexos, que representam seções de uma página ou a própria página, são criados pela composição de componentes de UI menores.
    -   **Exemplo:** A página `Dashboard.tsx` combina `Card`, `Tabs`, `Button` e `Badge` para criar a tela principal. O componente `AppointmentForm.tsx` utiliza `Dialog`, `Input`, `Switch`, `Select` e outros para criar um formulário de agendamento completo e interativo.
-   **Layouts Reutilizáveis:** O projeto define layouts consistentes, como o `AuthLayout.tsx`, que provê uma estrutura padrão para as páginas de login e registro, e o `AppSidebar.tsx` que é o principal componente de navegação para usuários autenticados.

#### 3.4. Ícones e Responsividade

-   **Ícones:** A biblioteca **Lucide React** é a fonte padrão para ícones. Eles são importados e usados como componentes React, o que permite fácil customização de tamanho e cor via classes do Tailwind (ex: `<Search className="h-4 w-4" />` em `Clients.tsx`).
-   **Responsividade:** O design é mobile-first e se adapta a telas maiores usando os breakpoints do Tailwind (`sm:`, `md:`, `lg:`). A grade de layout (CSS Grid e Flexbox) é usada para reorganizar os componentes, como visto na página `Financial.tsx` onde o layout muda de uma para três colunas. O hook customizado `useIsMobile` é usado para lógicas de renderização condicional que dependem estritamente do tamanho da tela.


### 4. Gerenciamento de Estado

A aplicação utiliza uma estratégia de gerenciamento de estado dividida em três níveis, cada um com uma ferramenta específica para garantir performance, consistência de dados e manutenibilidade.

#### 4.1. Estado do Servidor (Server State) com TanStack Query

Para todos os dados que persistem em um servidor ou banco de dados (neste caso, o Supabase), o **TanStack Query (React Query)** é a ferramenta padrão. Ele simplifica a busca, o cache, a sincronização e a atualização de dados remotos.

-   **Hooks Customizados:** A lógica de busca de dados é encapsulada em hooks customizados, como `useClients`, `useAppointments`, `usePayments` e `useUserSettings`. Isso centraliza a lógica de acesso a dados, tornando os componentes mais limpos.

-   **Chaves de Query (`queryKey`):** As chaves de query são usadas para identificar e gerenciar os dados em cache. O padrão é usar um array contendo o nome do recurso e um identificador único, como o ID do usuário, para garantir que os dados sejam específicos do usuário logado.
    -   *Exemplo em `useClients.ts`:* `queryKey: ['clients', user?.id]`

-   **Mutações (`useMutation`):** Operações de escrita (criar, atualizar, deletar) são gerenciadas com `useMutation`. Isso permite um tratamento claro dos estados de carregamento (`isPending`) e dos efeitos colaterais (`onSuccess`, `onError`).
    -   *Exemplo em `Clients.tsx`:* O `updateApprovalStatusMutation` define a função `mutationFn` para atualizar um cliente e usa `onSuccess` para exibir um `toast` de sucesso e invalidar a query de clientes, forçando a atualização da lista.

-   **Invalidação de Cache:** Após uma mutação bem-sucedida, o `queryClient.invalidateQueries` é chamado para invalidar o cache dos dados relacionados e forçar uma nova busca, garantindo que a UI sempre exiba os dados mais recentes.
    -   *Exemplo em `AppointmentForm.tsx`:* Após criar ou atualizar um agendamento, as queries `['appointments']` e `['payments']` são invalidadas.

#### 4.2. Estado Global (Global State) com Context API

Para dados que precisam ser acessíveis em toda a aplicação, como informações de autenticação do usuário, o projeto utiliza a **Context API** do React.

-   **`AuthContext.tsx`:** Este arquivo define o `AuthProvider` e o hook `useAuth`. Ele é responsável por:
    -   Manter o estado do `user` logado e o status de `isLoading`.
    -   Prover funções de autenticação como `login`, `logout`, `register`, `updateUser` e `resetPassword`.
    -   Interagir com o Supabase para gerenciar sessões e perfis de usuário.
-   **Consumo:** O hook `useAuth()` é chamado em qualquer componente que precise de acesso aos dados do usuário ou às funções de autenticação, como em `App.tsx` para proteger rotas e em `MyAccountForm.tsx` para exibir e atualizar dados do perfil.

#### 4.3. Estado Local (Local State) com `useState`

Para estados que são específicos de um único componente e não precisam ser compartilhados, o hook `useState` é a solução padrão. Isso mantém os componentes encapsulados e evita re-renderizações desnecessárias em outras partes da aplicação.

-   **Controle de UI:** É amplamente utilizado para controlar elementos da interface, como a visibilidade de modais e diálogos (ex: `const [isFormOpen, setIsFormOpen] = useState(false);` em `Clients.tsx`).
-   **Entrada de Formulário Simples:** Para formulários simples ou campos de controle que não justificam o uso do React Hook Form, como o `searchTerm` em `Financial.tsx` ou os filtros em `AdminDashboard.tsx`.
-   **Gerenciamento de Estado Temporário:** Para armazenar seleções temporárias do usuário, como o `selectedAppointmentForNotes` em `Dashboard.tsx`, que controla qual agendamento será aberto no modal de anotações.

### 5. Estilização e Tema

A abordagem de estilização do projeto é moderna e robusta, focada na manutenibilidade, consistência e agilidade no desenvolvimento. Ela se baseia em três pilares principais: Tailwind CSS, `shadcn/ui` e uma estratégia de tematização com variáveis CSS.

#### 5.1. Tailwind CSS como Base (Utility-First)

A estilização primária é feita através do **Tailwind CSS**. Em vez de escrever CSS tradicional, os desenvolvedores aplicam classes utilitárias diretamente no JSX, o que acelera o desenvolvimento e mantém os estilos encapsulados no próprio componente.

-   **Configuração:** As configurações do Tailwind (cores, fontes, breakpoints) são definidas no arquivo `tailwind.config.js`.
-   **Estilos Globais:** Estilos base e a configuração das variáveis de tema são definidos em `src/index.css`.

#### 5.2. Componentes com `shadcn/ui` e Primitivos Radix

O projeto utiliza `shadcn/ui` para a sua biblioteca de componentes de base. Esta não é uma biblioteca de componentes tradicional, mas sim uma coleção de componentes reutilizáveis que são adicionados diretamente ao código-fonte do projeto, no diretório `src/components/ui`.

-   **Controle e Propriedade:** Como o código dos componentes (`Button.tsx`, `Card.tsx`, `Dialog.tsx`, etc.) reside no projeto, há total controle sobre sua API, estilo e comportamento.
-   **Acessibilidade:** Os componentes são construídos sobre os primitivos **Radix UI**, que são "headless" (sem estilo) e focados em acessibilidade (WAI-ARIA) e comportamento, como visto nos `imports` de arquivos como `dialog.tsx` e `avatar.tsx`.

#### 5.3. Variantes de Componentes com CVA

Para criar diferentes variantes de um mesmo componente (ex: botões com cores, tamanhos ou estilos diferentes), o projeto utiliza a biblioteca `class-variance-authority` (CVA).

-   **`buttonVariants`:** Um exemplo perfeito é o `buttonVariants` em `src/components/ui/button.tsx`. Ele define um conjunto de estilos base e, em seguida, variantes para `variant` (`default`, `destructive`, `outline`) e `size` (`sm`, `lg`). Isso permite gerar as classes CSS corretas de forma programática.

#### 5.4. `cn()` - A Função Utilitária para Classes Condicionais

Para aplicar classes do Tailwind de forma condicional, a função `cn` de `src/lib/utils.ts` é usada em toda a aplicação. Ela combina `clsx` (para lógica condicional de classes) e `tailwind-merge` (para resolver conflitos de classes do Tailwind de forma inteligente).

-   **Uso Prático:** Em `RichTextEditor.tsx`, a classe do editor é dinamicamente alterada: `className={cn("prose...", !editable ? 'bg-muted/30' : '')}`. Isso adiciona a classe `bg-muted/30` apenas se o editor não for editável.

#### 5.5. Estratégia de Tematização (Dark/Light Mode)

O suporte a temas claro e escuro é implementado de forma eficiente através de variáveis CSS.

-   **Definição de Variáveis:** No arquivo `src/index.css`, as cores do tema são definidas como variáveis CSS dentro do seletor `:root` para o tema claro.
-   **Sobrescrita para Tema Escuro:** O seletor `.dark` é usado para sobrescrever essas mesmas variáveis com as cores do tema escuro.
-   **Uso no Tailwind:** As cores no arquivo de configuração do Tailwind (`tailwind.config.js`) são mapeadas para usar essas variáveis CSS (ex: `background: 'hsl(var(--background))'`). Isso permite que o Tailwind aplique as cores corretas dinamicamente quando a classe `.dark` é adicionada ao elemento `<html>` ou `<body>`.

### 6. Formulários e Validação

A gestão de formulários e a validação de dados são aspectos críticos da aplicação. O projeto adota uma abordagem robusta e padronizada utilizando **React Hook Form** para o controle de estado e **Zod** para a validação de schemas.

#### 6.1. React Hook Form para Gerenciamento de Formulários

O **React Hook Form** é a biblioteca central para a criação de formulários. Sua principal vantagem é a otimização de performance, pois ele isola as re-renderizações dos componentes de input, evitando que o componente do formulário inteiro seja re-renderizado a cada alteração de valor.

-   **`useForm` Hook:** Este hook é o ponto de entrada para a criação de um formulário. Ele é usado para inicializar o formulário, registrar os campos e acessar funções como `handleSubmit`, `control`, `watch` e `setValue`.
-   **Componente `<Controller>`:** Para integrar componentes de UI customizados ou de bibliotecas (como os de `shadcn/ui`), o componente `<Controller>` é utilizado. Ele conecta o estado do React Hook Form ao componente, como visto em `TransactionForm.tsx` com o componente `<Calendar>` e `<RadioGroup>`.
-   **`zodResolver`:** A integração com o Zod é feita passando o `zodResolver` para a opção `resolver` do `useForm`. Isso garante que qualquer alteração no formulário seja validada contra o schema Zod definido.

#### 6.2. Zod para Validação de Schemas

O **Zod** é utilizado para definir a "forma" dos dados de um formulário de maneira declarativa e com segurança de tipos.

-   **Definição de Schema:** Para cada formulário complexo, um schema Zod é criado. Por exemplo, em `MyAccountForm.tsx`, o `profileSchema` define os tipos de cada campo (`z.string()`, `z.boolean()`) e suas regras de validação (`min`, `optional`, `refine`).
-   **Validação em Múltiplos Níveis:** O Zod permite validações complexas, como:
    -   **Validações de campo único:** `z.string().min(3, { message: "O nome é obrigatório." })`.
    -   **Validações encadeadas:** `z.string().url().optional().or(z.literal(''))` para aceitar uma URL válida ou uma string vazia.
    -   **Validações a nível de objeto (`superRefine`):** Usado para comparar múltiplos campos, como garantir que uma senha e sua confirmação sejam iguais, ou que um campo se torne obrigatório com base no valor de outro.
-   **Inferência de Tipos:** Uma das maiores vantagens é a capacidade de inferir o tipo do TypeScript diretamente do schema Zod (`type FormData = z.infer<typeof formSchema>`). Isso elimina a necessidade de manter tipos e validações sincronizados manualmente.

#### 6.3. Estrutura dos Componentes de Formulário (`shadcn/ui`)

O projeto utiliza a estrutura de formulário fornecida pelo `shadcn/ui`, que é construída sobre os primitivos do React Hook Form e promove acessibilidade e organização.

-   **`<Form {...form}>`:** O componente `Form` atua como um provedor de contexto, passando a instância do formulário (`form`) para os componentes filhos.
-   **`<FormField>`:** Este componente conecta um campo específico do formulário ao seu estado. Ele usa o `control` do `useForm` e o `name` do campo.
-   **`<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`:** Esses componentes estruturam cada campo do formulário:
    -   `FormLabel` renderiza a etiqueta (`<label>`) associada ao campo.
    -   `FormControl` envolve o componente de input (`<Input>`, `<Select>`, etc.).
    -   `FormMessage` exibe automaticamente as mensagens de erro de validação para aquele campo específico.
-   **Componentes de Input Customizados:** O projeto define componentes de input customizados, como `CpfInput.tsx` e `DateInput.tsx`, que são integrados aos formulários através do `<Controller>` ou `FormField`.

### 7. Convenções de Código e Boas Práticas

Para garantir a escalabilidade, manutenibilidade e a qualidade geral do software, o projeto adota um conjunto de convenções e boas práticas estritas.

#### 7.1. Tipagem e Segurança de Tipos (TypeScript)

-   **Fonte da Verdade:** A principal fonte para a tipagem de dados do banco de dados é o arquivo `src/integrations/supabase/types.ts`. Este arquivo é gerado automaticamente pelo Supabase CLI, garantindo que os tipos no frontend correspondam exatamente ao schema do banco de dados.
-   **Tipagem Explícita:** Todas as props de componentes, estados, e retornos de funções são explicitamente tipados. Interfaces e tipos customizados são definidos quando necessário, como a interface `Client` em `useClients.ts` ou `User` em `types/auth.ts`.
-   **Inferência de Tipos com Zod:** Em vez de declarar manualmente os tipos para os dados de formulário, o projeto utiliza a função `z.infer<typeof schema>` do Zod. Isso garante que o tipo do TypeScript seja sempre derivado diretamente do schema de validação, eliminando a duplicação e possíveis inconsistências.

#### 7.2. Padrões de Código Assíncrono

-   **Centralização com React Query:** Toda a lógica de comunicação com a API do Supabase (operações de Leitura, Criação, Atualização e Deleção) é gerenciada pelo TanStack Query (React Query).
    -   **Queries (`useQuery`):** Para operações de leitura (leitura de clientes, agendamentos, etc.). Elas são encapsuladas em hooks customizados (ex: `useClients`, `useAppointments`) para promover a reutilização e a separação de responsabilidades.
    -   **Mutations (`useMutation`):** Para operações de escrita (criar/atualizar/deletar clientes, agendamentos, etc.). O hook `useMutation` é usado para lidar com o ciclo de vida da operação, incluindo os estados `isPending`, `onSuccess` e `onError`.
-   **Feedback ao Usuário:** A experiência do usuário durante operações assíncronas é uma prioridade.
    -   **Estado de Carregamento:** O estado `isLoading` ou `isPending` das queries e mutações é usado para desabilitar botões e exibir indicadores de carregamento, como o componente `<Loader2 className="... animate-spin" />` ou os componentes `<Skeleton />`.
    -   **Notificações (Toast):** O hook customizado `useToast` é chamado dentro dos callbacks `onSuccess` e `onError` das mutações para fornecer feedback claro e imediato ao usuário sobre o resultado da operação.

#### 7.3. Organização e Modularidade

-   **Organização por Funcionalidade (Feature-based):** A estrutura de diretórios em `src/` agrupa os arquivos por funcionalidade (ex: `components/agenda`, `pages/financial`), o que torna o projeto mais fácil de navegar e manter.
-   **Componentes Reutilizáveis:** Componentes de UI genéricos estão em `src/components/ui`, enquanto componentes mais complexos e de domínio específico estão em diretórios como `src/components/financial` ou `src/components/settings`.
-   **Abstração da Lógica:** A lógica de negócio e de acesso a dados é abstraída dos componentes de UI. Por exemplo, a lógica de buscar clientes está no hook `useClients`, e o componente `Clients.tsx` apenas consome esse hook, focando na apresentação dos dados.
-   **Funções Utilitárias:** Funções puras e reutilizáveis, que não são componentes nem hooks, são colocadas no diretório `src/lib` (ex: `templateUtils.ts`, `TiptapNodeToText.ts`).

#### 7.4. Roteamento e Navegação

-   **React Router DOM:** É a biblioteca utilizada para gerenciar as rotas da aplicação.
-   **Estrutura de Rotas:** O arquivo `App.tsx` centraliza a definição de todas as rotas da aplicação, utilizando uma estrutura clara que distingue entre:
    -   **Rotas Públicas (`<PublicRoute>`):** Acessíveis apenas para usuários não autenticados (ex: `/login`, `/register`).
    -   **Rotas Protegidas (`<ProtectedRoute>`):** Acessíveis apenas para usuários autenticados. Este componente verifica o estado de autenticação e o onboarding do usuário antes de renderizar a rota filha.
    -   **Rotas de Admin (`<AdminRoute>`):** Uma camada extra de proteção dentro das rotas protegidas, que verifica se o `user.role` é 'admin'.
-   **Navegação:** A navegação declarativa é feita com o componente `<Link>`, enquanto a navegação programática (após uma ação, como um login bem-sucedido) é feita com o hook `useNavigate`.

#### 7.5. Segurança e Variáveis de Ambiente

-   **Variáveis de Ambiente:** Chaves de API e outras informações sensíveis (Supabase URL/Key, OpenAI Key) são armazenadas em um arquivo `.env` na raiz do projeto. O acesso a essas variáveis no código é feito de forma segura através de `import.meta.env.VITE_*`, conforme o padrão do Vite, garantindo que essas chaves não sejam expostas diretamente no código-fonte.
-   **Políticas de Acesso (Supabase RLS):** Embora não visível diretamente no frontend, a estrutura do código (ex: `user_id` em todas as tabelas) sugere fortemente o uso de Row Level Security (RLS) no Supabase, onde os usuários só podem acessar ou modificar os dados que lhes pertencem.