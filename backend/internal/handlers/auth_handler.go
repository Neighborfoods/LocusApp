package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"locus/internal/models"
	"locus/internal/services"
	"locus/pkg/auth"
	"locus/pkg/response"
)

type AuthHandler struct {
	authService services.AuthService
	log         *zap.Logger
}

func NewAuthHandler(authService services.AuthService, log *zap.Logger) *AuthHandler {
	return &AuthHandler{authService: authService, log: log}
}

// POST /auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var input models.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.ValidationErr(c, err)
		return
	}

	authResp, err := h.authService.Register(c.Request.Context(), &input)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			response.Conflict(c, "Email already registered")
			return
		}
		h.log.Error("register failed", zap.Error(err))
		response.Internal(c)
		return
	}

	response.Created(c, authResp)
}

// POST /auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.ValidationErr(c, err)
		return
	}

	authResp, err := h.authService.Login(c.Request.Context(), &input)
	if err != nil {
		if strings.Contains(err.Error(), "invalid credentials") {
			response.Unauthorized(c, "Invalid email or password")
			return
		}
		h.log.Error("login failed", zap.Error(err))
		response.Internal(c)
		return
	}

	response.Success(c, authResp)
}

// POST /auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	var body struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.ValidationErr(c, err)
		return
	}

	claims, err := auth.ValidateToken(body.RefreshToken, auth.RefreshToken)
	if err != nil {
		response.Unauthorized(c, "Invalid or expired refresh token")
		return
	}

	accessToken, err := auth.GenerateAccessToken(claims.UserID.String(), claims.Role)
	if err != nil {
		response.Internal(c)
		return
	}

	response.Success(c, gin.H{"access_token": accessToken})
}

// GET /auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := h.authService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "User not found")
		return
	}
	response.Success(c, user)
}

// POST /auth/logout
func (h *AuthHandler) ut(c *gin.Context) {
	// In a production app, we'd add the JWT to a blocklist in Redis here.
	// For now, client-side token deletion is sufficient.
	response.Success(c, gin.H{"message": "Logged out successfully"})
}

// POST /auth/forgot-password
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var body struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.ValidationErr(c, err)
		return
	}

	// Always return 200 to prevent email enumeration
	go h.authService.SendPasswordReset(c.Request.Context(), body.Email)
	response.Success(c, gin.H{"message": "If this email exists, a reset link has been sent"})
}

// POST /auth/reset-password
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var body struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.ValidationErr(c, err)
		return
	}

	if err := h.authService.ResetPassword(c.Request.Context(), body.Token, body.Password); err != nil {
		response.Err(c, http.StatusBadRequest, "Invalid or expired reset token")
		return
	}

	response.Success(c, gin.H{"message": "Password reset successfully"})
}
