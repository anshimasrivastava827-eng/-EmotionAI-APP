
<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

require_once "db.php";


$envPath = dirname(__DIR__, 2) .
    DIRECTORY_SEPARATOR . "EmotionAI-secret" .
    DIRECTORY_SEPARATOR . ".env";

if (!file_exists($envPath)) {
    echo json_encode([
        "success" => false,
        "error" => "API configuration file not found"
    ]);
    exit;
}

$envLines = file(
    $envPath,
    FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
);

$apiKey = "";

foreach ($envLines as $line) {
    $line = trim($line);

    if ($line === "" || strpos($line, "#") === 0) {
        continue;
    }

    if (strpos($line, "GEMINI_API_KEY=") === 0) {
        $apiKey = trim(
            substr($line, strlen("GEMINI_API_KEY=")),
            " \t\n\r\0\x0B\"'"
        );
        break;
    }
}

if ($apiKey === "") {
    echo json_encode([
        "success" => false,
        "error" => "Gemini API key is missing"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$message = trim($data["message"] ?? "");

if ($message === "") {
    echo json_encode([
        "success" => false,
        "error" => "Message cannot be empty"
    ]);
    exit;
}


$emotion = "Neutral";

if (preg_match('/\b(sad|unhappy|cry|lonely|upset|depressed)\b/i', $message)) {
    $emotion = "Sad";
} elseif (preg_match('/\b(angry|hate|irritated|furious)\b/i', $message)) {
    $emotion = "Angry";
} elseif (preg_match('/\b(stress|stressed|anxious|worried|nervous|tension)\b/i', $message)) {
    $emotion = "Stressed";
} elseif (preg_match('/\b(happy|excited|great|awesome|good)\b/i', $message)) {
    $emotion = "Happy";
}

$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";


$payload = [
    "systemInstruction" => [
        "parts" => [
            [
                "text" => "You are EmotionAI, a friendly and empathetic AI companion. Reply in simple, warm language. Listen carefully, acknowledge the user's feelings, and offer supportive suggestions. Keep replies concise. Do not claim to be a human or a professional therapist."
            ]
        ]
    ],
    "contents" => [
        [
            "role" => "user",
            "parts" => [
                ["text" => $message]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.7,
        "maxOutputTokens" => 300
    ]
];

$options = [
    "http" => [
        "method" => "POST",
        "header" =>
            "Content-Type: application/json\r\n" .
            "x-goog-api-key: " . $apiKey . "\r\n",
        "content" => json_encode($payload),
        "timeout" => 60,
        "ignore_errors" => true
    ]
];

$context = stream_context_create($options);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    echo json_encode([
        "success" => false,
        "error" => "Unable to connect to Gemini API"
    ]);
    exit;
}


$httpCode = 0;

if (isset($http_response_header)) {
    foreach ($http_response_header as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $matches)) {
            $httpCode = (int)$matches[1];
        }
    }
}

$result = json_decode($response, true);

if ($httpCode !== 200) {
    echo json_encode([
        "success" => false,
        "error" => $result["error"]["message"] ?? "Gemini API request failed",
        "http_code" => $httpCode
    ]);
    exit;
}


$reply = $result["candidates"][0]["content"]["parts"][0]["text"] ?? "";

if (trim($reply) === "") {
    echo json_encode([
        "success" => false,
        "error" => "Gemini returned an empty response"
    ]);
    exit;
}

$reply = trim($reply);


$sender = "user";

$stmt = $conn->prepare(
    "INSERT INTO messages (sender, message, emotion) VALUES (?, ?, ?)"
);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "error" => "Database query preparation failed"
    ]);
    exit;
}

$stmt->bind_param("sss", $sender, $message, $emotion);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "error" => "Unable to save user message"
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$userMessageId = $stmt->insert_id;


$aiSender = "ai";

$stmt->bind_param("sss", $aiSender, $reply, $emotion);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "error" => "Unable to save AI reply"
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$aiMessageId = $stmt->insert_id;

$stmt->close();
$conn->close();

// Send response to React Native
echo json_encode([
    "success" => true,
    "message" => "User message and AI reply saved successfully",
    "id" => $userMessageId,
    "ai_id" => $aiMessageId,
    "emotion" => $emotion,
    "reply" => $reply
]);

?>
