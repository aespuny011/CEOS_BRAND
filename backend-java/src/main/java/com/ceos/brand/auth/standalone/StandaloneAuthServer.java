package com.ceos.brand.auth.standalone;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class StandaloneAuthServer {

    private static final int PORT = 8080;
    private static final String SESSION_COOKIE = "CEOSSESSION";
    private static final Set<String> ALLOWED_ORIGINS = Set.of(
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost",
        "http://127.0.0.1"
    );

    private static final Map<String, SessionUser> SESSIONS = new ConcurrentHashMap<>();
    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/api/auth/register", exchange -> handle(exchange, StandaloneAuthServer::register));
        server.createContext("/api/auth/login", exchange -> handle(exchange, StandaloneAuthServer::login));
        server.createContext("/api/auth/me", exchange -> handle(exchange, StandaloneAuthServer::me));
        server.createContext("/api/auth/logout", exchange -> handle(exchange, StandaloneAuthServer::logout));
        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        System.out.println("Standalone auth server listening on http://localhost:" + PORT);
    }

    private static void handle(HttpExchange exchange, RouteHandler routeHandler) throws IOException {
        try {
            applyCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            routeHandler.handle(exchange);
        } catch (ApiError error) {
            sendJson(exchange, error.statusCode(), "{\"message\":\"" + escapeJson(error.getMessage()) + "\"}");
        } catch (Exception exception) {
            exception.printStackTrace();
            sendJson(exchange, 500, "{\"message\":\"Error inesperado en el servidor.\"}");
        } finally {
            exchange.close();
        }
    }

    private static void register(HttpExchange exchange) throws IOException, SQLException {
        ensureMethod(exchange, "POST");

        Map<String, String> payload = readJsonBody(exchange);
        String name = normalizeText(payload.get("name"));
        String email = normalizeEmail(payload.get("email"));
        String password = payload.getOrDefault("password", "");

        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            throw new ApiError(400, "Todos los campos son obligatorios.");
        }

        if (!email.contains("@") || email.startsWith("@") || email.endsWith("@")) {
            throw new ApiError(400, "El email no es valido.");
        }

        if (password.length() < 6) {
            throw new ApiError(400, "La contrasena debe tener al menos 6 caracteres.");
        }

        try (Connection connection = createConnection()) {
            if (findUserByEmail(connection, email) != null) {
                throw new ApiError(409, "Ya existe una cuenta con ese email.");
            }

            long userId = insertUser(connection, name, email, PASSWORD_ENCODER.encode(password));
            SessionUser user = new SessionUser(userId, name, email);
            createSession(exchange, user);
            sendJson(exchange, 201, user.toJson());
        }
    }

    private static void login(HttpExchange exchange) throws IOException, SQLException {
        ensureMethod(exchange, "POST");

        Map<String, String> payload = readJsonBody(exchange);
        String email = normalizeEmail(payload.get("email"));
        String password = payload.getOrDefault("password", "");

        if (email.isBlank() || password.isBlank()) {
            throw new ApiError(400, "Email y contrasena son obligatorios.");
        }

        try (Connection connection = createConnection()) {
            UserRecord user = findUserByEmail(connection, email);
            if (user == null || !PASSWORD_ENCODER.matches(password, user.passwordHash())) {
                throw new ApiError(401, "Credenciales incorrectas.");
            }

            SessionUser sessionUser = new SessionUser(user.id(), user.name(), user.email());
            createSession(exchange, sessionUser);
            sendJson(exchange, 200, sessionUser.toJson());
        }
    }

    private static void me(HttpExchange exchange) throws IOException {
        ensureMethod(exchange, "GET");

        SessionUser user = requireSession(exchange);
        sendJson(exchange, 200, user.toJson());
    }

    private static void logout(HttpExchange exchange) throws IOException {
        ensureMethod(exchange, "POST");

        String sessionId = getSessionId(exchange);
        if (sessionId != null) {
            SESSIONS.remove(sessionId);
        }

        exchange.getResponseHeaders().add(
            "Set-Cookie",
            SESSION_COOKIE + "=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
        );

        sendJson(exchange, 200, "{\"message\":\"Sesion cerrada correctamente.\"}");
    }

    private static void ensureMethod(HttpExchange exchange, String expectedMethod) {
        if (!expectedMethod.equalsIgnoreCase(exchange.getRequestMethod())) {
            throw new ApiError(405, "Metodo no permitido.");
        }
    }

    private static Map<String, String> readJsonBody(HttpExchange exchange) throws IOException {
        String body;
        try (InputStream inputStream = exchange.getRequestBody()) {
            body = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8).trim();
        }

        if (body.isEmpty()) {
            throw new ApiError(400, "El cuerpo de la solicitud esta vacio.");
        }

        return parseSimpleJson(body);
    }

    private static Map<String, String> parseSimpleJson(String body) {
        String trimmed = body.trim();
        if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
            throw new ApiError(400, "El JSON enviado no es valido.");
        }

        Map<String, String> values = new HashMap<>();
        int index = 1;

        while (index < trimmed.length() - 1) {
            index = skipWhitespace(trimmed, index);
            if (index >= trimmed.length() - 1) {
                break;
            }

            if (trimmed.charAt(index) == ',') {
                index++;
                continue;
            }

            ParsedString key = readJsonString(trimmed, index);
            index = skipWhitespace(trimmed, key.nextIndex());

            if (index >= trimmed.length() || trimmed.charAt(index) != ':') {
                throw new ApiError(400, "El JSON enviado no es valido.");
            }

            index = skipWhitespace(trimmed, index + 1);
            ParsedString value = readJsonString(trimmed, index);
            values.put(key.value(), value.value());
            index = value.nextIndex();
        }

        return values;
    }

    private static int skipWhitespace(String value, int index) {
        while (index < value.length() && Character.isWhitespace(value.charAt(index))) {
            index++;
        }
        return index;
    }

    private static ParsedString readJsonString(String json, int startIndex) {
        if (startIndex >= json.length() || json.charAt(startIndex) != '"') {
            throw new ApiError(400, "El JSON enviado no es valido.");
        }

        StringBuilder builder = new StringBuilder();
        int index = startIndex + 1;

        while (index < json.length()) {
            char current = json.charAt(index);

            if (current == '\\') {
                if (index + 1 >= json.length()) {
                    throw new ApiError(400, "El JSON enviado no es valido.");
                }

                char escaped = json.charAt(index + 1);
                switch (escaped) {
                    case '"', '\\', '/' -> builder.append(escaped);
                    case 'b' -> builder.append('\b');
                    case 'f' -> builder.append('\f');
                    case 'n' -> builder.append('\n');
                    case 'r' -> builder.append('\r');
                    case 't' -> builder.append('\t');
                    case 'u' -> {
                        if (index + 5 >= json.length()) {
                            throw new ApiError(400, "El JSON enviado no es valido.");
                        }
                        String hex = json.substring(index + 2, index + 6);
                        builder.append((char) Integer.parseInt(hex, 16));
                        index += 4;
                    }
                    default -> throw new ApiError(400, "El JSON enviado no es valido.");
                }
                index += 2;
                continue;
            }

            if (current == '"') {
                return new ParsedString(builder.toString(), index + 1);
            }

            builder.append(current);
            index++;
        }

        throw new ApiError(400, "El JSON enviado no es valido.");
    }

    private static void createSession(HttpExchange exchange, SessionUser user) {
        String sessionId = UUID.randomUUID().toString();
        SESSIONS.put(sessionId, user);
        exchange.getResponseHeaders().add(
            "Set-Cookie",
            SESSION_COOKIE + "=" + sessionId + "; Path=/; HttpOnly; SameSite=Lax"
        );
    }

    private static SessionUser requireSession(HttpExchange exchange) {
        String sessionId = getSessionId(exchange);
        if (sessionId == null) {
            throw new ApiError(401, "No hay sesion activa.");
        }

        SessionUser user = SESSIONS.get(sessionId);
        if (user == null) {
            throw new ApiError(401, "No hay sesion activa.");
        }

        return user;
    }

    private static String getSessionId(HttpExchange exchange) {
        String cookieHeader = exchange.getRequestHeaders().getFirst("Cookie");
        if (cookieHeader == null || cookieHeader.isBlank()) {
            return null;
        }

        String[] cookies = cookieHeader.split(";");
        for (String cookie : cookies) {
            String[] parts = cookie.trim().split("=", 2);
            if (parts.length == 2 && SESSION_COOKIE.equals(parts[0].trim())) {
                return URLDecoder.decode(parts[1].trim(), StandardCharsets.UTF_8);
            }
        }

        return null;
    }

    private static Connection createConnection() throws SQLException {
        return DriverManager.getConnection(
            "jdbc:mysql://127.0.0.1:3306/ceos_brand?useSSL=false&serverTimezone=UTC",
            "root",
            ""
        );
    }

    private static UserRecord findUserByEmail(Connection connection, String email) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?"
        )) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    return null;
                }

                return new UserRecord(
                    resultSet.getLong("id"),
                    resultSet.getString("name"),
                    resultSet.getString("email"),
                    resultSet.getString("password_hash")
                );
            }
        }
    }

    private static long insertUser(Connection connection, String name, String email, String passwordHash)
        throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            Statement.RETURN_GENERATED_KEYS
        )) {
            statement.setString(1, name);
            statement.setString(2, email);
            statement.setString(3, passwordHash);
            statement.executeUpdate();

            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getLong(1);
                }
            }
        }

        throw new SQLException("No se pudo obtener el id del usuario creado.");
    }

    private static void applyCorsHeaders(HttpExchange exchange) {
        Headers headers = exchange.getResponseHeaders();
        String origin = exchange.getRequestHeaders().getFirst("Origin");

        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            headers.set("Access-Control-Allow-Origin", origin);
        }

        headers.set("Vary", "Origin");
        headers.set("Access-Control-Allow-Credentials", "true");
        headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Content-Type");
        headers.set("Content-Type", "application/json; charset=utf-8");
    }

    private static void sendJson(HttpExchange exchange, int statusCode, String body) throws IOException {
        byte[] responseBytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, responseBytes.length);
        exchange.getResponseBody().write(responseBytes);
    }

    private static String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private static String normalizeEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String escapeJson(String value) {
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\r", "\\r")
            .replace("\n", "\\n");
    }

    @FunctionalInterface
    private interface RouteHandler {
        void handle(HttpExchange exchange) throws Exception;
    }

    private record ParsedString(String value, int nextIndex) {
    }

    private record UserRecord(long id, String name, String email, String passwordHash) {
    }

    private record SessionUser(long id, String name, String email) {
        private String toJson() {
            return "{\"id\":" + id
                + ",\"name\":\"" + escapeJson(name)
                + "\",\"email\":\"" + escapeJson(email)
                + "\"}";
        }
    }

    private static final class ApiError extends RuntimeException {
        private final int statusCode;

        private ApiError(int statusCode, String message) {
            super(message);
            this.statusCode = statusCode;
        }

        private int statusCode() {
            return statusCode;
        }
    }
}
