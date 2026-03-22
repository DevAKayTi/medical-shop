<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CategoryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:read-catalog', only: ['index']),
            new Middleware('can:create-catalog', only: ['store']),
            new Middleware('can:update-catalog', only: ['update']),
            new Middleware('can:delete-catalog', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $user = $request->user();
        $categories = Category::where('shop_id', $user->shop_id)
            ->orderBy('name')
            ->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name'      => 'required|string|max:191',
            'slug'      => 'required|string|max:191',
            'parent_id' => 'nullable|uuid|exists:categories,id',
            'is_active' => 'boolean',
        ]);

        $data['shop_id'] = $user->shop_id;
        $category = Category::create($data);

        ActivityLogger::log('Inventory', 'Create Category', "Created category: {$category->name}");

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name'      => 'sometimes|string|max:191',
            'slug'      => 'sometimes|string|max:191',
            'parent_id' => 'nullable|uuid|exists:categories,id',
            'is_active' => 'boolean',
        ]);

        $category->update($data);

        ActivityLogger::log('Inventory', 'Update Category', "Updated category: {$category->name}");

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $name = $category->name;
        $category->delete();
        ActivityLogger::log('Inventory', 'Delete Category', "Deleted category: {$name}");
        return response()->json(['message' => 'Category deleted.']);
    }
}
