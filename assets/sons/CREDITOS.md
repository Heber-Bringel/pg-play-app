# Créditos e Licenças dos Efeitos Sonoros (`assets/sons/`)

Todos os arquivos de áudio deste diretório foram sintetizados matematicamente (síntese aditiva PCM 16-bit mono, `22.050 Hz`) especificamente para o projeto **PG PLAY** (IFPI Campus Piripiri) e estão dedicados ao domínio público sob a licença **CC0 1.0 Universal (Public Domain Dedication)**.

- **Autor / Origem:** Equipe PG PLAY (síntese procedural própria no repositório, zero amostras de terceiros)
- **Licença:** [CC0 1.0 Universal (Public Domain)](https://creativecommons.org/publicdomain/zero/1.0/) — livre de direitos autorais para qualquer uso.

## Catálogo de Sons (`Issues #84 e #92` · `specs/027-ds-sons-de-jogo/` e `specs/028-ds-som-contagem-regressiva/`)

| Arquivo | Evento | Descrição Acústica | Duração | Tamanho | Licença |
| :--- | :--- | :--- | :---: | :---: | :---: |
| `acerto.wav` | Acerto (`playCorrect`) | Arpejo curto e alegre ("plim", `C6 → E6`, `1046.5 Hz → 1318.5 Hz`) | `0,22 s` | `~9,7 KB` | CC0 1.0 |
| `erro.wav` | Erro (`playWrong`) | Tom curto e grave descendente (`G3 → Eb3`, `196 Hz → 155.56 Hz`) | `0,25 s` | `~11,1 KB` | CC0 1.0 |
| `letra-errada.wav` | Letra errada na Forca (`playLetterWrong`) | Clique discreto de frequência descendente (`320 Hz → 180 Hz`) | `0,08 s` | `~3,6 KB` | CC0 1.0 |
| `passe.wav` | Passe / Pular (`playPass`) | *Whoosh / Swoosh* aerodinâmico de passagem rápida de ar (ruído filtrado em cascata `280 Hz → 2.880 Hz`) | `0,28 s` | `~12,4 KB` | CC0 1.0 |
| `tick-10s.wav` | Contagem ritmada nos 10s finais (`playTimerTick`) | Pulso percussivo ritmado de contagem regressiva (`C6/G6` com ataque de `2 ms`, `< 200 ms`) a cada segundo (`10s → 1s`) | `0,12 s` | `~5,3 KB` | CC0 1.0 |
| `alerta-10s.wav` | Alerta crítico (`playTimerCritical`) | Bipe curto de atenção em `A5` (`880 Hz`) | `0,14 s` | `~6,2 KB` | CC0 1.0 |
| `tempo-esgotado.wav` | Tempo esgotado em 0s (`playTimerExpired`) | Apito trinado de árbitro/juiz (*"piriiririm"*, dupla cavidade `2.760 Hz / 2.945 Hz` com modulação de ervilha a `36 Hz`) | `0,68 s` | `~30,0 KB` | CC0 1.0 |
