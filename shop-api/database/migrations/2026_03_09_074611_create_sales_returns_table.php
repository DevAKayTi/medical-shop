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
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops');
            $table->foreignUuid('sale_id')->constrained('sales');
            $table->string('return_number', 100);
            $table->decimal('total', 12, 2);
            $table->text('reason')->nullable();
            $table->foreignUuid('cashier_id')->nullable()->constrained('users'); // Mapped from shop_user_id
            $table->timestamp('returned_at')->nullable();
            $table->timestamps();

            $table->index('shop_id');
            $table->index('sale_id');
            $table->index('returned_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_returns');
    }
};
