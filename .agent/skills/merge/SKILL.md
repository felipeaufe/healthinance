---
name: merge
description: Executa o merge de Pull Requests apontando para a branch develop utilizando GitHub CLI, remove a branch remota e limpa a branch local.
---

# Procedimento de Merge e Limpeza de Branches (GitHub CLI)

Esta skill define o procedimento padronizado para mergear alterações no repositório **Healthinance** utilizando o **GitHub CLI (`gh`)**.

> [!CAUTION]
> **Execução Estrita Sob Demanda**: Este procedimento SÓ deve ser executado mediante comando explícito do usuário (ex: *"faça o merge"*, *"pode mergear a PR"*, *"finalize e mergeie"*). Nunca faça merge automático sem confirmação prévia do usuário.

---

## Pré-requisitos
- As tarefas do OpenSpec devem estar concluídas e o change validado/arquivado.
- A branch de trabalho atual deve estar com commits limpos e enviados para o remoto (`git push -u origin <branch-name>`).
- Uma Pull Request aberta para a branch **`develop`** deve existir.

---

## Fluxo Sequencial de Execução

Todos os comandos devem ser executados através do shell **fish** (`fish -l -c "<comando>"`).

### 1. Identificar a Pull Request Ativa
Verifique a PR associada à branch atual com o GitHub CLI:
```fish
fish -l -c "gh pr status"
```
Ou listar a PR aberta para a branch:
```fish
fish -l -c "gh pr list --head (git branch --show-current) --base develop --json number,title,state"
```

### 2. Executar o Merge via GitHub CLI
Faça o merge da Pull Request diretamente na branch `develop`, ativando a flag para deletar a branch remota automaticamente:
```fish
fish -l -c "gh pr merge --merge --delete-branch"
```
*(Se o projeto adotar squash commits, utilize `--squash --delete-branch`)*.

### 3. Retornar e Atualizar a Branch `develop` Local
Retorne para a branch base local `develop` e baixe os commits atualizados:
```fish
fish -l -c "git checkout develop && git pull origin develop"
```

### 4. Limpar Branches Locais Obsoletas
Após o merge e a exclusão remota, exclua a branch de trabalho local que já foi mergeada:
```fish
fish -l -c "git branch -d <nome-da-branch-local>"
```

Para garantir que referências remotas deletadas sejam limpas do git local:
```fish
fish -l -c "git fetch --prune"
```

### 5. Confirmar Estado Final
Confirme que o repositório local está na branch `develop`, limpo e atualizado:
```fish
fish -l -c "git status && git branch"
```
Reporte ao usuário o status do merge, link da PR fechada e confirmação da limpeza.
