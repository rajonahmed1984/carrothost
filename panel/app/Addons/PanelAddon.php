<?php

namespace App\Addons;

interface PanelAddon
{
    /** Runs on every request while the addon is enabled. Register event listeners here. */
    public function boot(array $config): void;
}
