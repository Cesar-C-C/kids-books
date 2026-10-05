# Validate the imported limited Schema without installing a Python package.
$ErrorActionPreference = 'Stop'
$schemaText = Get-Content -Raw -LiteralPath 'video-production/templates/narration-record.schema.json'
$templateText = Get-Content -Raw -LiteralPath 'video-production/templates/narration-record.template.json'
$cases = @()
function Check-TemplateCase($name, $jsonText, $expected) {
    $actual = Test-Json -Json $jsonText -Schema $schemaText -ErrorAction SilentlyContinue
    if ($actual -ne $expected) { throw "Unexpected Schema result: $name" }
    $script:cases += @{ name = $name; status = 'PASS'; expectedValid = $expected }
}
Check-TemplateCase 'Original draft template' $templateText $true
$draft = $templateText | ConvertFrom-Json
if ($draft.status -ne 'draft' -or $draft.reference.mode -ne 'pending' -or $null -ne $draft.delivery.sha256 -or $draft.identity.trackId -notlike '__SET_*') { throw 'Do not present a draft as frozen audio' }
$cross = $templateText | ConvertFrom-Json
$cross.reference.mode = 'inference_cross_lingual'
Check-TemplateCase 'Cross-lingual without a reference transcript' ($cross | ConvertTo-Json -Depth 30) $true
$cross.reference.transcript = 'A made-up reference transcript'
$cross.reference.transcriptSha256 = 'a' * 64
Check-TemplateCase 'Reject cross-lingual fabricated transcript' ($cross | ConvertTo-Json -Depth 30) $false
$zero = $templateText | ConvertFrom-Json
$zero.reference.mode = 'inference_zero_shot'
Check-TemplateCase 'Reject zero-shot missing transcript and hash' ($zero | ConvertTo-Json -Depth 30) $false
$zero.reference.transcript = 'Schema-only fixture, not an actual reference recording.'
$zero.reference.transcriptSha256 = 'a' * 64
Check-TemplateCase 'Zero-shot transcript and hash shape only' ($zero | ConvertTo-Json -Depth 30) $true
$seed = $templateText | ConvertFrom-Json
$seed.generation.seedStatus = 'not_recorded'
$seed.generation.seed = 42
Check-TemplateCase 'Reject invented unrecorded seed' ($seed | ConvertTo-Json -Depth 30) $false
@{ status = 'PASS'; validator = 'PowerShell Test-Json'; powershellVersion = $PSVersionTable.PSVersion.ToString(); cases = $cases; identity = 'draft-not-frozen'; scope = 'Schema structure only. No transcript/WAV equivalence, real hashes, timing, recording rights or human listening established.' } | ConvertTo-Json -Depth 10
