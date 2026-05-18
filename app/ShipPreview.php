<?php

function navestar_is_procedural_ship(array $ship): bool
{
    return isset($ship['model']) && strpos((string) $ship['model'], 'css_3d_') === 0;
}

function navestar_hangar_ships(array $ships): array
{
    return array_values(array_filter($ships, static fn (array $ship): bool => navestar_is_procedural_ship($ship)));
}

function navestar_ship_preview_variant(array $ship): string
{
    return (string) ($ship['model'] ?? $ship['code'] ?? 'css_3d_voyager');
}

function navestar_render_ship_preview(array $ship, string $imageClass = 'ship-card__image ship-card__image--model', string $previewClass = 'css-ship-preview'): string
{
    $variant = htmlspecialchars(navestar_ship_preview_variant($ship), ENT_QUOTES, 'UTF-8');
    $label = htmlspecialchars((string) ($ship['name'] ?? 'Nave'), ENT_QUOTES, 'UTF-8');

    return <<<HTML
<div class="{$imageClass}" data-css-ship-preview aria-label="{$label}">
    <div class="{$previewClass}" data-ship-variant="{$variant}">
        <div class="css-ship-preview__body">
            <span class="css-ship-preview__part css-ship-preview__part--nose"></span>
            <span class="css-ship-preview__part css-ship-preview__part--hull"></span>
            <span class="css-ship-preview__part css-ship-preview__part--canopy"></span>
            <span class="css-ship-preview__part css-ship-preview__part--wing css-ship-preview__part--left-wing"></span>
            <span class="css-ship-preview__part css-ship-preview__part--wing css-ship-preview__part--right-wing"></span>
            <span class="css-ship-preview__part css-ship-preview__part--engine css-ship-preview__part--left-engine"></span>
            <span class="css-ship-preview__part css-ship-preview__part--engine css-ship-preview__part--right-engine"></span>
            <span class="css-ship-preview__part css-ship-preview__part--fin css-ship-preview__part--top-fin"></span>
            <span class="css-ship-preview__part css-ship-preview__part--fin css-ship-preview__part--bottom-fin"></span>
        </div>
    </div>
</div>
HTML;
}
