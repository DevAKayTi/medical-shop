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
        Schema::create('login_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('user_type', 50)->comment('platform_user | shop_user');
            $table->uuid('user_id');
            $table->string('ip_address', 50)->nullable();
            $table->string('device_info', 500)->nullable();
            $table->boolean('success');
            $table->string('failure_reason', 255)->nullable();
            $table->timestamp('logged_in_at')->nullable();

            $table->index('user_id');
            $table->index(['user_type', 'user_id']);
            $table->index('logged_in_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('login_logs');
    }
};
