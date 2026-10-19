# Another Runner

Um endless runner de plataforma em pixel art. Você corre sozinho, pula entre
plataformas, coleta moedas e tenta sobreviver o máximo possível.

## Como jogar

| Ação | Teclado | Toque |
| --- | --- | --- |
| Pular / pulo duplo | `Espaço`, `↑` ou `W` | tocar na tela |
| Pausar / voltar | `Esc` ou `P` | botão de pausa |
| Reiniciar | `Espaço` ou `R` na tela de fim | botão |
| Som | `M` | botão de alto-falante |

O jogo tem *coyote time* e *jump buffer*: dá para pular um tiquinho depois de sair
da plataforma e o comando de pulo fica guardado por alguns milissegundos. As
plataformas só colidem por cima, então não existe aquele "tranco" lateral.

## Rodar localmente

```sh
cd another-runner
python3 -m http.server 8080
# abra http://localhost:8080
```

Também funciona direto pelo GitHub Pages, sem build.

## Estrutura

```text
another-runner/
├── index.html
├── css/style.css
└── js/
    ├── art.js    # texturas pixel art geradas em canvas
    ├── audio.js  # música e efeitos sintetizados com WebAudio
    └── app.js    # menu, gameplay, colisão, HUD e overlays
```

## Responsividade

- Phaser em modo `Scale.FIT` com centralização, então a cena de 960 × 540 se
  adapta a qualquer tela sem distorção.
- `viewport-fit=cover`, safe areas e bloqueio de rolagem/toque acidental.
- Aviso de "gire o celular" em retrato, com opção de continuar mesmo assim.
- Controles por teclado, mouse e toque.

## Créditos e licenças

- Código, arte pixel e sons: originais, criados para este projeto.
- A arte é gerada em runtime e pode ser considerada **CC0**.
- Fonte [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) —
  SIL Open Font License.
- [Phaser 3](https://phaser.io) — MIT.

Nenhuma foto ou imagem de pessoa é usada no jogo.
