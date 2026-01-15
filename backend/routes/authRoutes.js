// const router = require("express").Router();
// const {
//   register,
//   login,
//   logout,
//   sendVerifyCode,
//   verifyEmail,
//   acceptInvitation,
// } = require("../controllers/authController");

// const { emailPublicLimiter, passwordResetLimiter } = require("../middleware/emailRateLimit");
// const { forgotPassword, resetPassword } = require("../controllers/passwordController");

// router.post("/register", register);
// router.post("/login", login);
// router.post("/logout", logout);

// // email verification (rate limited)
// router.post("/send-verify-code", emailPublicLimiter, sendVerifyCode);
// router.post("/verify-email", emailPublicLimiter, verifyEmail);

// // invitation accept
// router.post("/accept-invitation", acceptInvitation);

// // ✅ Forgot/Reset password
// router.post("/forgot-password", passwordResetLimiter, forgotPassword);
// router.post("/reset-password", passwordResetLimiter, resetPassword);

// module.exports = router;

/**
 * Auth Routes (مسیرهای احراز هویت) (Authentication Routes)
 * ------------------------------------------------------------------------------------
 * این فایل تمام مسیرهای عمومی (Public) مربوط به Auth را مدیریت می‌کند:
 * 1) Register / Login / Logout
 * 2) Email Verification (ارسال کُد و تایید ایمیل) با rate-limit
 * 3) Accept Invitation (پذیرفتن دعوت‌نامه و ساخت اکانت collaborator)
 * 4) Forgot/Reset Password با rate-limit سخت‌گیرانه‌تر
 *
 * ✅ نکته مهم:
 * این مسیرها اکثراً public هستند (به جز logout که باز هم public است ولی cookie پاک می‌کند)
 * یعنی نیازی به auth middleware ندارند، چون هنوز user لاگین نکرده.
 *
 * ------------------------------------------------------------------------------------
 * 📌 Base Path (مسیر پایه)
 * معمولاً این router زیر این مسیر mount می‌شود:
 *   app.use("/auth", router)
 *
 * پس endpoint ها می‌شود:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/logout
 *   POST /auth/send-verify-code
 *   POST /auth/verify-email
 *   POST /auth/accept-invitation
 *   POST /auth/forgot-password
 *   POST /auth/reset-password
 *
 * ------------------------------------------------------------------------------------
 * 🚦 Rate Limiting (محدودیت ارسال درخواست) (Rate Limit)
 * - emailPublicLimiter: برای send-verify-code و verify-email
 *   window: 15 دقیقه | max: 5
 *   اگر بیشتر شد => 429:
 *     { message: "Too many email requests. Please try again later." }
 *
 * - passwordResetLimiter: برای forgot-password و reset-password
 *   window: 15 دقیقه | max: 3
 *   اگر بیشتر شد => 429:
 *     { message: "Too many password reset requests. Please try again later." }
 */

const router = require("express").Router();

const {
  register,
  login,
  logout,
  sendVerifyCode,
  verifyEmail,
  acceptInvitation,
} = require("../controllers/authController");

const { emailPublicLimiter, passwordResetLimiter } = require("../middleware/emailRateLimit");
const { forgotPassword, resetPassword } = require("../controllers/passwordController");

/**
 * ------------------------------------------------------------------------------------
 * ✅ 1) Register (ثبت نام) (Register)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /register
 * @access   Public
 *
 * @body (required)
 * - name: string
 * - email: string
 * - password: string (min 6)
 *
 * @behavior
 * - اگر email تکراری باشد => 409
 * - user با roles=["student"] ساخته می‌شود
 * - JWT ساخته می‌شود و در cookie "access_token" ذخیره می‌گردد
 * - token همچنین داخل response هم برمی‌گردد (برای فرانت مفید)
 *
 * @success 201
 * {
 *   message: "Registered successfully",
 *   token: "<jwt>",
 *   user: { id, name, email, roles, isEmailVerified }
 * }
 *
 * @errors
 * - 400 { message: "name, email, password are required" }
 * - 400 { message: "Password must be at least 6 characters" }
 * - 409 { message: "Email already exists" }
 */
