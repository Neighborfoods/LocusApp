package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"locus/internal/models"
	"locus/internal/repositories"
	"locus/pkg/auth"
)

type AuthService interface {
	Register(ctx context.Context, input *models.RegisterInput) (*models.AuthResponse, error)
	Login(ctx context.Context, input *models.LoginInput) (*models.AuthResponse, error)
	GetProfile(ctx context.Context, userID uuid.UUID) (*models.UserPrivateProfile, error)
	SendPasswordReset(ctx context.Context, email string)
	ResetPassword(ctx context.Context, token, newPassword string) error
}

type authService struct {
	userRepo repositories.UserRepository
}

func NewAuthService(userRepo repositories.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(ctx context.Context, input *models.RegisterInput) (*models.AuthResponse, error) {
	// Check duplicate email
	existing, _ := s.userRepo.FindByEmail(ctx, input.Email)
	if existing != nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &models.User{
		FirstName:     input.FirstName,
		LastName:      input.LastName,
		Email:         input.Email,
		PasswordHash:  string(hash),
		Phone:         input.Phone,
		HousingReason: models.HousingReason(input.HousingReason),
		Role:          "user",
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return s.generateAuthResponse(user)
}

func (s *authService) Login(ctx context.Context, input *models.LoginInput) (*models.AuthResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, input.Email)
	if err != nil || user == nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	_ = s.userRepo.Update(ctx, user)

	return s.generateAuthResponse(user)
}

func (s *authService) GetProfile(ctx context.Context, userID uuid.UUID) (*models.UserPrivateProfile, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return user.ToPrivateProfile(), nil
}

func (s *authService) generateAuthResponse(user *models.User) (*models.AuthResponse, error) {
	accessToken, err := auth.GenerateAccessToken(user.ID.String(), user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := auth.GenerateRefreshToken(user.ID.String())
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	return &models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *user.ToPrivateProfile(),
	}, nil
}

func (s *authService) SendPasswordReset(ctx context.Context, email string) {
	// TODO: Generate reset token, store in Redis with TTL, send email via SendGrid
	// This is best-effort - errors are not returned to prevent email enumeration
}

func (s *authService) ResetPassword(ctx context.Context, token, newPassword string) error {
	// TODO: Validate token from Redis, find user, update password, invalidate token
	return errors.New("not implemented")
}
