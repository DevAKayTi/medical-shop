<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->nullable()->constrained('shops');
            $table->string('user_type', 50)->nullable();
            $table->uuid('user_id');
            $table->string('event', 100)->comment('created | updated | deleted | price_changed | stock_adjusted');
            $table->string('auditable_type', 191)->comment('App\Models\Product');
            $table->uuid('auditable_id');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 50)->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('shop_id');
            $table->index('user_id');
            $table->index(['auditable_type', 'auditable_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
