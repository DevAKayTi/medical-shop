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
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->string('invoice_number', 100);
            $table->foreignUuid('customer_id')->nullable()->constrained('customers');
            $table->foreignUuid('session_id')->nullable()->constrained('shift_sessions');
            $table->foreignUuid('register_id')->nullable()->constrained('cash_registers');
            $table->foreignUuid('cashier_id')->constrained('users'); // Mapped from shop_user_id
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->decimal('amount_paid', 12, 2);
            $table->decimal('change_amount', 10, 2)->default(0);
            $table->string('status', 30)->default('completed')->comment('completed | refunded | partially_refunded');
            $table->text('notes')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('shop_id');
            $table->index('customer_id');
            $table->unique(['shop_id', 'invoice_number']);
            $table->index('status');
            $table->index('sold_at');
            $table->index(['shop_id', 'sold_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
