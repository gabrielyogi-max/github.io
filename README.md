# Portfólio de Engenheiro de Software

Este é um template de portfólio moderno e responsivo, desenvolvido com **HTML5**, **JavaScript (Vanilla)** e **Tailwind CSS**.

O design foi pensado para passar uma imagem de "Big Tech" ou engenharia de alto nível, com foco em tipografia limpa, cores sóbrias e uma grade de projetos estilo "Bento Grid".

## 🚀 Tecnologias

- **Tailwind CSS** (via CDN para facilitar a edição rápida sem build).
- **Inter Font** (Google Fonts).
- **Font Awesome** (Ícones).
- **Dark Mode** nativo (respeita preferência do sistema e possui toggle manual).

## 🛠 Como usar

1.  **Edite o HTML (`index.html`)**:
    - Altere os textos, links e imagens.
    - As seções estão comentadas para facilitar a navegação no código.
2.  **Imagens**:
    - Substitua os ícones e placeholders pelos seus screenshots reais de projetos.
3.  **Hospedagem**:
    - Este projeto está pronto para o **GitHub Pages**. Basta fazer o push para o seu repositório e ativar o Pages nas configurações.

## 🎨 Personalização com Tailwind

O Tailwind está configurado via CDN no `<head>` do `index.html`.

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
    tailwind.config = {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    brand: { ... } // Cores personalizadas
                }
            }
        }
    }
</script>
```

Você pode alterar as cores `brand` na configuração acima para mudar a cor de destaque de todo o site (atualmente um azul "Sky").

## 📱 Responsividade

O site é totalmente responsivo, adaptando o menu e o grid de projetos para dispositivos móveis automaticamente.
