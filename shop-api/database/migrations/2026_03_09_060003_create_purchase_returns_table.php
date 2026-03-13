<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('purchase_id')->constrained('purchases');
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->string('return_number', 100)->notNull();
            $table->decimal('total', 12, 2);
            $table->text('reason')->nullable();
            $table->string('status', 30)->default('pending')->comment('pending | completed');
            $table->string('payment_status', 30)->default('unpaid')->comment('unpaid | paid');
            $table->foreignUuid('returned_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->index('shop_id');
            $table->index('purchase_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};
