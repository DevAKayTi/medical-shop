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
        Schema::create('inventory_snapshot', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('product_id')->constrained('products');
            $table->date('snapshot_date');
            $table->integer('opening_qty')->default(0);
            $table->integer('closing_qty')->default(0);
            $table->integer('purchased_qty')->default(0);
            $table->integer('sold_qty')->default(0);
            $table->integer('adjusted_qty')->default(0);
            $table->timestamp('created_at')->nullable();

            $table->unique(['shop_id', 'product_id', 'snapshot_date'], 'inv_snap_unique');
            $table->index('snapshot_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_snapshot');
    }
};
