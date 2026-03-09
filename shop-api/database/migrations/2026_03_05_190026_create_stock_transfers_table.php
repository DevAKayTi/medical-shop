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
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('from_shop_id')->constrained('shops');
            $table->foreignUuid('to_shop_id')->constrained('shops');
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('batch_id')->nullable()->constrained('product_batches');
            $table->integer('quantity');
            $table->string('status', 20); // pending | approved | rejected
            $table->foreignUuid('requested_by')->nullable()->constrained('users');
            $table->foreignUuid('approved_by')->nullable()->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