router.post("/register", register);

/**
 * ------------------------------------------------------------------------------------
 * ✅ 2) Login (ورود) (Login)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /login
 * @access   Public
 *
 * @body (required)
 * - email: string
 * - password: string
 *
 * @behavior
 * - اگر user نبود یا پسورد غلط => 401
 * - اگر ok => lastLoginAt update می‌شود
 * - JWT ساخته می‌شود و در cookie "access_token" ذخیره می‌شود
 * - token داخل response هم می‌آید
 *
 * @success 200
 * { message, token, user }
 *
 * @errors
 * - 400 { message: "email and password are required" }
 * - 401 { message: "Invalid email or password" }
 */
router.post("/login", login);

/**
 * ------------------------------------------------------------------------------------
 * ✅ 3) Logout (خروج) (Logout)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /logout
 * @access   Public (ولی اثرش روی cookie است)
 *
 * @behavior
 * - cookie "access_token" را پاک می‌کند
 *
 * @success 200
 * { message: "Logged out successfully" }
 */
router.post("/logout", logout);

/**
 * ------------------------------------------------------------------------------------
 * ✅ 4) Send Verify Code (ارسال کُد تایید ایمیل) (Send Email Verification Code)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /send-verify-code
 * @access   Public
 * @rateLimit emailPublicLimiter (max 5 per 15 min)
 *
 * @body (required)
 * - email: string
 *
 * @behavior
 * - اگر user پیدا نشد => 404
 * - اگر already verified => 400
 * - اگر کمتر از 60 ثانیه دوباره درخواست شود => 429 (message اختصاصی)
 * - کُد 6 رقمی ساخته می‌شود، sha256 می‌شود و داخل user.emailVerify ذخیره می‌شود:
 *   { codeHash, expiresAt(10min), lastSentAt, attempts }
 * - ایمیل ارسال می‌شود
 *
 * @success 200
 * { message: "Verification code sent" }
 *
 * @errors
 * - 400 { message: "email is required" }
 * - 404 { message: "User not found" }
 * - 400 { message: "Email already verified" }
 * - 429 { message: "Please wait 60 seconds before requesting again" }
 * - 429 { message: "Too many email requests. Please try again later." } (rate limit)
 */
router.post("/send-verify-code", emailPublicLimiter, sendVerifyCode);

/**
 * ------------------------------------------------------------------------------------
 * ✅ 5) Verify Email (تایید ایمیل با کُد) (Verify Email)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /verify-email
 * @access   Public
 * @rateLimit emailPublicLimiter (max 5 per 15 min)
 *
 * @body (required)
 * - email: string
 * - code: string (6 digit)
 *
 * @behavior
 * - اگر user پیدا نشد => 404
 * - اگر already verified => 400
 * - اگر کُد قبلاً ساخته نشده => 400
 * - اگر expired => 400 و emailVerify پاک/ریست می‌شود
 * - اگر کُد اشتباه:
 *   - attempts++ می‌شود
 *   - اگر attempts >= 5 => کُد پاک می‌شود (برای امنیت)
 * - اگر درست:
 *   - user.isEmailVerified = true
 *   - emailVerify reset می‌شود
 *
 * @success 200
 * {
 *   message: "Email verified successfully",
 *   user: { id, email, isEmailVerified }
 * }
 *
 * @errors
 * - 400 { message: "email and code are required" }
 * - 404 { message: "User not found" }
 * - 400 { message: "Email already verified" }
 * - 400 { message: "No verification code found. Please request a new code." }
 * - 400 { message: "Code expired. Please request a new code." }
 * - 400 { message: "Invalid code" }
 * - 429 { message: "Too many email requests. Please try again later." } (rate limit)
 */
router.post("/verify-email", emailPublicLimiter, verifyEmail);

