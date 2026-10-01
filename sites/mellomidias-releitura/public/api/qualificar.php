<?php
declare(strict_types=1);

const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 600;

header('Content-Type: application/json; charset=utf-8');

function respond_json(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail_bad_request(string $code): void
{
    respond_json(400, [
        'ok' => false,
        'error' => $code,
    ]);
}

function text_length(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }

    return strlen($value);
}

function is_list_array(array $value): bool
{
    $index = 0;
    foreach (array_keys($value) as $key) {
        if ($key !== $index) {
            return false;
        }
        $index++;
    }

    return true;
}

function remote_ip(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return is_string($ip) && $ip !== '' ? $ip : '0.0.0.0';
}

function anonymized_ip(string $ip): string
{
    return substr(hash('sha256', 'mello-lead:' . $ip), 0, 16);
}

function enforce_rate_limit(string $ip): void
{
    $bucket = anonymized_ip($ip);
    $path = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'mello_qualificar_rl_' . $bucket . '.json';
    $now = time();
    $handle = @fopen($path, 'c+');

    if ($handle === false) {
        return;
    }

    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        return;
    }

    $raw = stream_get_contents($handle);
    $timestamps = json_decode($raw ?: '[]', true);
    if (!is_array($timestamps)) {
        $timestamps = [];
    }

    $recent = [];
    foreach ($timestamps as $timestamp) {
        if (is_int($timestamp) && $timestamp > ($now - RATE_LIMIT_WINDOW)) {
            $recent[] = $timestamp;
        }
    }

    if (count($recent) >= RATE_LIMIT_MAX) {
        flock($handle, LOCK_UN);
        fclose($handle);
        respond_json(429, [
            'ok' => false,
            'error' => 'rate_limited',
        ]);
    }

    $recent[] = $now;
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($recent));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

function require_json_request(): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        fail_bad_request('invalid_method');
    }

    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (stripos((string) $contentType, 'application/json') === false) {
        fail_bad_request('invalid_content_type');
    }

    $raw = file_get_contents('php://input');
    if (!is_string($raw) || trim($raw) === '') {
        fail_bad_request('empty_body');
    }

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data) || is_list_array($data)) {
        fail_bad_request('invalid_json');
    }

    return $data;
}

function validate_lead(array $data): array
{
    $allowed = [
        'nome' => true,
        'whatsapp' => true,
        'instagram' => true,
        'faturamento' => true,
        'investe' => true,
    ];

    foreach ($data as $field => $_value) {
        if (!isset($allowed[$field])) {
            fail_bad_request('unexpected_field');
        }
    }

    foreach (array_keys($allowed) as $field) {
        if (!array_key_exists($field, $data)) {
            fail_bad_request('missing_field');
        }

        if (!is_string($data[$field])) {
            fail_bad_request('invalid_field_type');
        }
    }

    $nome = trim($data['nome']);
    $whatsapp = preg_replace('/\D+/', '', $data['whatsapp']);
    $instagram = trim($data['instagram']);
    $faturamento = trim($data['faturamento']);
    $investe = trim($data['investe']);

    if (text_length($nome) < 2 || text_length($nome) > 80) {
        fail_bad_request('invalid_nome');
    }

    if (!is_string($whatsapp) || strlen($whatsapp) < 10 || strlen($whatsapp) > 13) {
        fail_bad_request('invalid_whatsapp');
    }

    if (!preg_match('/^@?[A-Za-z0-9._]{2,30}$/', $instagram)) {
        fail_bad_request('invalid_instagram');
    }

    if ($instagram[0] !== '@') {
        $instagram = '@' . $instagram;
    }

    if (text_length($faturamento) < 1 || text_length($faturamento) > 80) {
        fail_bad_request('invalid_faturamento');
    }

    if (text_length($investe) < 1 || text_length($investe) > 80) {
        fail_bad_request('invalid_investe');
    }

    return [
        'nome' => $nome,
        'whatsapp' => $whatsapp,
        'instagram' => $instagram,
        'faturamento' => $faturamento,
        'investe' => $investe,
    ];
}

function build_state(array $lead): string
{
    return implode("\n", [
        'Contexto: qualificacao comercial para a Mello Midias, focada em clinicas odontologicas que podem vender mais tratamentos com midia paga.',
        'Objetivo: indicar se o lead merece abordagem comercial rapida, considerando maturidade, capacidade de investimento, dor com marketing atual e urgencia.',
        'Lead:',
        '- Nome: ' . $lead['nome'],
        '- WhatsApp: ' . $lead['whatsapp'],
        '- Instagram: ' . $lead['instagram'],
        '- Faturamento informado: ' . $lead['faturamento'],
        '- Investe em marketing hoje: ' . $lead['investe'],
        'Criterios gerais: clinicas com faturamento consistente, investimento ativo ou disposicao clara para investir, agenda dependente de indicacao, baixa previsibilidade de novos pacientes ou pressa por campanhas tendem a ser mais quentes.',
    ]);
}

