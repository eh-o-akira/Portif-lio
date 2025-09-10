<?php
// backend.php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$dbname = "portifolio";
$username = "root";  // mude se for diferente
$password = "";      // mude se tiver senha

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["erro" => "Conexão falhou: " . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];

// Rota: POST /login
if ($method == 'POST' && isset($path[0]) && $path[0] == 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $data['email'];
    $senha = $data['senha'];

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($senha, $user['senha'])) {
        echo json_encode(["id" => $user['id'], "nome" => $user['nome']]);
    } else {
        http_response_code(401);
        echo json_encode(["erro" => "Email ou senha inválidos"]);
    }
} 
// Rota: POST /cadastro
else if ($method == 'POST' && isset($path[0]) && $path[0] == 'cadastro') {
    $data = json_decode(file_get_contents('php://input'), true);
    $nome = $data['nome'];
    $email = $data['email'];
    $senha = password_hash($data['senha'], PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
        $stmt->execute([$nome, $email, $senha]);
        echo json_encode(["id" => $pdo->lastInsertId(), "nome" => $nome]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(["erro" => "Email já cadastrado"]);
    }
} 
// Rota: GET /projetos?usuario_id=1
else if ($method == 'GET' && isset($path[0]) && $path[0] == 'projetos') {
    $usuario_id = $_GET['usuario_id'];
    $stmt = $pdo->prepare("SELECT * FROM projetos WHERE usuario_id = ?");
    $stmt->execute([$usuario_id]);
    $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($projetos);
} 
// Rota: POST /projetos
else if ($method == 'POST' && isset($path[0]) && $path[0] == 'projetos') {
    $data = json_decode(file_get_contents('php://input'), true);
    $titulo = $data['titulo'];
    $imagem = $data['imagem'];
    $link = $data['link'];
    $descricao = $data['descricao'];
    $usuario_id = $data['usuario_id'];

    $stmt = $pdo->prepare("INSERT INTO projetos (titulo, imagem, link, descricao, usuario_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$titulo, $imagem, $link, $descricao, $usuario_id]);

    echo json_encode(["id" => $pdo->lastInsertId()]);
} 
// Rota: DELETE /projetos/5
else if ($method == 'DELETE' && isset($path[0]) && $path[0] == 'projetos' && isset($path[1])) {
    $id = $path[1];
    $stmt = $pdo->prepare("DELETE FROM projetos WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["ok" => true]);
} else {
    http_response_code(404);
    echo json_encode(["erro" => "Rota não encontrada"]);
}