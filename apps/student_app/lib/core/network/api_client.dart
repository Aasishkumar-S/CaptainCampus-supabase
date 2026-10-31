import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/app_constants.dart';
import '../../features/auth/data/repositories/auth_repository.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;
  final String? code;

  ApiException({
    required this.message,
    required this.statusCode,
    this.code,
  });

  @override
  String toString() => 'ApiException(statusCode: $statusCode, message: $message, code: $code)';
}

final apiClientProvider = Provider<ApiClient>((ref) {
  final authRepository = ref.watch(authRepositoryProvider);
  return ApiClient(authRepository: authRepository);
});

class ApiClient {
  final String baseUrl;
  final AuthRepository _authRepository;
  final http.Client _client;

  ApiClient({
    String? baseUrl,
    required AuthRepository authRepository,
    http.Client? client,
  })  : baseUrl = baseUrl ?? AppConstants.apiBaseUrl,
        _authRepository = authRepository,
        _client = client ?? http.Client();

  Future<Map<String, String>> _getHeaders({Map<String, String>? extraHeaders}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    final token = await _authRepository.getIdToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }

    return headers;
  }

  Future<dynamic> get(
    String path, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) async {
    Uri uri = Uri.parse('$baseUrl$path');
    if (queryParameters != null && queryParameters.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParameters);
    }

    final requestHeaders = await _getHeaders(extraHeaders: headers);
    final response = await _client.get(uri, headers: requestHeaders);
    return _handleResponse(response);
  }

  Future<dynamic> post(
    String path, {
    dynamic body,
    Map<String, String>? headers,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final requestHeaders = await _getHeaders(extraHeaders: headers);
    final response = await _client.post(
      uri,
      headers: requestHeaders,
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<dynamic> patch(
    String path, {
    dynamic body,
    Map<String, String>? headers,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final requestHeaders = await _getHeaders(extraHeaders: headers);
    final response = await _client.patch(
      uri,
      headers: requestHeaders,
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<dynamic> delete(
    String path, {
    dynamic body,
    Map<String, String>? headers,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final requestHeaders = await _getHeaders(extraHeaders: headers);
    final response = await _client.delete(
      uri,
      headers: requestHeaders,
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    dynamic responseData;
    try {
      if (response.body.isNotEmpty) {
        responseData = jsonDecode(response.body);
      }
    } catch (_) {
      responseData = response.body;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return responseData;
    }

    String message = 'An unexpected error occurred';
    String? code;

    if (responseData is Map<String, dynamic>) {
      message = responseData['error']?['message'] as String? ??
          responseData['message'] as String? ??
          response.reasonPhrase ??
          message;
      code = responseData['error']?['code'] as String? ??
          responseData['code'] as String?;
    } else if (response.reasonPhrase != null) {
      message = response.reasonPhrase!;
    }

    throw ApiException(
      message: message,
      statusCode: response.statusCode,
      code: code,
    );
  }
}
