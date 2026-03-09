package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"locus/internal/models"
	"locus/internal/repositories"
	"locus/pkg/response"
)

type ListCommunitiesParams struct {
	UserID   uuid.UUID
	Mine     bool
	Search   string
	Type     string
	Sort     string
	Page     int
	PageSize int
}

type CommunityService interface {
	List(ctx context.Context, params ListCommunitiesParams) ([]*models.Community, *response.Meta, error)
	Nearby(ctx context.Context, lat, lng, radiusKm float64) ([]*models.Community, error)
	GetByID(ctx context.Context, id string) (*models.Community, error)
	Create(ctx context.Context, ownerID uuid.UUID, input *models.CreateCommunityInput) (*models.Community, error)
	Update(ctx context.Context, id string, userID uuid.UUID, input *models.UpdateCommunityInput) (*models.Community, error)
	GetMembers(ctx context.Context, id string) ([]*models.Membership, error)
	Apply(ctx context.Context, communityID string, userID uuid.UUID, propertyID, message string) (*models.Membership, error)
	ApproveMember(ctx context.Context, communityID string, adminID, targetUserID uuid.UUID) error
	RejectMember(ctx context.Context, communityID string, adminID, targetUserID uuid.UUID) error
	Leave(ctx context.Context, communityID string, userID uuid.UUID) error
	DistributeIncome(ctx context.Context, communityID string, adminID uuid.UUID) error
	FundSummary(ctx context.Context, communityID string) (*models.FundSummary, error)
	FundTransactions(ctx context.Context, communityID string, page, limit int) ([]*models.CommunityFundTransaction, *response.Meta, error)
	JoinWaitingList(ctx context.Context, communityID string, userID uuid.UUID) (*models.WaitingListEntry, error)
	RequestTransfer(ctx context.Context, fromID, toID string, userID uuid.UUID, message string) (*models.TransferRequest, error)
}

type communityService struct {
	communityRepo repositories.CommunityRepository
	memberRepo    repositories.MembershipRepository
	financeRepo   repositories.FinanceRepository
}

func NewCommunityService(
	communityRepo repositories.CommunityRepository,
	memberRepo repositories.MembershipRepository,
	financeRepo repositories.FinanceRepository,
) CommunityService {
	return &communityService{
		communityRepo: communityRepo,
		memberRepo:    memberRepo,
		financeRepo:   financeRepo,
	}
}

func (s *communityService) List(ctx context.Context, params ListCommunitiesParams) ([]*models.Community, *response.Meta, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}
	return s.communityRepo.List(ctx, repositories.ListCommunityFilter{
		UserID:   params.UserID,
		Mine:     params.Mine,
		Search:   params.Search,
		Type:     params.Type,
		Sort:     params.Sort,
		Page:     params.Page,
		PageSize: params.PageSize,
	})
}

func (s *communityService) Nearby(ctx context.Context, lat, lng, radiusKm float64) ([]*models.Community, error) {
	if radiusKm <= 0 || radiusKm > 500 {
		radiusKm = 50
	}
	return s.communityRepo.FindNearby(ctx, lat, lng, radiusKm)
}

func (s *communityService) GetByID(ctx context.Context, id string) (*models.Community, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid community id")
	}
	return s.communityRepo.FindByID(ctx, uid)
}

func (s *communityService) Create(ctx context.Context, ownerID uuid.UUID, input *models.CreateCommunityInput) (*models.Community, error) {
	if input.Capacity < 2 {
		input.Capacity = 2
	}
	community := &models.Community{
		Name:        input.Name,
		Type:        input.Type,
		OwnerID:     ownerID,
		IsPublic:    input.IsPublic,
		Capacity:    input.Capacity,
		MemberCount: 1, // founder
	}
	if input.Description != "" {
		community.Description = &input.Description
	}
	if input.City != "" {
		community.City = &input.City
	}
	if input.State != "" {
		community.State = &input.State
	}
	if input.Latitude != nil {
		community.Latitude = input.Latitude
	}
	if input.Longitude != nil {
		community.Longitude = input.Longitude
	}

	if err := s.communityRepo.Create(ctx, community); err != nil {
		return nil, fmt.Errorf("create community: %w", err)
	}

	// Auto-add owner as founder member
	membership := &models.Membership{
		UserID:      ownerID,
		CommunityID: community.ID,
		Role:        models.MemberRoleFounder,
		Status:      "active",
	}
	_ = s.memberRepo.Create(ctx, membership)

	return community, nil
}

func (s *communityService) Update(ctx context.Context, id string, userID uuid.UUID, input *models.UpdateCommunityInput) (*models.Community, error) {
	community, err := s.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if community.OwnerID != userID {
		return nil, errors.New("not authorized")
	}
	return s.communityRepo.Update(ctx, community.ID, input)
}

func (s *communityService) GetMembers(ctx context.Context, id string) ([]*models.Membership, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid id")
	}
	return s.memberRepo.FindByCommunity(ctx, uid)
}

