<?php

namespace App\Http\Middleware;

use App\Services\ActivityLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ActivityLogMiddleware
{
    /**
     * Sensitive fields that should never be logged.
     */
    protected array $maskedFields = ['password', 'password_confirmation', 'token', 'secret', 'credit_card'];

    /**
     * Map of HTTP methods to action verbs.
     */
    protected array $methodActions = [
        'POST'   => 'Create',
        'PUT'    => 'Update',
        'PATCH'  => 'Update',
        'DELETE' => 'Delete',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log state-changing requests
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return $response;
        }

        // Only log for authenticated users
        if (!Auth::check()) {
            return $response;
        }

        // Skip if already logged manually in a controller
        // Controllers set this flag via request attribute to prevent double logging
        if ($request->attributes->get('activity_logged', false)) {
            return $response;
        }

        // Only log successful responses (2xx)
        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return $response;
        }

        // Derive module and action from route
        $routeName = $request->route()?->getName() ?? '';
        $routePath = $request->route()?->uri() ?? $request->path();

        [$module, $action] = $this->deriveModuleAndAction($routeName, $routePath, $request->method());

        // Build description from safe request data
        $safeData = $this->getSafeData($request);
        $description = $this->buildDescription($action, $module, $safeData, $routePath);

        ActivityLogger::log($module, $action, $description);

        return $response;
    }

    /**
     * Derive module and action from route information.
     */
    protected function deriveModuleAndAction(string $routeName, string $routePath, string $method): array
    {
        $action = $this->methodActions[$method] ?? 'Action';

        // Try to extract module from route name (e.g. "api.products.store" -> "Products")
        if ($routeName) {
            $parts = explode('.', $routeName);
            // Route names are like: api.products.store, api.sales.index, etc.
            $resourcePart = count($parts) >= 3 ? $parts[count($parts) - 2] : ($parts[1] ?? 'API');
            $module = ucfirst(str_replace(['-', '_'], ' ', $resourcePart));
            $actionVerb = $parts[count($parts) - 1] ?? '';
            if ($actionVerb === 'store') {
                $action = 'Create';
            } elseif (in_array($actionVerb, ['update', 'patch'])) {
                $action = 'Update';
            } elseif ($actionVerb === 'destroy') {
                $action = 'Delete';
            }
            return [ucwords($module), "$action $module"];
        }

        // Fallback: extract from path segments
        $segments = array_filter(explode('/', trim($routePath, '/')));
        $segments = array_values($segments);
        // Skip "api" prefix
        if (isset($segments[0]) && $segments[0] === 'api') {
            array_shift($segments);
        }
        $resource = ucfirst(str_replace(['-', '_'], ' ', $segments[0] ?? 'Resource'));

        return [$resource, "$action $resource"];
    }

    /**
     * Get request data with sensitive fields masked.
     */
    protected function getSafeData(Request $request): array
    {
        $data = $request->except($this->maskedFields);

        // Mask any nested sensitive keys
        array_walk_recursive($data, function (&$value, $key) {
            if (in_array(strtolower($key), $this->maskedFields)) {
                $value = '***';
            }
        });

        return $data;
    }

    /**
     * Build a human-readable description.
     */
    protected function buildDescription(string $action, string $module, array $data, string $path): string
    {
        $name = $data['name'] ?? $data['title'] ?? $data['email'] ?? null;
        $user = Auth::user();

        $who = $user ? $user->name : 'System';

        if ($name) {
            return "{$who} {$action}d {$module}: {$name}";
        }

        return "{$who} performed '{$action}' on {$module} (path: {$path})";
    }
}
