<?php

namespace App\Console\Commands;

use App\Jobs\PruneActivityLogsJob;
use Illuminate\Console\Command;

class PruneActivityLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'activity-logs:prune {--days=30 : Delete logs older than this many days}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch a job to delete activity log records older than the specified number of days (default: 30)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');

        PruneActivityLogsJob::dispatch($days);

        $this->info("PruneActivityLogsJob dispatched — will delete logs older than {$days} days.");

        return Command::SUCCESS;
    }
}
