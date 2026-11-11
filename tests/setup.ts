// React 19: habilita o ambiente de act() para o react-test-renderer nos testes.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
