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
        Schema::create('monthly_sales_summary', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->smallInteger('year');
            $table->tinyInteger('month');
            $table->decimal('total_sales', 16, 2)->default(0);
            $table->decimal('total_refunds', 14, 2)->default(0);
            $table->integer('total_transactions')->default(0);
            $table->decimal('net_revenue', 16, 2)->default(0);
            $table->timestamps();

            $table->unique(['shop_id', 'year', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_sales_summary');
    }
};
