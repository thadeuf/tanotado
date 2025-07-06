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

## 8. Arquitetura de Backend e Serviços Externos

Além da aplicação frontend, o projeto depende de uma arquitetura de backend e de serviços externos para funcionalidades críticas.

### 8.1. Supabase Edge Functions

As **Edge Functions** do Supabase são usadas para executar lógica de backend segura e sensível, que não deve ser exposta no lado do cliente.

-   **Propósito:** Lidar com lógica de negócio, integrações seguras com APIs de terceiros e tarefas que exigem chaves de API secretas.
-   **Funções Identificadas:**
    -   `reset-password` / `send-recovery-code`: Gerencia a lógica de recuperação de senha de forma segura.
    -   `cancel-subscription`: Comunica-se com a API do Stripe para cancelar a assinatura de um usuário.
    -   `google-auth-callback` / `google-revoke-token`: Lidam com o fluxo de autenticação OAuth com o Google para a integração com o Google Calendar.
    -   `create-google-event`: Sincroniza os agendamentos da plataforma com a agenda do Google do usuário.
-   **Segurança:** A invocação dessas funções a partir do frontend é feita através do cliente Supabase (`supabase.functions.invoke()`), garantindo que as chaves de API e a lógica interna permaneçam no servidor.

### 8.2. Automações com n8n

O **n8n** é utilizado como uma ferramenta de automação de fluxos de trabalho (workflow automation) para lidar com o envio de mensagens e notificações.

-   **Propósito:** Orquestrar o envio de mensagens automáticas (lembretes de sessão, cobranças) via WhatsApp.
-   **Funcionamento:**
    1.  A aplicação frontend ou uma função agendada no Supabase adiciona uma tarefa na tabela `message_queue`.
    2.  Um webhook no n8n é acionado ou consulta periodicamente esta fila.
    3.  O n8n processa a mensagem, formata o conteúdo e utiliza a API do WhatsApp para realizar o envio.
    -   *Referência:* A página `MessageReports.tsx` interage com a tabela `message_queue`, mostrando o status das mensagens gerenciadas por este fluxo.

### 8.3. Worker Python para Integração com Receita Saúde

Para a funcionalidade específica de emissão de recibos via **Receita Saúde**, foi desenvolvido um serviço separado (worker) em Python.

-   **Propósito:** Automatizar o processo de login no portal do e-CAC e a emissão de recibos no sistema Carnê Leão, uma tarefa que requer automação de navegador (browser automation).
-   **Funcionamento:**
    1.  Na aplicação, um usuário com a integração ativa solicita a emissão de um recibo (visto em `Financial.tsx`).
    2.  Esta solicitação cria um registro na tabela `recibos_ecac` com o status "Pendente".
    3.  O worker Python monitora esta tabela. Ao encontrar um registro pendente, ele utiliza bibliotecas como Selenium ou Playwright para:
        -   Acessar o e-CAC.
        -   Realizar o login em nome do profissional (utilizando a procuração digital fornecida).
        -   Preencher e emitir o recibo com os dados do pagamento.
        -   Baixar o PDF do recibo e atualizar o registro na tabela com o status "Emitido" e a URL do arquivo.
-   **Motivação:** A escolha de um worker em Python se deve à robustez das bibliotecas de automação web disponíveis nesse ecossistema, que são ideais para interagir com portais governamentais complexos como o da Receita Federal.

### 9. Funcionalidades e Padrões da Área de Administração

O projeto conta com uma área de administração (`/admin`) robusta, projetada para dar aos administradores uma visão completa e controle sobre a plataforma. O acesso é restrito através do `<AdminRoute>` em `App.tsx`, que verifica se o `user.role` é 'admin'.

#### 9.1. Dashboard do Administrador (`AdminDashboard.tsx`)

É a página central da área de administração, fornecendo métricas chave e uma visão geral de todos os usuários cadastrados.

-   **Métricas Globais:** Apresenta estatísticas vitais da plataforma, como "Total de Usuários", "Total de Assinantes", "Novos Assinantes (mês)" e "Cancelamentos (mês)". Estes dados são calculados através da RPC `get_all_profiles_with_counts` do Supabase.
-   **Listagem e Filtragem de Usuários:** Exibe uma tabela com todos os usuários da plataforma.
    -   **Filtros:** Permite filtrar usuários por status (`Assinantes`, `Em Teste`, `Trial Expirado`, `Cancelados`, `Desativados`), facilitando a segmentação e análise.
    -   **Busca:** Um campo de busca permite encontrar usuários rapidamente por nome, email ou WhatsApp.