function build_questions(): array
{
    return [
        'temperatura' => [
            'type' => 'choice',
            'instructions' => 'Classifique a prontidao comercial do lead para uma solucao de trafego pago e posicionamento digital para clinica odontologica.',
            'criteria' => [
                'quente' => 'Tem sinais de decisao proxima: ja investe ou quer investir, demonstra capacidade financeira, precisa aumentar agenda de tratamentos como implantes, ortodontia, estetica ou harmonizacao, e parece buscar previsibilidade de pacientes.',
                'morno' => 'Tem interesse e alguma dor, mas os sinais de investimento, capacidade ou momento comercial ainda sao incompletos.',
                'frio' => 'Baixa capacidade ou baixa intencao de investir, sem dor clara com captacao, sem urgencia e sem indicio de fit com midia paga.',
            ],
        ],
        'potencial' => [
            'type' => 'score',
            'instructions' => 'Pontue o potencial de retorno para uma clinica odontologica usando midia paga. Baixo: pouco faturamento ou pouco fit. Médio: fit parcial e alguma capacidade. Alto: boa capacidade, servicos de alto ticket e chance real de escalar captacao.',
            'criteria' => ['Baixo', 'Médio', 'Alto'],
        ],
        'dor_resultado' => [
            'type' => 'noul',
            'instructions' => 'O lead demonstra dor com resultado atual do marketing, falta de previsibilidade de pacientes, dependencia de indicacao ou baixa conversao no Instagram.',
        ],
        'urgencia' => [
            'type' => 'noul',
            'instructions' => 'O lead demonstra pressa, momento de decisao, agenda ociosa, necessidade de vender tratamentos agora ou vontade de iniciar campanhas rapidamente.',
        ],
    ];
}

function read_typesafe_key(): ?string
{
    $key = getenv('TYPESAFE_API_KEY');
    if ($key !== false && trim((string) $key) !== '') {
        return trim((string) $key);
    }

    $path = __DIR__ . '/../../typesafe.key';
    if (is_readable($path)) {
        $fileKey = trim((string) file_get_contents($path));
        if ($fileKey !== '') {
            return $fileKey;
        }
    }

    return null;
}

function request_typesafe(string $state, array $questions, string $key): ?array
{
    if (!function_exists('curl_init')) {
        return null;
    }

    $payload = json_encode([
        'state' => $state,
        'model' => 'jev-latest',
        'questions' => $questions,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if (!is_string($payload)) {
        return null;
    }

    $curl = curl_init(TYPESAFE_URL);
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 8,
    ]);

    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_errno($curl);
    curl_close($curl);

    if ($error !== 0 || $status < 200 || $status >= 300 || !is_string($body) || $body === '') {
        return null;
    }

    $decoded = json_decode($body, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return null;
    }

    return $decoded;
}

function clamp_float($value, float $min, float $max): float
{
    if (!is_numeric($value)) {
        return $min;
    }

    return max($min, min($max, (float) $value));
}

function infer_score_from_probabilities(array $probabilities): ?float
{
    $total = 0.0;
    $weight = 0.0;

    foreach ($probabilities as $score => $probability) {
        if (is_numeric($score) && is_numeric($probability)) {
            $total += (float) $score * (float) $probability;
            $weight += (float) $probability;
        }
    }

    if ($weight <= 0.0) {
        return null;
    }

    return clamp_float($total / $weight, 0.0, 2.0);
}

function calculate_priority(?string $temperatura, ?float $potencial, ?float $dor, ?float $urgencia, float $confianca): int
{
    // Regra simples: temperatura quente, potencial alto, dor forte e urgencia
    // elevam a prioridade; confianca abaixo de 0.5 rebaixa um nivel.
    $score = 0;

    if ($temperatura === 'quente') {
        $score += 2;
    } elseif ($temperatura === 'morno') {
        $score += 1;
    }

    if ($potencial !== null) {
        if ($potencial >= 1.5) {
            $score += 2;
        } elseif ($potencial >= 0.8) {
            $score += 1;
        }
    }

    if ($dor !== null && $dor >= 0.7) {
        $score += 1;
    }

    if ($urgencia !== null && $urgencia >= 0.7) {
        $score += 1;
    }

    $priority = $score >= 5 ? 3 : ($score >= 3 ? 2 : 1);

    if ($confianca < 0.5) {
        $priority = max(1, $priority - 1);
    }

    return $priority;
}