/**
 * ------------------------------------------------------------------------------------
 * ✅ 6) Accept Invitation (پذیرفتن دعوت‌نامه) (Accept Invitation)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /accept-invitation
 * @access   Public
 *
 * @body (required)
 * - token: string (raw token که از لینک ایمیل می‌آید)
 * - name: string
 * - password: string (min 6)
 *
 * @behavior
 * - token با sha256 hash می‌شود و با Invitation.tokenHash مقایسه می‌شود
 * - فقط invitation های status="pending" قبول است
 * - اگر invitation نبود => 400 Invalid invitation token
 * - اگر expired => status=expired و 400 Invitation expired
 * - اگر user با این email از قبل ساخته شده باشد => 409
 * - user ساخته می‌شود با roles=["student", invitation.role]
 *   (یعنی یک اکانت هم student است هم collaborator)
 * - invitation => accepted (acceptedBy / acceptedAt set)
 * - بعد از ساخت اکانت، خودکار verification code هم می‌فرستد (10 دقیقه)
 *
 * @success 201
 * {
 *   message: "Account created. Verification code sent to email.",
 *   user: { id, email, roles, isEmailVerified }
 * }
 *
 * @errors
 * - 400 { message: "token, name, password are required" }
 * - 400 { message: "Password must be at least 6 characters" }
 * - 400 { message: "Invalid invitation token" }
 * - 400 { message: "Invitation expired" }
 * - 409 { message: "User already exists with this email" }
 */
router.post("/accept-invitation", acceptInvitation);

/**
 * ------------------------------------------------------------------------------------
 * ✅ 7) Forgot Password (درخواست ریست پسورد) (Forgot Password)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /forgot-password
 * @access   Public
 * @rateLimit passwordResetLimiter (max 3 per 15 min)
 *
 * @body (required)
 * - email: string
 *
 * @behavior (طبق passwordController که فرستادی)
 * - برای جلوگیری از لو رفتن اینکه ایمیل وجود دارد یا نه:
 *   همیشه 200 با پیام یکسان می‌دهد:
 *   { message: "If the email exists, a reset link has been sent." }
 * - اگر user وجود داشته باشد:
 *   - rawToken ساخته می‌شود
 *   - tokenHash = sha256(`${rawToken}:${SECURITY_SECRET}`) ذخیره می‌شود
 *   - expiresAt = 15 دقیقه
 *   - ایمیل reset-password با لینک فرانت می‌رود:
 *     `${CLIENT_URL}/reset-password?token=${rawToken}`
 *
 * @success 200
 * { message: "If the email exists, a reset link has been sent." }
 *
 * @errors
 * - 400 { message: "Invalid email" } (zod validation)
 * - 429 { message: "Too many password reset requests. Please try again later." }
 */
router.post("/forgot-password", passwordResetLimiter, forgotPassword);

/**
 * ------------------------------------------------------------------------------------
 * ✅ 8) Reset Password (تغییر پسورد با توکن) (Reset Password)
 * ------------------------------------------------------------------------------------
 * @method   POST
 * @route    /reset-password
 * @access   Public
 * @rateLimit passwordResetLimiter (max 3 per 15 min)
 *
 * @body (required)
 * - token: string (raw token از لینک ایمیل)
 * - newPassword: string (min 8, max 72)  ✅ دقت کن اینجا min=8 است
 *
 * @behavior
 * - tokenHash = sha256(`${token}:${SECURITY_SECRET}`)
 * - user با resetPassword.tokenHash پیدا می‌شود
 * - اگر نبود => 400 Invalid or expired reset token
 * - اگر expiresAt گذشته بود => 400 Reset token expired...
 * - اگر ok => passwordHash جدید ذخیره می‌شود
 * - resetPassword object پاک می‌شود
 *
 * @success 200
 * { message: "Password reset successful. You can now login." }
 *
 * @errors
 * - 400 { message: "Invalid token or password" } (zod validation)
 * - 400 { message: "Invalid or expired reset token" }
 * - 400 { message: "Reset token expired. Please request a new one." }
 * - 429 { message: "Too many password reset requests. Please try again later." }
 */
router.post("/reset-password", passwordResetLimiter, resetPassword);

module.exports = router;
