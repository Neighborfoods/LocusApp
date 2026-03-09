package repositories

import (
	"context"

	"github.com/google/uuid"
	"locus/internal/models"
	"locus/pkg/response"
)

// ── User ──────────────────────────────────────────────────────────────────────

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error
}

// ── Community ─────────────────────────────────────────────────────────────────

type ListCommunityFilter struct {
	UserID   uuid.UUID
	Mine     bool
	Search   string
	Type     string
	Sort     string
	Page     int
	PageSize int
}

type CommunityRepository interface {
	Create(ctx context.Context, c *models.Community) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Community, error)
	List(ctx context.Context, filter ListCommunityFilter) ([]*models.Community, *response.Meta, error)
	FindNearby(ctx context.Context, lat, lng, radiusKm float64) ([]*models.Community, error)
	Update(ctx context.Context, id uuid.UUID, input *models.UpdateCommunityInput) (*models.Community, error)
	Delete(ctx context.Context, id uuid.UUID) error

	// Waiting list
	FindWaitingListEntry(ctx context.Context, userID, communityID uuid.UUID) (*models.WaitingListEntry, error)
	AddToWaitingList(ctx context.Context, entry *models.WaitingListEntry) error
	GetWaitingList(ctx context.Context, communityID uuid.UUID) ([]*models.WaitingListEntry, error)

	// Transfer
	CreateTransferRequest(ctx context.Context, tr *models.TransferRequest) error
	GetTransferRequests(ctx context.Context, communityID uuid.UUID) ([]*models.TransferRequest, error)
	UpdateTransferRequest(ctx context.Context, id uuid.UUID, status string) error
}

// ── Membership ────────────────────────────────────────────────────────────────

type MembershipRepository interface {
	Create(ctx context.Context, m *models.Membership) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Membership, error)
	FindByUserAndCommunity(ctx context.Context, userID, communityID uuid.UUID) (*models.Membership, error)
	FindByCommunity(ctx context.Context, communityID uuid.UUID) ([]*models.Membership, error)
	FindByUser(ctx context.Context, userID uuid.UUID) ([]*models.Membership, error)
	UpdateStatus(ctx context.Context, userID, communityID uuid.UUID, status string) error
	UpdateEquity(ctx context.Context, id uuid.UUID, equityPct float64) error
	Delete(ctx context.Context, userID, communityID uuid.UUID) error
}

// ── Finance ───────────────────────────────────────────────────────────────────

type FinanceRepository interface {
	GetFundSummary(ctx context.Context, communityID uuid.UUID) (*models.FundSummary, error)
	GetTransactions(ctx context.Context, communityID uuid.UUID, page, limit int) ([]*models.CommunityFundTransaction, *response.Meta, error)
	AddTransaction(ctx context.Context, tx *models.CommunityFundTransaction) error
	GetMemberEarnings(ctx context.Context, communityID, userID uuid.UUID, page, limit int) ([]*models.MemberEarning, *response.Meta, error)
	DistributeToMembers(ctx context.Context, communityID uuid.UUID) error
}

// ── Property ──────────────────────────────────────────────────────────────────

type PropertyRepository interface {
	Create(ctx context.Context, p *models.Property) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Property, error)
	FindByOwner(ctx context.Context, ownerID uuid.UUID) ([]*models.Property, error)
	FindByMembership(ctx context.Context, membershipID uuid.UUID) (*models.Property, error)
	Update(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*models.Property, error)
	Delete(ctx context.Context, id uuid.UUID) error
	FindMapPins(ctx context.Context, lat, lng, radiusKm float64) ([]*models.PropertyMapPin, error)
}

// ── Vote ──────────────────────────────────────────────────────────────────────

type VoteRepository interface {
	Create(ctx context.Context, v *models.Vote) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Vote, error)
	FindByCommunity(ctx context.Context, communityID uuid.UUID, status string, page, limit int) ([]*models.Vote, *response.Meta, error)
	Update(ctx context.Context, v *models.Vote) error
	CastBallot(ctx context.Context, ballot *models.Ballot) error
	FindBallot(ctx context.Context, voteID, userID uuid.UUID) (*models.Ballot, error)
	GetResults(ctx context.Context, voteID uuid.UUID) (*models.VoteResultResponse, error)
}

// ── Notification ─────────────────────────────────────────────────────────────

type NotificationRepository interface {
	Create(ctx context.Context, n *models.Notification) error
	FindByUser(ctx context.Context, userID uuid.UUID, page, limit int) ([]*models.Notification, *response.Meta, error)
	MarkRead(ctx context.Context, id, userID uuid.UUID) error
	MarkAllRead(ctx context.Context, userID uuid.UUID) error
	UnreadCount(ctx context.Context, userID uuid.UUID) (int64, error)
}