function parse_typesafe_classification(array $apiResponse): ?array
{
    $answers = $apiResponse['answers'] ?? null;
    if (!is_array($answers)) {
        return null;
    }

    $temperaturaAnswer = $answers['temperatura'] ?? [];
    $potencialAnswer = $answers['potencial'] ?? [];
    $dorAnswer = $answers['dor_resultado'] ?? [];
    $urgenciaAnswer = $answers['urgencia'] ?? [];

    $temperatura = null;
    if (is_array($temperaturaAnswer) && isset($temperaturaAnswer['choice']) && is_string($temperaturaAnswer['choice'])) {
        $choice = strtolower($temperaturaAnswer['choice']);
        if (in_array($choice, ['quente', 'morno', 'frio'], true)) {
            $temperatura = $choice;
        }
    }

    $potencial = null;
    if (is_array($potencialAnswer) && isset($potencialAnswer['score']) && is_numeric($potencialAnswer['score'])) {
        $potencial = clamp_float($potencialAnswer['score'], 0.0, 2.0);
    } elseif (is_array($potencialAnswer) && isset($potencialAnswer['probabilities']) && is_array($potencialAnswer['probabilities'])) {
        $potencial = infer_score_from_probabilities($potencialAnswer['probabilities']);
    }

    $dor = is_array($dorAnswer) && array_key_exists('noul', $dorAnswer)
        ? clamp_float($dorAnswer['noul'], 0.0, 1.0)
        : null;

    $urgencia = is_array($urgenciaAnswer) && array_key_exists('noul', $urgenciaAnswer)
        ? clamp_float($urgenciaAnswer['noul'], 0.0, 1.0)
        : null;

    $confidenceValues = [];
    foreach ([$temperaturaAnswer, $potencialAnswer, $dorAnswer, $urgenciaAnswer] as $answer) {
        if (is_array($answer) && isset($answer['confidence']) && is_numeric($answer['confidence'])) {
            $confidenceValues[] = clamp_float($answer['confidence'], 0.0, 1.0);
        }
    }

    $confianca = count($confidenceValues) > 0
        ? array_sum($confidenceValues) / count($confidenceValues)
        : 0.0;

    $prioridade = calculate_priority($temperatura, $potencial, $dor, $urgencia, $confianca);

    return [
        'qualificado' => $temperatura !== null,
        'temperatura' => $temperatura,
        'confianca' => round($confianca, 2),
        'potencial' => $potencial !== null ? round($potencial, 2) : null,
        'dor' => $dor !== null ? round($dor, 2) : null,
        'urgencia' => $urgencia !== null ? round($urgencia, 2) : null,
        'prioridade' => $prioridade,
    ];
}

function mock_classification(): array
{
    $temperatura = 'quente';
    $confianca = 0.93;
    $potencial = 1.85;
    $dor = 0.86;
    $urgencia = 0.78;

    return [
        'qualificado' => true,
        'temperatura' => $temperatura,
        'confianca' => $confianca,
        'potencial' => $potencial,
        'dor' => $dor,
        'urgencia' => $urgencia,
        'prioridade' => calculate_priority($temperatura, $potencial, $dor, $urgencia, $confianca),
    ];
}

function fallback_classification(): array
{
    return [
        'qualificado' => false,
        'temperatura' => null,
        'confianca' => 0.0,
        'potencial' => null,
        'dor' => null,
        'urgencia' => null,
        'prioridade' => 1,
    ];
}

function append_lead_jsonl(array $lead, array $classification, string $source, ?string $reason = null): void
{
    $entry = [
        'timestamp' => gmdate('c'),
        'ip_hash' => anonymized_ip(remote_ip()),
        'lead' => $lead,
        'classification' => [
            'qualificado' => $classification['qualificado'],
            'temperatura' => $classification['temperatura'],
            'confianca' => $classification['confianca'],
            'potencial' => $classification['potencial'],
            'dor' => $classification['dor'],
            'urgencia' => $classification['urgencia'],
            'prioridade' => $classification['prioridade'],
        ],
        'source' => $source,
    ];

    if ($reason !== null) {
        $entry['motivo'] = $reason;
    }

    $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (is_string($line)) {
        file_put_contents(__DIR__ . '/../../leads-mello.jsonl', $line . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}

function response_payload(array $classification): array
{
    return [
        'ok' => true,
        'qualificado' => $classification['qualificado'],
        'temperatura' => $classification['temperatura'],
        'confianca' => $classification['confianca'],
        'potencial' => $classification['potencial'],
        'dor' => $classification['dor'],
        'urgencia' => $classification['urgencia'],
        'prioridade' => $classification['prioridade'],
    ];
}

$ip = remote_ip();
$data = require_json_request();
$lead = validate_lead($data);
enforce_rate_limit($ip);
$state = build_state($lead);
$questions = build_questions();

if (getenv('TYPESAFE_MOCK') !== false) {
    $classification = mock_classification();
    append_lead_jsonl($lead, $classification, 'mock');
    respond_json(200, response_payload($classification));
}

$key = read_typesafe_key();
if ($key === null) {
    $classification = fallback_classification();
    append_lead_jsonl($lead, $classification, 'fallback', 'qualificacao_indisponivel');
    respond_json(200, response_payload($classification));
}

$apiResponse = request_typesafe($state, $questions, $key);
$classification = $apiResponse !== null ? parse_typesafe_classification($apiResponse) : null;

if ($classification === null) {
    $classification = fallback_classification();
    append_lead_jsonl($lead, $classification, 'fallback', 'qualificacao_indisponivel');
    respond_json(200, response_payload($classification));
}

append_lead_jsonl($lead, $classification, 'typesafe');
respond_json(200, response_payload($classification));
