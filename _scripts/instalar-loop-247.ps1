# ─────────────────────────────────────────────────────────────────────────────
#  Instala o loop 24/7 da agência no Agendador de Tarefas do Windows.
#
#  Rode:   powershell -ExecutionPolicy Bypass -File _scripts\instalar-loop-247.ps1
#  Remova: powershell -ExecutionPolicy Bypass -File _scripts\instalar-loop-247.ps1 -Remover
#
#  Espelha 20 Playbooks/crontab-24-7.txt. Não precisa de administrador: as
#  tarefas rodam no seu usuário. O PC precisa estar ligado e logado no horário
#  (é o mesmo "PC = servidor" do playbook — o Oracle ainda não foi provisionado).
#
#  Cada tarefa chama loop-247.mjs, que checa a credencial ANTES de trabalhar e
#  grava alerta no vault se ela morreu. Foi assim que o loop anterior falhou
#  calado: OAuth expirado, exit=1, e a falha só num .log que ninguém lê.
# ─────────────────────────────────────────────────────────────────────────────
param([switch]$Remover)

$ErrorActionPreference = 'Stop'

$Raiz   = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Script = Join-Path $Raiz '_scripts\loop-247.mjs'
$Node   = 'C:\Program Files\nodejs\node.exe'

# ── as 5 tarefas do relógio ──────────────────────────────────────────────────
$Tarefas = @(
  @{ Nome='Agencia-Loop-Health';     Rotina='health';     Hora='07:50'; Dias=$null;                        Desc='Checa os 5 motores de IA antes do primeiro turno do dia' }
  @{ Nome='Agencia-Loop-Prospeccao'; Rotina='prospeccao'; Hora='08:00'; Dias=@('Monday');                  Desc='Prospecta leads e abastece o estagio 0 do pipeline' }
  @{ Nome='Agencia-Loop-Respostas';  Rotina='respostas';  Hora='09:00'; Dias=$null;                        Desc='Checa respostas de leads no Gmail e atualiza as fichas' }
  @{ Nome='Agencia-Loop-Followup';   Rotina='followup';   Hora='10:00'; Dias=@('Monday','Wednesday','Friday'); Desc='Escreve rascunhos de follow-up 3/7/14 dias' }
  @{ Nome='Agencia-Loop-Relatorio';  Rotina='relatorio';  Hora='17:00'; Dias=@('Friday');                  Desc='Relatorio semanal, placar e os 3 cartoes da semana' }
)

if ($Remover) {
  foreach ($t in $Tarefas) {
    if (Get-ScheduledTask -TaskName $t.Nome -ErrorAction SilentlyContinue) {
      Unregister-ScheduledTask -TaskName $t.Nome -Confirm:$false
      Write-Host "  removida: $($t.Nome)"
    }
  }
  Write-Host "`nLoop 24/7 desinstalado."
  exit 0
}

# ── validações antes de agendar ──────────────────────────────────────────────
if (-not (Test-Path $Node))   { Write-Host "ERRO: node nao encontrado em $Node"; exit 1 }
if (-not (Test-Path $Script)) { Write-Host "ERRO: loop-247.mjs nao encontrado em $Script"; exit 1 }

Write-Host "Instalando o loop 24/7 da agencia`n"
Write-Host "  raiz:   $Raiz"
Write-Host "  script: $Script`n"

foreach ($t in $Tarefas) {
  $acao = New-ScheduledTaskAction -Execute $Node -Argument "`"$Script`" $($t.Rotina)" -WorkingDirectory $Raiz

  if ($null -eq $t.Dias) {
    $gatilho = New-ScheduledTaskTrigger -Daily -At $t.Hora
    $quando  = "todo dia as $($t.Hora)"
  } else {
    $gatilho = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $t.Dias -At $t.Hora
    $quando  = "$($t.Dias -join '/') as $($t.Hora)"
  }

  # StartWhenAvailable: se o PC estava desligado na hora, roda quando ligar.
  # Sem isso um turno perdido fica perdido para sempre.
  $cfg = New-ScheduledTaskSettingsSet -StartWhenAvailable `
                                      -DontStopIfGoingOnBatteries `
                                      -AllowStartIfOnBatteries `
                                      -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
                                      -MultipleInstances IgnoreNew

  if (Get-ScheduledTask -TaskName $t.Nome -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $t.Nome -Confirm:$false
  }

  Register-ScheduledTask -TaskName $t.Nome `
                         -Action $acao `
                         -Trigger $gatilho `
                         -Settings $cfg `
                         -Description $t.Desc | Out-Null

  Write-Host ("  OK  {0,-26} {1,-28} {2}" -f $t.Nome, $quando, $t.Rotina)
}

Write-Host "`n5 tarefas instaladas.`n"

# ── avisar sobre a tarefa antiga, sem mexer nela ─────────────────────────────
$antiga = Get-ScheduledTask -TaskName 'Agencia-prospeccao-0700' -ErrorAction SilentlyContinue
if ($antiga) {
  Write-Host "ATENCAO: a tarefa antiga 'Agencia-prospeccao-0700' (todo dia 07:00) continua ativa."
  Write-Host "         Ela faz a MESMA prospeccao da nova, e falhou em 25/09 por OAuth expirado."
  Write-Host "         Com as duas ligadas voce prospecta duas vezes na segunda."
  Write-Host "         Para desligar (nao apaga, so desabilita):"
  Write-Host "           Disable-ScheduledTask -TaskName 'Agencia-prospeccao-0700'`n"
}

Write-Host "Conferir:   Get-ScheduledTask | Where-Object { `$_.TaskName -like 'Agencia-Loop-*' }"
Write-Host "Testar 1:   node _scripts\loop-247.mjs health"
Write-Host "Desinstalar: powershell -ExecutionPolicy Bypass -File _scripts\instalar-loop-247.ps1 -Remover"
