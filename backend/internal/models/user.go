package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type HousingReason string
type UserRole string

const (
	HousingReasonJobLoss         HousingReason = "job_loss"
	HousingReasonLossOfLovedOne  HousingReason = "loss_of_loved_one"
	HousingReasonHighMortgage    HousingReason = "high_mortgage_rates"
	HousingReasonDivorce         HousingReason = "divorce"
	HousingReasonExploring       HousingReason = "exploring"

	RoleUser  UserRole = "user"
	RoleAdmin UserRole = "admin"
)

type User struct {
	ID                     uuid.UUID      `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	FirstName              string         `gorm:"not null" json:"first_name"`
	LastName               string         `gorm:"not null" json:"last_name"`
	Email                  string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash           string         `gorm:"not null" json:"-"`
	Phone                  *string        `json:"phone,omitempty"`
	Role                   string         `gorm:"default:'user'" json:"role"`
	HousingReason          HousingReason  `json:"housing_reason,omitempty"`
	ProfessionalTitle      *string        `json:"professional_title,omitempty"`
	Bio                    *string        `json:"bio,omitempty"`
	AvatarURL              *string        `json:"avatar_url,omitempty"`
	Hobbies                []string       `gorm:"type:text[]" json:"hobbies,omitempty"`
	KYCDocumentURL         *string        `json:"-"` // Never expose in JSON
	KYCVerified            bool           `gorm:"default:false" json:"kyc_verified"`
	BackgroundCheckConsent bool           `gorm:"default:false" json:"background_check_consent"`
	VerificationScore      int            `gorm:"default:0" json:"verification_score"`
	LastLoginAt            *time.Time     `json:"last_login_at,omitempty"`
	Memberships            []Membership   `gorm:"foreignKey:UserID" json:"memberships,omitempty"`
	CreatedAt              time.Time      `json:"created_at"`
	UpdatedAt              time.Time      `json:"updated_at"`
	DeletedAt              gorm.DeletedAt `gorm:"index" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// ToPublicProfile — safe to show to other community members
func (u *User) ToPublicProfile() *UserPublicProfile {
	return &UserPublicProfile{
		ID:                u.ID,
		FirstName:         u.FirstName,
		LastName:          u.LastName,
		AvatarURL:         u.AvatarURL,
		ProfessionalTitle: u.ProfessionalTitle,
		Hobbies:           u.Hobbies,
		KYCVerified:       u.KYCVerified,
		MemberSince:       u.CreatedAt,
	}
}

// ToPrivateProfile — only for the user themselves
func (u *User) ToPrivateProfile() *UserPrivateProfile {
	return &UserPrivateProfile{
		UserPublicProfile: *u.ToPublicProfile(),
		Email:             u.Email,
		Phone:             u.Phone,
		HousingReason:     string(u.HousingReason),
		VerificationScore: u.VerificationScore,
		LastLoginAt:       u.LastLoginAt,
	}
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

type UserPublicProfile struct {
	ID                uuid.UUID  `json:"id"`
	FirstName         string     `json:"first_name"`
	LastName          string     `json:"last_name"`
	AvatarURL         *string    `json:"avatar_url,omitempty"`
	ProfessionalTitle *string    `json:"professional_title,omitempty"`
	Hobbies           []string   `json:"hobbies,omitempty"`
	KYCVerified       bool       `json:"kyc_verified"`
	MemberSince       time.Time  `json:"member_since"`
}

type UserPrivateProfile struct {
	UserPublicProfile
	Email             string     `json:"email"`
	Phone             *string    `json:"phone,omitempty"`
	HousingReason     string     `json:"housing_reason,omitempty"`
	VerificationScore int        `json:"verification_score"`
	LastLoginAt       *time.Time `json:"last_login_at,omitempty"`
}

type RegisterInput struct {
	FirstName     string `json:"first_name" binding:"required,min=2,max=100"`
	LastName      string `json:"last_name" binding:"required,min=2,max=100"`
	Email         string `json:"email" binding:"required,email"`
	Password      string `json:"password" binding:"required,min=8"`
	Phone         *string `json:"phone,omitempty"`
	HousingReason string `json:"housing_reason" binding:"required,oneof=job_loss loss_of_loved_one high_mortgage_rates divorce exploring"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	AccessToken  string             `json:"access_token"`
	RefreshToken string             `json:"refresh_token"`
	User         UserPrivateProfile `json:"user"`
}