-   **Ações de Gerenciamento:** Para cada usuário, um menu de ações (`DropdownMenu`) permite que o administrador:
    -   **Visualize Detalhes:** Abre um modal (`ClientInfoDialog`) com informações completas do perfil do usuário.
    -   **Ative/Desative Usuários:** Controla o acesso do usuário à plataforma, utilizando as mutações `activateUserMutation` e `deactivateUserMutation`.
    -   **Cancele Assinaturas:** Invoca a Supabase Edge Function `cancel-subscription` para cancelar a assinatura de um usuário no Stripe.

#### 9.2. Gerenciamento de Instâncias do WhatsApp (`WhatsappInstances.tsx`)

Esta seção é dedicada ao gerenciamento das conexões com a API do WhatsApp, que são essenciais para o envio de lembretes e notificações.

-   **Criação e Conexão:** Administradores podem criar novas instâncias, conectar via QR Code e desconectar instâncias ativas. O processo interage diretamente com a API da Evolution.
-   **Sincronização de Status:** Um `useEffect` executa uma rotina de sincronização periódica que verifica o status real de cada instância na API da Evolution e atualiza o banco de dados do Supabase, garantindo que a informação de status (`connected`/`disconnected`) esteja sempre correta.
-   **Gerenciamento de Usuários:** A tela exibe a contagem de usuários associados a cada instância e permite a migração de usuários entre instâncias através do `MigrateUsersDialog`, que utiliza a RPC `migrate_random_users_between_instances`.
-   **Webhook de Respostas:** Há uma opção para ativer um webhook global para receber as respostas dos clientes aos lembretes, configurável através do `AdminSettingsForm`.

#### 9.3. Relatório de Envios de Mensagens (`MessageReports.tsx`)

Fornece um log detalhado de todas as mensagens que passam pela fila de envio do sistema (`message_queue`).

-   **Visualização e Filtragem:** Permite visualizar o histórico de mensagens e filtrar por status (`Pendente`, `Enviado`, `Erro`), além de uma busca por qualquer campo da mensagem.
-   **Análise de Erros:** Em caso de falha no envio, o motivo do erro (`error_message`) é exibido, permitindo um diagnóstico rápido do problema.
-   **Ações na Fila:** Administradores podem:
    -   **Reenfileirar (`requeue`):** Marcar uma mensagem que falhou para ser enviada novamente.
    -   **Excluir:** Remover uma mensagem permanentemente da fila.

#### 9.4. Configurações Gerais do Administrador (`AdminSettingsForm.tsx`)

Um modal centraliza as configurações globais que afetam o comportamento de todo o sistema.

-   **Webhook de Respostas:** Permite configurar a URL do webhook que receberá as respostas dos clientes, como visto na seção de instâncias do WhatsApp.
-   **Persistência:** As configurações são salvas na tabela `admin_settings`, permitindo que outros serviços e funções as consultem quando necessário.

### 10. Fluxo de Autenticação e Gerenciamento de Perfil

A arquitetura de autenticação e gerenciamento de perfis da aplicação é projetada para ser robusta, resiliente e segura, garantindo que os dados do usuário estejam sempre sincronizados com o estado de autenticação. O `AuthContext` é o orquestrador central deste fluxo.

-   **Separação entre Autenticação e Dados de Perfil:** O projeto faz uma distinção clara entre o serviço de autenticação do Supabase (`supabase.auth`) e a tabela de dados do perfil do usuário (`profiles`). O primeiro lida apenas com a identidade (email, senha, sessões), enquanto o segundo armazena todas as informações de negócio e preferências do usuário (nome, CPF, configurações, etc.).

-   **Gatilho de Criação de Perfil (Database Trigger):** A criação de um novo perfil de usuário é automatizada e segura, sendo delegada a um gatilho (trigger) no banco de dados do Supabase.
    -   **Fluxo:** Quando um novo usuário se cadastra com `supabase.auth.signUp`, o Supabase cria um novo registro na sua tabela interna `auth.users`. Um gatilho PostgreSQL configurado no banco de dados "escuta" essa inserção e, em resposta, cria automaticamente uma linha correspondente na tabela `public.profiles`, copiando o `id`, `email`, `name` e outros metadados fornecidos no cadastro.
    -   **Vantagem:** Esta abordagem desacopla a lógica de criação de perfil da aplicação frontend, garantindo que todo usuário autenticado terá um perfil associado, mesmo que a chamada do frontend falhe após o cadastro.

