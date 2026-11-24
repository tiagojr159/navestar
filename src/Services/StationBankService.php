<?php
declare(strict_types=1);

namespace NaveStar\Services;

use InvalidArgumentException;

final class StationBankService
{
    private const RESOURCE_FIELDS = [
        'iron' => 'iron_kg',
        'nickel' => 'nickel_kg',
        'cobalt' => 'cobalt_kg',
        'ice' => 'ice_kg',
        'energy' => 'energy_units',
        'fuel' => 'fuel_units',
    ];

    /** @return array{operation:string,resource:string,amount:int|null,fields:array<string,string>,bulk:bool,equipmentResource:bool} */
    public static function parseRequest(array $input): array
    {
        $operation = (string) ($input['operation'] ?? '');
        $resource = (string) ($input['resource'] ?? '');
        $amount = filter_var($input['amount'] ?? null, FILTER_VALIDATE_INT);
        $bulk = $operation === 'deposit_all';
        $equipmentResource = strpos($resource, 'equipment:') === 0;

        if ((!$bulk && !in_array($operation, ['deposit', 'withdraw'], true))
            || (!$bulk && !isset(self::RESOURCE_FIELDS[$resource]) && $resource !== 'credits' && !$equipmentResource)
            || ($equipmentResource && $operation !== 'withdraw')
            || (!$bulk && ($amount === false || $amount < 1 || $amount > 1000000))) {
            throw new InvalidArgumentException('Operacao, recurso ou quantidade invalida.');
        }

        return [
            'operation' => $operation,
            'resource' => $resource,
            'amount' => $amount === false ? null : (int) $amount,
            'fields' => self::RESOURCE_FIELDS,
            'bulk' => $bulk,
            'equipmentResource' => $equipmentResource,
        ];
    }
}
