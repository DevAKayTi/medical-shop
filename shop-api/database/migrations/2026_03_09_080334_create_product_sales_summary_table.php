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
        Schema::create('product_sales_summary', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('product_id')->constrained('products');
            $table->date('summary_date');
            $table->integer('qty_sold')->default(0);
            $table->integer('qty_returned')->default(0);
            $table->decimal('gross_revenue', 14, 2)->default(0);
            $table->decimal('net_revenue', 14, 2)->default(0);
            $table->timestamps();

            $table->unique(['shop_id', 'product_id', 'summary_date'], 'prod_sales_sum_unique');
            $table->index(['shop_id', 'summary_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_sales_summary');
    }
};
