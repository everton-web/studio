<?php
// Formulário de contato do evertonbrito.com (hospedagem estática da Hostinger).
// Faz o que a antiga rota /api/contact fazia: e-mail, planilha Google e lead no SaaS.
// Segredos ficam em ../form-config.php (fora do public_html) ou em variáveis de ambiente.
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

const MAX_BODY = 16384;
const RATE_LIMIT = 5;          // envios por IP
const RATE_WINDOW = 600;       // em segundos
const MAIL_TO = 'contato@evertonbrito.com';
const MAIL_FROM = 'noreply@evertonbrito.com';

function respond(int $status, bool $success, string $message): never
{
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Método não permitido.');
}

// Só aceita envio do próprio site (navegadores mandam Origin no fetch POST).
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '') {
    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $host = strtolower(preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
    if ($originHost === '' || $originHost !== $host) {
        respond(403, false, 'Origem não permitida.');
    }
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
if ($raw === false || strlen($raw) > MAX_BODY) {
    respond(413, false, 'Conteúdo muito grande.');
}

$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if (str_contains($contentType, 'application/json')) {
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        respond(400, false, 'JSON inválido.');
    }
} else {
    $input = $_POST;
}

// Remove caracteres de controle (inclusive CR/LF) e limita o tamanho.
function field(array $input, string $key, int $max, bool $multiline = false): string
{
    $value = $input[$key] ?? '';
    if (!is_string($value)) {
        return '';
    }
    $pattern = $multiline ? '/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/u' : '/[\x00-\x1F\x7F]/u';
    $value = (string) preg_replace($pattern, ' ', $value);
    return mb_substr(trim($value), 0, $max);
}

// Honeypot: campo invisível que só robô preenche. Finge sucesso e descarta.
if (field($input, 'website', 200) !== '') {
    respond(200, true, 'Contato enviado com sucesso.');
}

$name = field($input, 'name', 120);
$contact = field($input, 'contact', 160);
$email = field($input, 'email', 160);
$whatsapp = field($input, 'whatsapp', 40);
$project = field($input, 'project', 200);
$message = field($input, 'message', 2000, true);
$lang = field($input, 'lang', 2) === 'en' ? 'en' : 'pt';

if ($contact === '') {
    $contact = $whatsapp !== '' ? $whatsapp : $email;
}
if ($email === '' && filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $email = $contact;
}
if ($whatsapp === '' && !filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $whatsapp = $contact;
}

if ($name === '' || $contact === '') {
    respond(400, false, 'Preencha nome e contato.');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, false, 'E-mail inválido.');
}

// Limite simples por IP, em arquivo temporário (sem guardar o IP em claro).
function rateLimited(): bool
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'desconhecido');
    $file = sys_get_temp_dir() . '/ebform-' . hash('sha256', $ip . __FILE__) . '.json';
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $saved = json_decode((string) @file_get_contents($file), true);
        if (is_array($saved)) {
            $hits = array_values(array_filter($saved, fn ($t) => is_int($t) && $t > $now - RATE_WINDOW));
        }
    }
    if (count($hits) >= RATE_LIMIT) {
        return true;
    }
    $hits[] = $now;
    @file_put_contents($file, json_encode($hits), LOCK_EX);
    return false;
}

if (rateLimited()) {
    respond(429, false, 'Muitos envios. Tente de novo em alguns minutos.');
}

$config = [];
$configFile = dirname(__DIR__) . '/form-config.php';
if (is_file($configFile)) {
    $loaded = require $configFile;
    if (is_array($loaded)) {
        $config = $loaded;
    }
}

function setting(array $config, string $key): string
{
    $environment = getenv($key);
    if (is_string($environment) && $environment !== '') {
        return $environment;
    }
    $value = $config[$key] ?? '';
    return is_string($value) ? trim($value) : '';
}

function validHttpsUrl(string $url): bool
{
    return filter_var($url, FILTER_VALIDATE_URL) !== false
        && strtolower((string) parse_url($url, PHP_URL_SCHEME)) === 'https';
}

function postJson(string $url, array $payload, int $timeout): array
{
    if (!function_exists('curl_init')) {
        return ['ok' => false, 'body' => ''];
    }
    $handle = curl_init($url);
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
        // O Apps Script responde 302 para o googleusercontent com o JSON.
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
    ]);
    $body = curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
    $error = curl_errno($handle);
    curl_close($handle);
    return [
        'ok' => $error === 0 && $status >= 200 && $status < 300,
        'body' => is_string($body) ? $body : '',
    ];
}

$esc = fn (string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

// 1) E-mail. Assunto codificado e sem quebra de linha; Reply-To só com e-mail validado.
$subject = mb_encode_mimeheader("Novo lead: {$name}", 'UTF-8', 'B', "\r\n");
$htmlBody = '<html><body style="font-family:Arial,sans-serif">'
    . '<h2>Novo lead</h2>'
    . '<p><strong>Nome:</strong> ' . $esc($name) . '</p>'
    . '<p><strong>Contato:</strong> ' . $esc($contact) . '</p>'
    . '<p><strong>Projeto:</strong> ' . $esc($project !== '' ? $project : 'Não informado') . '</p>'
    . '<p><strong>Mensagem:</strong><br>' . nl2br($esc($message !== '' ? $message : 'Lead do formulário do site')) . '</p>'
    . '<p>Idioma: ' . $lang . ' · Enviado via evertonbrito.com</p>'
    . '</body></html>';
$headers = "MIME-Version: 1.0\r\n"
    . "Content-Type: text/html; charset=UTF-8\r\n"
    . 'From: Site evertonbrito.com <' . MAIL_FROM . ">\r\n";
if ($email !== '') {
    $headers .= "Reply-To: {$email}\r\n";
}
$emailSent = mail(MAIL_TO, $subject, $htmlBody, $headers);

// 2) Planilha Google (Apps Script). Só conta como salvo se responder JSON com ok: true.
$sheetUrl = setting($config, 'GOOGLE_SHEETS_WEBAPP_URL');
$sheetSaved = false;
if ($sheetUrl !== '' && validHttpsUrl($sheetUrl)) {
    $sheetResponse = postJson($sheetUrl, [
        'name' => $name,
        'contact' => $contact,
        'project' => $project,
        'lang' => $lang,
        'source' => 'evertonbrito.com',
        'userAgent' => mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
    ], 8);
    $sheetBody = json_decode($sheetResponse['body'], true);
    $sheetSaved = $sheetResponse['ok'] && is_array($sheetBody) && ($sheetBody['ok'] ?? false) === true;
}

// 3) Lead no SaaS da agência. Não bloqueia a resposta se a agência estiver fora.
$agencyUrl = rtrim(setting($config, 'AGENCIA_LEADS_URL'), '/');
$agencyToken = setting($config, 'AGENCIA_LEADS_TOKEN');
if ($agencyUrl !== '' && $agencyToken !== '' && validHttpsUrl($agencyUrl)) {
    postJson($agencyUrl . '/api/leads', [
        'token' => $agencyToken,
        'origem' => 'evertonbrito.com',
        'nome' => $name,
        'contato' => $contact,
        'whatsapp' => $whatsapp,
        'email' => $email,
        'project' => $project,
        'mensagem' => $message !== '' ? $message : "Lead do formulário de contato do portfólio ({$lang})",
    ], 5);
}

if ($emailSent || $sheetSaved) {
    respond(200, true, 'Contato enviado com sucesso.');
}

respond(503, false, 'Não foi possível registrar o contato agora.');
