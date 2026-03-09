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
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('batch_id')->nullable()->constrained('product_batches');
            $table->string('type', 30); // increase | decrease | write_off | correction
            $table->integer('quantity');
            $table->text('reason')->nullable();
            $table->foreignUuid('adjusted_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index(['shop_id', 'product_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