-   **Carregamento e Sincronização de Perfil (`loadUserProfile`):** O `AuthContext` implementa uma função resiliente para carregar os dados do perfil, lidando com possíveis estados de inconsistência.
    -   **Verificação Proativa:** A função `loadUserProfile` é chamada sempre que o estado de autenticação muda. Ela não assume que um perfil já existe.
    -   **Tratamento do Erro `PGRST116`:** Ela primeiro tenta buscar o perfil com `.select().eq('id', user.id).single()`. Se o Supabase retornar o erro com código `PGRST116`, significa que "nenhuma linha foi encontrada". O `AuthContext` interpreta isso como um sinal de que o gatilho pode ainda não ter sido executado ou falhou.
    -   **Resiliência e Tentativa de Criação:** Ao encontrar o erro `PGRST116`, em vez de falhar, o `AuthContext` chama a função `createNewProfile`. Esta função aguarda um curto período (1 segundo) e tenta recarregar o perfil, dando tempo para o gatilho do banco de dados concluir sua execução. Isso torna a aplicação robusta a pequenos atrasos de replicação no backend.
    -   **Mapeamento de Dados:** Uma vez que o perfil é carregado com sucesso, a função mapeia os dados brutos do banco para a interface `User` definida em `src/types/auth.ts`, garantindo a consistência dos tipos em toda a aplicação.

-   **Sincronização de Estado em Tempo Real (`onAuthStateChange`):** O `AuthContext` utiliza o listener `supabase.auth.onAuthStateChange` para se inscrever a todas as mudanças de estado de autenticação (LOGIN, LOGOUT, TOKEN_REFRESHED).
    -   **Fonte Única da Verdade:** Este listener é a única fonte que dispara a atualização do estado global do usuário. Sempre que um evento ocorre, a função `loadUserProfile` é chamada com a nova sessão, garantindo que o objeto `user` no contexto React esteja sempre sincronizado com o backend. Isso é crucial para que as rotas protegidas e os dados exibidos na UI reflitam o estado de autenticação real.

    ### 11. Padrão de Feedback ao Usuário (UX)

A aplicação adota uma estratégia de comunicação com o usuário que é clara, consistente e não intrusiva. O objetivo é manter o usuário informado sobre o estado do sistema em todos os momentos, seja durante operações em segundo plano, ações bem-sucedidas ou falhas. Este padrão de feedback é fundamental para construir confiança e garantir uma boa experiência de uso (UX).

#### 11.1. Notificações Não-Bloqueantes (Toasts)

O sistema utiliza "toasts" (pequenas notificações que aparecem e desaparecem automaticamente) como o principal meio de comunicação para eventos assíncronos. O projeto emprega duas bibliotecas para isso, `Toaster` e `Sonner`, com a implementação encapsulada no hook `useToast`.

-   **Confirmação de Sucesso:** Após uma operação de escrita (criar, atualizar, deletar) ser concluída com sucesso no `onSuccess` de uma `useMutation`, um toast de sucesso é invocado para confirmar a ação.
    -   *Exemplo:* Após salvar as configurações da agenda, a notificação `toast({ title: "Configurações da agenda salvas!" })` é exibida. Similarmente, ao deletar um agendamento, o usuário vê "Evento(s) excluído(s)!".

-   **Relato de Erros:** Quando uma operação falha (no `onError` de uma `useMutation`), um toast com a variante `destructive` é exibido. Crucialmente, a mensagem de erro retornada pela API (`error.message`) é incluída na descrição, fornecendo um contexto claro sobre o que deu errado.
    -   *Exemplo:* Se a criação de uma instância do WhatsApp falha, o sistema mostra `toast({ title: 'Erro ao criar instância', description: error.message, variant: 'destructive' })`.

-   **Informações de Progresso:** Toasts também são usados para informar o início de processos que podem levar algum tempo, como `toast({ title: "Iniciando importação de pacientes..." })`.

#### 11.2. Indicadores de Carregamento (Loaders e Skeletons)

Para gerenciar a percepção de tempo do usuário durante o carregamento de dados ou a execução de ações, o projeto utiliza dois tipos de indicadores visuais:

