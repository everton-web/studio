# Integração do formulário com o Google Sheets

O formulário de contato (`src/components/Contact.tsx`) envia os dados para
`/send-form.php` (o site é estático na Hostinger), que repassa para um
**Google Apps Script Web App**. O Apps Script grava uma linha na planilha.

```
Navegador → /send-form.php (PHP) → Apps Script Web App → Google Sheets
```

Esse caminho evita problemas de CORS e mantém a URL do Web App fora do bundle
do cliente.

Planilha de destino:
`https://docs.google.com/spreadsheets/d/1UqaWnSnz-cEGj_jCEyYmTPe9zICey4VEAFuuKJnYGzU`

---

## 1. Criar o Apps Script

1. Abra a planilha.
2. Menu **Extensões → Apps Script**.
3. Apague o conteúdo padrão e cole o código abaixo.
4. Salve (Ctrl+S). O nome do projeto é indiferente.

```js
const SHEET_ID = "1UqaWnSnz-cEGj_jCEyYmTPe9zICey4VEAFuuKJnYGzU";
const SHEET_NAME = "Leads";
const HEADERS = [
  "Data/Hora",
  "Nome",
  "Contato",
  "Projeto",
  "Idioma",
  "Origem",
  "User Agent",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    let data = {};
    if (e.postData && e.postData.type === "application/json") {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter || {};
    }

    const contact = String(data.contact || "");
    const row = sheet.getLastRow() + 1;

    sheet.getRange(row, 1, 1, HEADERS.length).setValues([
      [
        new Date(),
        data.name || "",
        contact,
        data.project || "",
        data.lang || "",
        data.source || "evertonbrito.com",
        data.userAgent || "",
      ],
    ]);

    // Célula "Contato" clicável: telefone → WhatsApp; e-mail → mailto.
    const cell = sheet.getRange(row, 3);
    const digits = contact.replace(/\D/g, "");
    const isPhone = /^[\d\s()+-]+$/.test(contact.trim()) && digits.length >= 10;

    if (isPhone) {
      // Número local (DDD + número) recebe o DDI 55; se já vier com 55, mantém.
      const intl = digits.length <= 11 ? "55" + digits : digits;
      cell.setRichTextValue(
        SpreadsheetApp.newRichTextValue()
          .setText(contact)
          .setLinkUrl("https://wa.me/" + intl)
          .build()
      );
    } else if (contact.includes("@")) {
      cell.setRichTextValue(
        SpreadsheetApp.newRichTextValue()
          .setText(contact)
          .setLinkUrl("mailto:" + contact)
          .build()
      );
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

## 2. Publicar como Web App

1. Clique em **Implantar → Nova implantação**.
2. Tipo: **App da Web**.
3. **Executar como:** *Eu*.
4. **Quem tem acesso:** *Qualquer pessoa*.
5. **Implantar** e autorize o acesso (a conta precisa ter acesso à planilha).
6. Copie a **URL do App da Web** — termina em `/exec`.

## 3. Configurar a URL no servidor

Grave a URL em `form-config.php`, fora do `public_html` (passo a passo em
`docs/PUBLICAR-HOSTINGER.md`). Nunca versione esse arquivo.

## 4. Testar

```bash
curl -X POST https://evertonbrito.com/send-form.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","contact":"(11) 99999-9999","project":"Landing","lang":"pt"}'
```

Resposta esperada: `{"success":true,...}`, o e-mail em contato@evertonbrito.com
e uma nova linha na aba **Leads**, com o número de WhatsApp clicável.

---

## Observações

- A aba `Leads` é criada automaticamente na primeira gravação.
- A coluna **Contato** fica clicável: telefone abre o WhatsApp (`wa.me`);
  e-mail abre o cliente de e-mail (`mailto:`).
- Ao alterar o código do Apps Script, é preciso **implantar uma nova versão**
  (Implantar → Gerenciar implantações → editar → Nova versão).
- Sem `GOOGLE_SHEETS_WEBAPP_URL`, o PHP ainda envia o e-mail; o formulário abre
  o WhatsApp de qualquer forma.
