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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('category_id')->nullable()->constrained('categories');
            $table->string('name', 191);
            $table->string('generic_name', 191)->nullable();
            $table->string('barcode', 191)->nullable();
            $table->string('sku', 100)->nullable();
            $table->string('medicine_type', 50)->nullable();
            $table->string('manufacturer', 191)->nullable();
            $table->string('unit', 50)->nullable();
            $table->decimal('mrp', 10, 2);
            $table->decimal('purchase_price', 10, 2)->nullable();
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->boolean('is_controlled_drug')->default(false);
            $table->boolean('prescription_required')->default(false);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('shop_id');
            $table->index('barcode');
            $table->index(['shop_id', 'barcode']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