-   **Carregamento de Página/Componente (`<Skeleton />`):** Quando uma página ou um componente principal está buscando seus dados iniciais, o componente `<Skeleton>` é usado para renderizar uma "casca" da interface.
    -   **Prevenção de Layout Shift:** Essa técnica melhora a experiência percebida, pois o usuário vê uma estrutura familiar que será preenchida com dados, em vez de uma tela em branco ou um layout que "pula" quando os dados chegam.
    -   *Exemplos:* Visto em `AdminDashboard.tsx` para os cards de estatísticas e a tabela de usuários, e em `Clients.tsx` para a lista de clientes.

-   **Carregamento de Ação do Usuário (`<Loader2 />`):** Quando o usuário aciona uma ação que dispara uma mutação (como clicar em "Salvar" ou "Excluir"), o feedback é imediato e contextual.
    -   **Feedback no Próprio Elemento:** O ícone `<Loader2 className="... animate-spin" />` é inserido diretamente no botão que iniciou a ação.
    -   **Desabilitar Ação:** O botão é desabilitado (`disabled={mutation.isPending}`) durante a execução para prevenir múltiplos envios e deixar claro que uma ação está em andamento.
    -   *Exemplos:* Presente em quase todos os botões de submissão de formulários, como em `MyAccountForm.tsx` e nos diálogos de confirmação de exclusão em `Agenda.tsx`.

#### 11.3. Diálogos de Confirmação (`<AlertDialog />`)

Para ações destrutivas ou irreversíveis, como exclusão de dados ou cancelamento de assinaturas, a aplicação utiliza um diálogo de confirmação (`AlertDialog`) para garantir que a ação seja intencional.

-   **Prevenção de Ações Acidentais:** Antes de executar uma mutação de exclusão, um modal é exibido pedindo confirmação explícita do usuário.
-   **Contexto Claro:** A descrição dentro do diálogo (`AlertDialogDescription`) explica claramente o que acontecerá se a ação for confirmada, como em: `Tem certeza que deseja excluir a instância ...? Esta ação não pode ser desfeita.`.
-   **Exemplos de Uso:** Implementado para deletar instâncias do WhatsApp, agendamentos, modelos de documentos, e para ações de segurança como sair de todos os dispositivos.

### 12. Comunicação com o Banco de Dados (RPC vs. Query Direta)

A aplicação utiliza duas estratégias distintas e complementares para interagir com o banco de dados Supabase, cada uma escolhida com base na complexidade e nos requisitos de segurança da operação.

#### 12.1. Queries Diretas (CRUD Padrão)

Para operações de Leitura, Criação, Atualização e Deleção (CRUD) que são diretas e envolvem uma única tabela, o projeto utiliza a API padrão de consulta do Supabase. Esta abordagem é preferida pela sua clareza, simplicidade e legibilidade.

-   **Leitura (`select`):** Usada para buscar dados. Permite a junção de dados de tabelas relacionadas de forma declarativa.
    -   *Exemplo:* Em `usePayments.ts`, a query busca pagamentos e, ao mesmo tempo, os dados relacionados da tabela de clientes: `supabase.from('payments').select('*, clients (name, avatar_url, cpf)')`.
-   **Criação (`insert`):** Usada para adicionar novos registros a uma tabela.
    -   *Exemplo:* Em `ClientForm.tsx`, um novo cliente é criado com `supabase.from('clients').insert(clientData)`.
-   **Atualização (`update`):** Usada para modificar registros existentes, geralmente combinada com `.eq()` para especificar qual registro atualizar.
    -   *Exemplo:* Em `MyAccountForm.tsx`, o perfil do usuário é atualizado com `supabase.from('profiles').update(profileData).eq('id', user.id)`.
-   **Deleção (`delete`):** Usada para remover registros.
    -   *Exemplo:* Em `SessionNotesList.tsx`, uma anotação é deletada com `supabase.from('session_notes').delete().eq('id', noteId)`.

#### 12.2. Chamadas de Procedimento Remoto (RPC)

Para operações mais complexas, que envolvem múltiplas tabelas, cálculos agregados ou lógica de negócio que deve ser executada atomicamente no servidor, o projeto utiliza **Chamadas de Procedimento Remoto (RPC)**. Isso invoca funções PostgreSQL customizadas definidas diretamente no banco de dados do Supabase.

-   **Lógica de Negócio Complexa:** RPCs são ideais para encapsular regras de negócio.
    -   *Exemplo:* A função `find_or_create_pending_client` na página de agendamento público verifica se um cliente com um determinado CPF já existe. Se existir, retorna seus dados; se não, cria um novo cliente com status "pendente". Tudo isso ocorre em uma única chamada de função, garantindo consistência.
