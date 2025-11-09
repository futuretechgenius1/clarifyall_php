<?php
/*
Plugin Name: ClarifyAll API
Description: API endpoints for ClarifyAll React app
Version: 1.0
*/

if (!defined('ABSPATH')) exit;

add_action('init', 'clarifyall_cors_headers');
function clarifyall_cors_headers() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') exit(0);
}

register_activation_hook(__FILE__, 'clarifyall_create_tables');
function clarifyall_create_tables() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();
    
    $table_categories = $wpdb->prefix . 'clarifyall_categories';
    $sql1 = "CREATE TABLE $table_categories (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        name tinytext NOT NULL,
        slug varchar(100) NOT NULL,
        description text,
        icon varchar(10),
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    $table_tools = $wpdb->prefix . 'clarifyall_tools';
    $sql2 = "CREATE TABLE $table_tools (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        name tinytext NOT NULL,
        description text NOT NULL,
        website_url varchar(500),
        logo_url varchar(500),
        category_id mediumint(9),
        pricing_model varchar(20) DEFAULT 'FREE',
        view_count int DEFAULT 0,
        status varchar(20) DEFAULT 'APPROVED',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    $table_saved = $wpdb->prefix . 'clarifyall_user_saved_tools';
    $sql3 = "CREATE TABLE $table_saved (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        tool_id mediumint(9) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY user_tool (user_id, tool_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql1);
    dbDelta($sql2);
    dbDelta($sql3);
    
    // Insert sample data
    $wpdb->insert($table_categories, ['name' => 'AI Tools', 'slug' => 'ai-tools', 'description' => 'AI tools', 'icon' => '🤖']);
    $wpdb->insert($table_categories, ['name' => 'Dev Tools', 'slug' => 'dev-tools', 'description' => 'Development tools', 'icon' => '💻']);
    
    $wpdb->insert($table_tools, [
        'name' => 'ChatGPT',
        'description' => 'AI assistant for various tasks',
        'website_url' => 'https://chat.openai.com',
        'logo_url' => '/logos/chatgpt.png',
        'category_id' => 1,
        'pricing_model' => 'FREEMIUM'
    ]);
}

add_action('rest_api_init', 'clarifyall_register_routes');
function clarifyall_register_routes() {
    register_rest_route('clarifyall/v1', '/tools', [
        'methods' => 'GET',
        'callback' => 'clarifyall_get_tools',
        'permission_callback' => '__return_true'
    ]);
    
    register_rest_route('clarifyall/v1', '/tools/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'clarifyall_get_tool',
        'permission_callback' => '__return_true'
    ]);
    
    register_rest_route('clarifyall/v1', '/tools', [
        'methods' => 'POST',
        'callback' => 'clarifyall_create_tool',
        'permission_callback' => '__return_true'
    ]);
    
    register_rest_route('clarifyall/v1', '/categories', [
        'methods' => 'GET',
        'callback' => 'clarifyall_get_categories',
        'permission_callback' => '__return_true'
    ]);
    
    register_rest_route('clarifyall/v1', '/users/register', [
        'methods' => 'POST',
        'callback' => 'clarifyall_register_user',
        'permission_callback' => '__return_true'
    ]);
    
    register_rest_route('clarifyall/v1', '/users/login', [
        'methods' => 'POST',
        'callback' => 'clarifyall_login_user',
        'permission_callback' => '__return_true'
    ]);
}

function clarifyall_get_tools($request) {
    global $wpdb;
    $table = $wpdb->prefix . 'clarifyall_tools';
    
    $where = "WHERE status = 'APPROVED'";
    if ($request->get_param('search')) {
        $search = '%' . $request->get_param('search') . '%';
        $where .= $wpdb->prepare(" AND (name LIKE %s OR description LIKE %s)", $search, $search);
    }
    
    $tools = $wpdb->get_results("SELECT * FROM $table $where ORDER BY created_at DESC");
    return ['tools' => $tools, 'totalElements' => count($tools)];
}

function clarifyall_get_tool($request) {
    global $wpdb;
    $table = $wpdb->prefix . 'clarifyall_tools';
    $id = $request['id'];
    
    $tool = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id));
    if ($tool) {
        $wpdb->update($table, ['view_count' => $tool->view_count + 1], ['id' => $id]);
        return $tool;
    }
    return new WP_Error('not_found', 'Tool not found', ['status' => 404]);
}

function clarifyall_create_tool($request) {
    global $wpdb;
    $table = $wpdb->prefix . 'clarifyall_tools';
    $data = $request->get_json_params();
    
    $result = $wpdb->insert($table, [
        'name' => sanitize_text_field($data['name']),
        'description' => sanitize_textarea_field($data['description']),
        'website_url' => esc_url_raw($data['websiteUrl']),
        'category_id' => intval($data['categoryId']),
        'pricing_model' => sanitize_text_field($data['pricingModel'])
    ]);
    
    return $result ? ['success' => true, 'id' => $wpdb->insert_id] : new WP_Error('creation_failed', 'Failed');
}

function clarifyall_get_categories() {
    global $wpdb;
    $table = $wpdb->prefix . 'clarifyall_categories';
    return $wpdb->get_results("SELECT * FROM $table ORDER BY name");
}

function clarifyall_register_user($request) {
    $data = $request->get_json_params();
    $user_id = wp_create_user($data['email'], $data['password'], $data['email']);
    
    if (is_wp_error($user_id)) {
        return new WP_Error('registration_failed', $user_id->get_error_message());
    }
    
    wp_update_user(['ID' => $user_id, 'display_name' => $data['name']]);
    return ['success' => true, 'user' => ['id' => $user_id, 'name' => $data['name'], 'email' => $data['email']]];
}

function clarifyall_login_user($request) {
    $data = $request->get_json_params();
    $user = wp_authenticate($data['email'], $data['password']);
    
    if (is_wp_error($user)) {
        return new WP_Error('login_failed', 'Invalid credentials');
    }
    
    return ['success' => true, 'user' => ['id' => $user->ID, 'name' => $user->display_name, 'email' => $user->user_email]];
}
?>