<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->uuid('user_id')->nullable(); // null = broadcast to all shop users
            $table->string('type', 50); // sale, purchase, low_stock, user, system
            $table->string('title', 255);
            $table->text('message')->nullable();
            $table->json('data')->nullable(); // extra payload (invoice number, product id, etc.)
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('shop_id');
            $table->index(['shop_id', 'read_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