-   **Queries Agregadas e com Joins Complexos:** Para evitar múltiplas chamadas de rede e realizar cálculos no lado do banco (que é mais performático), as RPCs são a escolha certa.
    -   *Exemplo:* A função `get_all_profiles_with_counts` no `AdminDashboard.tsx` retorna uma lista de todos os usuários e, para cada um, calcula a contagem de clientes e agendamentos associados, uma operação que seria ineficiente de se fazer no lado do cliente.
    -   *Exemplo:* `get_client_details_with_stats` em `EditClient.tsx` busca todos os dados de um cliente e, ao mesmo tempo, calcula estatísticas como total de sessões e valor devido.
-   **Lógica de Busca Especializada:** Funções RPC são perfeitas para encapsular lógicas de busca complexas.
    -   *Exemplo:* `get_available_slots` em `PatientBooking.tsx` executa uma lógica sofisticada para determinar os horários disponíveis de um profissional em uma data específica. Ela considera os horários de trabalho, a duração das sessões e os agendamentos já existentes para retornar apenas os "slots" livres.

    ### 13. Arquitetura de Páginas Públicas

O sistema possui uma arquitetura de "front-office" bem definida, composta por páginas que podem ser acessadas publicamente para que clientes novos ou existentes possam interagir com o profissional sem a necessidade de login. Essas páginas, como `/agendar/:slug` e `/cadastrar/:slug`, seguem padrões específicos para garantir segurança e uma experiência de usuário fluida.

-   **Ponto de Entrada via Slug:** O acesso a essas páginas é feito através de um `slug` amigável na URL (ex: `/agendar/nome-do-profissional`). Este `slug` serve como um identificador público para o profissional, evitando a exposição de IDs internos (UUIDs). A aplicação busca as informações públicas do profissional utilizando a RPC `get_public_profile_by_slug`, que retorna apenas os dados necessários para a página, como nome, especialidade e horários de trabalho.

-   **Fluxo de Identificação Obrigatória:** Antes de qualquer ação (agendamento ou cadastro), o cliente deve se identificar fornecendo seu CPF e data de nascimento.
    -   Essa etapa é gerenciada pelo `identificationSchema` do Zod e pelo formulário `identificationForm`.
    -   A validação é centralizada na função RPC `find_or_create_pending_client`. Esta função segura no backend verifica se um cliente com aquele CPF já existe e se a data de nascimento corresponde.
    -   A função também lida com a criação de um novo cliente com status `pending` caso ele não exista, retornando um estado consistente para o frontend.

-   **Renderização Condicional de Etapas:** A UI dessas páginas é dividida em "passos" (`currentStep`) gerenciados por um estado local (`useState`). O fluxo do usuário é guiado condicionalmente com base no resultado do passo anterior:
    1.  **`identification`:** Exibe o formulário de CPF e data de nascimento.
    2.  **`new_client_form`:** É exibido se a RPC `find_or_create_pending_client` indica que o cliente é novo ou seu cadastro está incompleto. O usuário preenche dados básicos como nome e WhatsApp.
    3.  **`schedule_selection`:** É exibido para clientes já ativos e identificados, permitindo que eles escolham uma data e horário. A disponibilidade é carregada dinamicamente pela RPC `get_available_slots`.
    4.  **`confirmation_pending` ou `scheduling_success`:** Telas finais que informam o resultado da ação, seja o envio do cadastro para aprovação ou a confirmação do agendamento.

-   **Segregação de Formulários:** Cada etapa do fluxo utiliza sua própria instância do `useForm` e seu próprio schema Zod (`identificationSchema`, `newClientSchema`, `scheduleSchema`). Isso mantém a lógica de cada passo isolada e fácil de gerenciar.

-   **Reutilização de Componentes:** A página de cadastro (`PatientRegistration.tsx`) reutiliza de forma inteligente o componente `ClientForm` (usado na área interna do sistema), mas passando o `contexto="publico"`. Isso permite que o mesmo formulário se adapte, ocultando campos sensíveis ou irrelevantes para o cadastro público, como "Valor da Sessão".

### 14. Fluxo de Onboarding de Novos Usuários

Para garantir que os novos usuários configurem suas contas de maneira eficaz antes de começarem a usar a plataforma, o projeto implementa um fluxo de onboarding dedicado. Este processo é uma etapa crucial e obrigatória, acionada para qualquer usuário que tenha se cadastrado mas ainda não completou a configuração inicial (identificado pelo campo `hasCompletedOnboarding: false` em seu perfil).

