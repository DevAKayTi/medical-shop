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
        Schema::create('sale_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->string('method', 50)->comment('cash | card | bank_transfer | wallet | credit');
            $table->decimal('amount', 12, 2);
            $table->string('reference', 255)->nullable()->comment('card ref / wallet txn id');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('sale_id');
            $table->index('shop_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_payments');
    }
};
