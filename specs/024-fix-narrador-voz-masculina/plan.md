# 🏗️ Plano de Implementação Técnica (`plan.md`): Correção da Seleção de Voz Masculina do Narrador

- **Branch:** `fix/024-narrador-voz-masculina`
- **Data:** 2026-11-23
- **Especificação de Origem:** `specs/024-fix-narrador-voz-masculina/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Corrigir a resolução de voz e os parâmetros de síntese do perfil `'masculina'` em `ExpoSpeechNarratorAudioService` (`src/infra/services/expoSpeechNarratorAudioService.ts`), eliminando a colisão de substring `'male'`/`'female'`, corrigindo a classificação de identificadores Android Google TTS (`pt-br-x-pte` vs `pt-br-x-ptd`/`htm`/`bmm`), normalizando locales (`pt_BR`), evitando cache de lista vazia e aplicando fallback grave (`pitch: 0.65`, `rate: 0.94`) quando o dispositivo só dispuser de voz genérica/feminina.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com o requisito `UC07` / `RF19`.
- [x] **Artigo II (MVVM 7 Pastas)**: A alteração de produção reside exclusivamente em `src/infra/services/expoSpeechNarratorAudioService.ts`, respeitando a separação das 7 camadas.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/` e `src/view/` permanecem intactas.
- [x] **Artigo II (Vocabulário)**: Mantém estritamente `INarratorAudioService` e `ExpoSpeechNarratorAudioService` sem termos proibidos.
- [x] **Artigo III (Design System)**: Não há criação ou alteração de estilos/cores fora de `src/view/theme.ts`.
- [x] **Artigo IV (Testabilidade Offline)**: Os cenários de seleção de voz são validados com testes unitários determinísticos em `tests/unit/expoSpeechNarratorAudioService.test.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
└─ infra/
   └─ services/
      └─ expoSpeechNarratorAudioService.ts    # Correção da resolução de voz masculina, normalização de locale/acentos e fallback grave

tests/
└─ unit/
   └─ expoSpeechNarratorAudioService.test.ts  # Ampliação dos casos de teste para seleção de voz masculina e fallback
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

> Não aplicável: alteração restrita à camada de infraestrutura de síntese de áudio (`src/infra/services/`).

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários do Serviço (`tests/unit/expoSpeechNarratorAudioService.test.ts`):**
  - Voz feminina antes da masculina contendo `'female'` no identificador/nome sem falso-positivo para `'masculina'`.
  - Vozes Android Google TTS com `language: 'pt_BR'` (`pt-br-x-afs-local`, `pt-br-x-pte-local`, `pt-br-x-ptd-local`, `pt-br-x-htm-local`).
  - Vozes Windows/Web (`Microsoft Francisca` e `Microsoft Antonio`).
  - Fallback em dispositivo com apenas uma voz genérica/feminina aplicando `pitch: 0.65` e `rate: 0.94`.
  - Reconsulta a `Speech.getAvailableVoicesAsync()` quando a primeira resposta vier vazia (`[]`).
