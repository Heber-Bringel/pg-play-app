import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QuizOption } from '@/view/components/quizOption';

describe('QuizOption (RNTL)', () => {
  it('renderiza alternativa padrão e dispara onPress', async () => {
    const onPress = jest.fn();
    await render(<QuizOption letter="A" text="Davi" status="default" onPress={onPress} />);

    const option = screen.getByLabelText('Alternativa A: Davi');
    expect(option.props.accessibilityRole).toBe('button');
    expect(option.props.accessibilityState).toEqual({
      disabled: false,
      selected: false,
    });

    await fireEvent.press(option);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('indica resposta correta e bloqueia interação quando desabilitada', async () => {
    const onPress = jest.fn();
    await render(
      <QuizOption
        letter="B"
        text="Moisés"
        status="correct"
        disabled
        onPress={onPress}
      />,
    );

    const option = screen.getByLabelText('Alternativa B: Moisés, resposta correta');
    expect(option.props.disabled).toBe(true);
    expect(option.props.accessibilityState).toEqual({
      disabled: true,
      selected: true,
    });
  });

  it('indica resposta incorreta no label acessível', async () => {
    await render(<QuizOption letter="C" text="Pedro" status="wrong" onPress={jest.fn()} />);

    const option = screen.getByLabelText('Alternativa C: Pedro, resposta incorreta');
    expect(option.props.accessibilityState.selected).toBe(true);
  });
});
