<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->string('purchase_number', 100)->notNull();
            $table->string('status', 30)->default('pending')->comment('pending | received | cancelled');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->timestamp('purchased_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index('shop_id');
            $table->index('supplier_id');
            $table->unique(['shop_id', 'purchase_number']);
            $table->index('status');
            $table->index('purchased_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
