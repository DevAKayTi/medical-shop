<?php

namespace App\Jobs;

use App\Models\ActivityLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class PruneActivityLogsJob implements ShouldQueue
{
    use Queueable;

    /**
     * Number of tries before the job is marked as failed.
     */
    public int $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(public readonly int $days = 30)
    {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $cutoff = now()->subDays($this->days);

        $deleted = ActivityLog::where('created_at', '<', $cutoff)->delete();

        Log::info("PruneActivityLogsJob: deleted {$deleted} records older than {$this->days} days (before {$cutoff->toDateString()}).");
    }
}