#### 14.1. Arquitetura e Componente Central

O coração deste processo é o componente `OnboardingFlow.tsx`, que funciona como uma máquina de estados finitos, guiando o usuário por uma série de telas de configuração.

-   **Componente Orquestrador:** `OnboardingFlow.tsx` encapsula toda a lógica, o estado e a interface do processo. Ele é renderizado condicionalmente pelo `ProtectedRoute` em `App.tsx` sempre que um usuário não onboardado tenta acessar a plataforma.
-   **Gerenciamento de Estado Local:** O componente utiliza o hook `useState` para controlar o passo atual (`currentStep`) e para armazenar as seleções do usuário em cada etapa (ex: `specialty`, `nomenclature`, `recordLabel`, etc.).
-   **Interface do Usuário com `shadcn/ui`:** A interface é construída com componentes `shadcn/ui`, garantindo consistência visual com o resto da aplicação.
    -   **`<Card>`:** Envolve todo o fluxo, apresentando-o de forma limpa e focada.
    -   **`<Progress />`:** Uma barra de progresso no topo do card fornece feedback visual imediato sobre o avanço do usuário no processo (`Etapa X de 5`), melhorando a experiência e gerenciando expectativas.

#### 14.2. Detalhamento das Etapas de Configuração

O fluxo é dividido em cinco etapas sequenciais, cada uma projetada para coletar uma informação específica e personalizar a plataforma para o profissional.

1.  **Especialidade Profissional:**
    -   **Objetivo:** Entender a área de atuação do profissional.
    -   **UI:** Utiliza um componente `<Popover>` que contém um `<Command>` com busca (`CommandInput`), permitindo que o usuário encontre rapidamente sua especialidade em uma longa lista (`specialtyOptions`). Se a especialidade não estiver listada, a seleção de "Outro" revela um campo de input (`<Input />`) para digitação manual (`customSpecialty`).

2.  **Nomenclatura do Cliente:**
    -   **Objetivo:** Personalizar a linguagem da plataforma (ex: "Paciente" vs. "Cliente").
    -   **UI:** Apresenta uma série de botões que funcionam como um grupo de rádio. O botão selecionado recebe um destaque visual (`border-tanotado-pink`) e um ícone `<CheckCircle />`. A lógica para um valor customizado ("Outro") também está presente.

3.  **Rótulo do Agendamento:**
    -   **Objetivo:** Definir como os eventos na agenda serão chamados (ex: "Agendamento", "Sessão").
    -   **UI:** Segue o mesmo padrão de botões da etapa anterior, garantindo uma experiência de seleção consistente para o usuário.

4.  **Rótulo do Prontuário:**
    -   **Objetivo:** Adaptar o nome do registro clínico à área do profissional.
    -   **UI:** Reutiliza o padrão de botões de seleção. Além disso, esta etapa possui uma lógica condicional: se a especialidade selecionada na primeira etapa for da área da saúde (`isHealthProfessional`), um componente `<Alert>` é exibido, informando sobre a obrigatoriedade legal de manter um prontuário.

5.  **Finalização:**
    -   **Objetivo:** Confirmar que a configuração está completa.
    -   **UI:** Uma tela de sucesso com um ícone `<Sparkles />` informa ao usuário que tudo está pronto. O botão "Finalizar e Ir para a Agenda" aciona a função que salva os dados.

#### 14.3. Integração e Conclusão do Fluxo

-   **Submissão dos Dados:** Ao clicar no botão de finalização, a função `handleFinish` é chamada. Ela consolida todas as seleções feitas pelo usuário (incluindo os valores customizados, se houver) em um único objeto.
-   **Atualização do Perfil:** Este objeto é então passado para a função `updateUser` do `AuthContext`. Esta função, por sua vez, faz uma chamada para o Supabase, atualizando o perfil do usuário na tabela `profiles` com as novas preferências e, crucialmente, definindo `has_completed_onboarding` como `true`.
-   **Redirecionamento:** Uma vez que o perfil é atualizado, o estado do `user` no `AuthContext` é atualizado. O `ProtectedRoute` em `App.tsx` detectará a mudança no valor de `hasCompletedOnboarding` em sua próxima renderização e, em vez de mostrar o `OnboardingFlow`, permitirá o acesso ao dashboard principal da aplicação.