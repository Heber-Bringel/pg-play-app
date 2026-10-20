# Campo de Texto (ExpressiveTextField)

Origem no sistema base: Material 3, Outlined Text Field. Situação: **Adaptado**. Motivo da adaptação: cantos arredondados em `16 dp` (`input.radius` = `radius.md`) para harmonizar com o *shape morphing* dos botões expressivos e fundo semântico colorido (`input.bg-error`) no estado de erro para imediata identificação visual ao cadastrar equipes na roda do PG.

## Quando usar

- Para digitar o nome de novas equipes na tela de Configuração de Equipes.
- Para filtrar minigames por nome ou categoria no Hub de Jogos (variante `Busca`).

## Quando não usar

- Para inserir palpites de uma única letra no Jogo da Forca (use [Teclado da Forca](teclado-forca.md)).
- Para escolher o tempo de duração da rodada entre opções predefinidas (use botões de seleção ou chips).

## Anatomia

1. **Rótulo superior (Label):** tipografia `font.caption` (`12 dp`, peso `700`) em `color.on-surface`, posicionado acima do container com distância `space.sm` (`8 dp`).
2. **Container de entrada:** altura mínima `input.min-height` (`56 dp`), fundo `input.bg` (`color.surface-container`), borda de `2 dp` em `input.border` (`color.outline`) e raio `input.radius` (`16 dp`).
3. **Ícone inicial (Leading Icon):** tamanho `24 dp` em `color.on-surface-muted` (ex.: `magnify` para busca ou `account-multiple-plus` para equipes).
4. **Texto de entrada / Placeholder:** tipografia `font.body` (`16 dp`), cor `input.text` (`color.on-surface`) para texto digitado e `color.on-surface-muted` para o *placeholder*.
5. **Mensagem de apoio ou erro (Helper / Error Text):** posicionada abaixo do campo com distância `space.xs` (`4 dp`), acompanhada do ícone `alert-circle` quando em estado de erro.

## Variantes

| Variante | Uso | Tokens |
| --- | --- | --- |
| `Padrão (Cadastro)` | Cadastro de nome de equipe com rótulo e texto auxiliar | `input.bg`, `input.border`, `input.radius`, `input.min-height`, `font.body` |
| `Busca` | Filtro instantâneo no Hub de Jogos com ícone de lupa | `input.bg`, `input.border`, `input.radius`, `input.min-height`, `space.md` |

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão | Fundo `input.bg`, borda `input.border`, texto `input.text` | Aguarda toque para abrir teclado do sistema | Anunciado como campo de edição com seu rótulo |
| Hover | Borda `color.on-surface` | Não se aplica em toque puro | - |
| Pressionado | Borda `input.border-focus` | Foca o campo e abre o teclado virtual | - |
| Foco | Borda `input.border-focus` (`color.action`), anel externo `color.action-container` | Cursor ativo piscando dentro do campo | Leitor anuncia texto atual e limite de caracteres |
| Erro | Fundo `input.bg-error` (`color.error-container`), borda `input.border-error` (`color.error`), ícone `alert-circle` e mensagem em `color.error` | Exibe explicação clara de como corrigir (ex.: *"Digite pelo menos 2 letras"*) | Região de erro anunciada via `accessibilityLiveRegion="polite"` |
| Desabilitado | Fundo `color.disabled-bg`, texto `color.disabled-text` | Não abre o teclado (`editable={false}`) | Anunciado como indisponível para edição |

## Acessibilidade

- **Alvo de toque mínimo:** altura mínima de `56 dp` (`input.min-height`), superando o mínimo de `48 dp` do Material 3.
- **Contraste:** texto `color.on-surface` sobre `color.surface-container` com razão superior a **14,4:1**; mensagem de erro em `color.error` com razão mínima de **6,47:1** no claro e **8,90:1** no escuro (ver [06-acessibilidade.md](../06-acessibilidade.md)).
- **Leitor de tela:** o rótulo nunca desaparece ao digitar (permanece fixo acima do campo) e mensagens de erro combinam ícone + texto com `accessibilityLiveRegion="polite"`.

## Faça e evite

- **Faça:** mantenha o rótulo visível fora do campo o tempo todo e informe o motivo exato quando houver erro de validação.
- **Evite:** usar o *placeholder* como único rótulo do campo ou comunicar erro apenas mudando a cor da borda para vermelho sem mensagem explicativa.

## Código

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

interface ExpressiveTextFieldProps {
  label: string;
  value: string;
  placeholder: string;
  helperText?: string;
  errorText?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  maxLength?: number;
  disabled?: boolean;
  onChangeText: (text: string) => void;
}

export function ExpressiveTextField({
  label,
  value,
  placeholder,
  helperText,
  errorText,
  icon = 'account-multiple-plus',
  maxLength = 20,
  disabled = false,
  onChangeText,
}: ExpressiveTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(errorText);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text allowFontScaling style={styles.label}>
          {label}
        </Text>
        <Text allowFontScaling style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      </View>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: disabled
              ? tokens.semantic.color.disabledBg
              : hasError
              ? tokens.component.input.bgError
              : tokens.component.input.bg,
            borderColor: hasError
              ? tokens.component.input.borderError
              : focused
              ? tokens.component.input.borderFocus
              : tokens.component.input.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={tokens.semantic.icon.md}
          color={
            hasError
              ? tokens.semantic.color.error
              : tokens.semantic.color.onSurfaceMuted
          }
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.semantic.color.onSurfaceMuted}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={helperText}
          accessibilityState={{ disabled }}
          style={[
            styles.input,
            {
              color: disabled
                ? tokens.semantic.color.disabledText
                : hasError
                ? tokens.semantic.color.onErrorContainer
                : tokens.component.input.text,
            },
          ]}
        />
      </View>

      {(hasError || helperText) && (
        <View style={styles.helperRow} accessibilityLiveRegion="polite">
          {hasError && (
            <MaterialCommunityIcons
              name="alert-circle"
              size={tokens.semantic.icon.sm}
              color={tokens.semantic.color.error}
            />
          )}
          <Text
            allowFontScaling
            style={[
              styles.helperText,
              {
                color: hasError
                  ? tokens.semantic.color.error
                  : tokens.semantic.color.onSurfaceMuted,
              },
            ]}
          >
            {hasError ? errorText : helperText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.semantic.space.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    fontWeight: tokens.semantic.font.caption.weight,
    color: tokens.semantic.color.onSurface,
  },
  counter: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    color: tokens.semantic.color.onSurfaceMuted,
  },
  inputWrapper: {
    minHeight: tokens.component.input.minHeight,
    borderRadius: tokens.component.input.radius,
    borderWidth: tokens.semantic.border.thin,
    paddingHorizontal: tokens.semantic.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.sm,
  },
  input: {
    flex: 1,
    fontFamily: tokens.semantic.font.body.family,
    fontSize: tokens.semantic.font.body.size,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.semantic.space.xs,
  },
  helperText: {
    fontFamily: tokens.semantic.font.caption.family,
    fontSize: tokens.semantic.font.caption.size,
    fontWeight: tokens.semantic.font.caption.weight,
  },
});
```
