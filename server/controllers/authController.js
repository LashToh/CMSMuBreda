import * as authService from '../services/authService.js';
import * as passwordResetService from '../services/passwordResetService.js';
import { ok } from '../utils/response.js';

export async function register(req, res, next) {
  try {
    const result = await authService.registerAccount(req.validated);
    return ok(res, result, result.message, 201);
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.validated, res);
    return ok(res, result, 'Logged in.');
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const result = authService.logout(res);
    return ok(res, result, result.message);
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.username);
    return ok(res, { user });
  } catch (err) {
    return next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.username, req.validated);
    return ok(res, result, result.message);
  } catch (err) {
    return next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await passwordResetService.requestReset(req.validated.email);
    return ok(res, result, result.message);
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await passwordResetService.confirmReset(req.validated);
    return ok(res, result, result.message);
  } catch (err) {
    return next(err);
  }
}
