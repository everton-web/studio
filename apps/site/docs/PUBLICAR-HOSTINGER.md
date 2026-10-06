# Publicar o site estático na Hostinger

O evertonbrito.com é exportado como arquivos estáticos (HTML, CSS, JS) mais um `send-form.php` para o formulário. Roda em qualquer hospedagem comum com PHP 8.1 ou mais novo.

## Gerar

```bash
cd apps/site
npm ci
npm run export      # gera out/ com .htaccess e send-form.php
```

## Subir

1. Compacte o **conteúdo** de `out/` em ZIP (os arquivos de dentro, não a pasta). Inclua os arquivos ocultos (`.htaccess`).
2. No Gerenciador de Arquivos da Hostinger, abra `public_html` do domínio `evertonbrito.com`.
3. Faça backup do que já existe ali, envie o ZIP e extraia em `public_html`.
4. Confira na raiz: `index.html`, `404.html`, `.htaccess` e `send-form.php`.

## Config do formulário (segredos)

Crie `form-config.php` **uma pasta acima** do `public_html` (na Hostinger: `domains/evertonbrito.com/form-config.php`). O `send-form.php` lê `../form-config.php`. Nunca coloque esse arquivo no git nem dentro do `public_html`.

```php
<?php
return [
    'GOOGLE_SHEETS_WEBAPP_URL' => 'https://script.google.com/macros/s/SEU_ID/exec',
    'AGENCIA_LEADS_URL' => 'https://app.evertonbrito.com',
    'AGENCIA_LEADS_TOKEN' => 'TOKEN_REAL',
];
```

Permissão sugerida: 600 ou 640.

## Conferir depois de subir

- `https://evertonbrito.com/` abre; `http://` redireciona para `https://`.
- Um relatório abre, por exemplo `/relatorio/stetic-class/`, e a resposta traz `X-Robots-Tag: noindex, nofollow`.
- Uma URL inexistente devolve 404 com a página do site.
- Envie o formulário de teste: chega o e-mail em contato@evertonbrito.com, a linha na planilha e o lead no app.
