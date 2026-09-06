## 1. UI Components & Layouts

- [x] 1.1 Criar layout compartilhado em `apps/web/src/app/(auth)/layout.tsx`
- [x] 1.2 Criar página de login em `apps/web/src/app/(auth)/login/page.tsx`
- [x] 1.3 Criar página de cadastro em `apps/web/src/app/(auth)/register/page.tsx`
- [x] 1.4 Criar página de recuperação de senha em `apps/web/src/app/(auth)/forgot-password/page.tsx`

## 2. Route Protection & Dashboard

- [x] 2.1 Atualizar `apps/web/src/lib/supabase/middleware.ts` com regras de redirecionamento de rotas públicas e privadas
- [x] 2.2 Criar página protegida `apps/web/src/app/dashboard/page.tsx` com barra de perfil e botão de Logout

## 3. API Integration Helper

- [x] 3.1 Criar utilitário `apps/web/src/lib/api.ts` com injeção automática do JWT do Supabase no header de autorização
- [x] 3.2 Integrar o helper autenticado ao componente `PluggyConnectButton.tsx`

## 4. Verification & Validation

- [x] 4.1 Executar compilação com `pnpm turbo build`
- [x] 4.2 Validar conformidade do change com `openspec validate auth-ui`
