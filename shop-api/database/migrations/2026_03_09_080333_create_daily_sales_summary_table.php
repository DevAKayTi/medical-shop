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
        Schema::create('daily_sales_summary', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->date('summary_date');
            $table->decimal('total_sales', 14, 2)->default(0);
            $table->decimal('total_refunds', 12, 2)->default(0);
            $table->integer('total_transactions')->default(0);
            $table->decimal('cash_collected', 12, 2)->default(0);
            $table->decimal('card_collected', 12, 2)->default(0);
            $table->decimal('net_revenue', 14, 2)->default(0);
            $table->timestamps();

            $table->unique(['shop_id', 'summary_date']);
            $table->index('summary_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_sales_summary');
    }
};