func (s *communityService) Apply(ctx context.Context, communityID string, userID uuid.UUID, propertyID, message string) (*models.Membership, error) {
	uid, err := uuid.Parse(communityID)
	if err != nil {
		return nil, errors.New("invalid community id")
	}
	propUID, err := uuid.Parse(propertyID)
	if err != nil {
		return nil, errors.New("invalid property id")
	}

	// Check not already member
	existing, _ := s.memberRepo.FindByUserAndCommunity(ctx, userID, uid)
	if existing != nil {
		return nil, errors.New("already applied or member")
	}

	membership := &models.Membership{
		UserID:               userID,
		CommunityID:          uid,
		ContributedPropertyID: &propUID,
		Role:                 models.MemberRoleMember,
		Status:               "pending",
	}
	if err := s.memberRepo.Create(ctx, membership); err != nil {
		return nil, fmt.Errorf("create membership: %w", err)
	}
	return membership, nil
}

func (s *communityService) ApproveMember(ctx context.Context, communityID string, adminID, targetUserID uuid.UUID) error {
	uid, _ := uuid.Parse(communityID)
	// Verify admin is founder/admin of community
	adminMembership, err := s.memberRepo.FindByUserAndCommunity(ctx, adminID, uid)
	if err != nil || (adminMembership.Role != models.MemberRoleAdmin && adminMembership.Role != models.MemberRoleFounder) {
		return errors.New("not authorized")
	}
	return s.memberRepo.UpdateStatus(ctx, targetUserID, uid, "active")
}

func (s *communityService) RejectMember(ctx context.Context, communityID string, adminID, targetUserID uuid.UUID) error {
	uid, _ := uuid.Parse(communityID)
	adminMembership, err := s.memberRepo.FindByUserAndCommunity(ctx, adminID, uid)
	if err != nil || (adminMembership.Role != models.MemberRoleAdmin && adminMembership.Role != models.MemberRoleFounder) {
		return errors.New("not authorized")
	}
	return s.memberRepo.UpdateStatus(ctx, targetUserID, uid, "rejected")
}

func (s *communityService) Leave(ctx context.Context, communityID string, userID uuid.UUID) error {
	uid, _ := uuid.Parse(communityID)
	// Cannot leave if you're the founder with other members
	community, err := s.communityRepo.FindByID(ctx, uid)
	if err != nil {
		return err
	}
	if community.OwnerID == userID && community.MemberCount > 1 {
		return errors.New("founder must transfer ownership before leaving")
	}
	return s.memberRepo.Delete(ctx, userID, uid)
}

func (s *communityService) DistributeIncome(ctx context.Context, communityID string, adminID uuid.UUID) error {
	uid, _ := uuid.Parse(communityID)
	// Verify admin
	adminMembership, err := s.memberRepo.FindByUserAndCommunity(ctx, adminID, uid)
	if err != nil || (adminMembership.Role != models.MemberRoleAdmin && adminMembership.Role != models.MemberRoleFounder) {
		return errors.New("not authorized")
	}
	return s.financeRepo.DistributeToMembers(ctx, uid)
}

func (s *communityService) FundSummary(ctx context.Context, communityID string) (*models.FundSummary, error) {
	uid, _ := uuid.Parse(communityID)
	return s.financeRepo.GetFundSummary(ctx, uid)
}

func (s *communityService) FundTransactions(ctx context.Context, communityID string, page, limit int) ([]*models.CommunityFundTransaction, *response.Meta, error) {
	uid, _ := uuid.Parse(communityID)
	return s.financeRepo.GetTransactions(ctx, uid, page, limit)
}

func (s *communityService) JoinWaitingList(ctx context.Context, communityID string, userID uuid.UUID) (*models.WaitingListEntry, error) {
	uid, _ := uuid.Parse(communityID)
	existing, _ := s.communityRepo.FindWaitingListEntry(ctx, userID, uid)
	if existing != nil {
		return nil, errors.New("already on waiting list")
	}
	entry := &models.WaitingListEntry{
		CommunityID: uid,
		UserID:      userID,
	}
	if err := s.communityRepo.AddToWaitingList(ctx, entry); err != nil {
		return nil, err
	}
	return entry, nil
}

func (s *communityService) RequestTransfer(ctx context.Context, fromID, toID string, userID uuid.UUID, message string) (*models.TransferRequest, error) {
	fromUID, _ := uuid.Parse(fromID)
	toUID, _ := uuid.Parse(toID)

	// Must be member of fromCommunity
	_, err := s.memberRepo.FindByUserAndCommunity(ctx, userID, fromUID)
	if err != nil {
		return nil, errors.New("not a member of source community")
	}

	tr := &models.TransferRequest{
		UserID:            userID,
		FromCommunityID:   fromUID,
		ToCommunityID:     toUID,
		Message:           &message,
		Status:            "pending",
	}
	if err := s.communityRepo.CreateTransferRequest(ctx, tr); err != nil {
		return nil, fmt.Errorf("create transfer request: %w", err)
	}
	return tr, nil
}
