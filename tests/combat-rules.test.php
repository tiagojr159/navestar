<?php
declare(strict_types=1);
require_once __DIR__.'/../combat-rules.php';
function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
$origin=['pos_x'=>0,'pos_y'=>0,'pos_z'=>0];
check(combatAlignedHit($origin,['pos_x'=>0,'pos_y'=>0,'pos_z'=>-1000],0,0),'Forward hit');
foreach ([['pos_x'=>0,'pos_y'=>0,'pos_z'=>1000],['pos_x'=>300,'pos_y'=>0,'pos_z'=>-1000],['pos_x'=>0,'pos_y'=>300,'pos_z'=>-1000],['pos_x'=>0,'pos_y'=>0,'pos_z'=>-25001]] as $target) {
    check(!combatAlignedHit($origin,$target,0,0),'Reject behind/off-axis/out-of-range target');
}
check(combatAlignedHit($origin,['pos_x'=>0,'pos_y'=>1000,'pos_z'=>-1000],0,M_PI/4),'Vertical aim');
check(!combatAlignedHit($origin,['pos_x'=>0,'pos_y'=>0,'pos_z'=>-1000],NAN,0),'Reject non-finite aim');
check(!combatAlignedHit($origin,['pos_x'=>0,'pos_y'=>0,'pos_z'=>-1000],0,2),'Reject invalid pitch');
check(combatWeaponInterval('pulse')===180 && combatWeaponInterval('singularity')===1100,'Weapon cadence');
echo "Combat rules: all checks passed.\n";
