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
        Schema::create('shift_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('register_id')->constrained('cash_registers');
            $table->foreignUuid('user_id')->constrained('users'); // Mapped from shop_user_id
            $table->decimal('opening_cash', 12, 2)->default(0);
            $table->decimal('closing_cash', 12, 2)->nullable();
            $table->decimal('total_sales', 14, 2)->default(0);
            $table->decimal('total_refunds', 12, 2)->default(0);
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->string('status', 20)->default('open')->comment('open | closed');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('shop_id');
            $table->index(['shop_id', 'status']);
            $table->index('opened_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_sessions');
    }
};
