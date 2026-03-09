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
        Schema::create('shop_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->unique()->constrained('shops')->onDelete('cascade');
            $table->string('currency', 10)->default('USD');
            $table->decimal('tax_rate', 5, 2)->default(0.00);
            $table->string('invoice_prefix', 20)->default('INV-');
            $table->bigInteger('invoice_counter')->default(1);
            $table->integer('low_stock_threshold')->default(10);
            $table->string('timezone', 100)->default('UTC');
            $table->text('receipt_footer')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_settings');
    }
};
