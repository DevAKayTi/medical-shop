<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Prune activity logs older than 30 days, runs on the last day of every month at midnight
Schedule::command('activity-logs:prune --days=30')
    ->lastDayOfMonth('00:00')
    ->appendOutputTo(storage_path('logs/activity-logs-prune.log'));
