import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ExpressiveTextField } from '@/view/components/expressiveTextField';

describe('ExpressiveTextField (RNTL)', () => {
  it('renderiza label, contador e dispara onChangeText', async () => {
    const onChangeText = jest.fn();
    await render(
      <ExpressiveTextField
        label="Nome da Equipe"
        value="Alfa"
        placeholder="Ex: Os Vencedores"
        helperText="Mínimo 2 caracteres"
        maxLength={20}
        onChangeText={onChangeText}
      />,
    );

    expect(screen.getByText('Nome da Equipe')).toBeTruthy();
    expect(screen.getByText('4/20')).toBeTruthy();

    const input = screen.getByLabelText('Nome da Equipe');
    expect(input.props.accessibilityState).toEqual({ disabled: false });

    await fireEvent.changeText(input, 'Beta');
    expect(onChangeText).toHaveBeenCalledWith('Beta');
  });

  it('exibe errorText e marca disabled quando desabilitado', async () => {
    await render(
      <ExpressiveTextField
        label="Nome da Equipe"
        value=""
        placeholder="Ex: Os Vencedores"
        errorText="Nome obrigatório"
        disabled
        onChangeText={jest.fn()}
      />,
    );

    expect(screen.getByText('Nome obrigatório')).toBeTruthy();
    const input = screen.getByLabelText('Nome da Equipe');
    expect(input.props.accessibilityState).toEqual({ disabled: true });
    expect(input.props.editable).toBe(false);
  });
});
