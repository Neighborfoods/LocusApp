package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"locus/internal/middleware"
	"locus/internal/models"
	"locus/internal/services"
	"locus/pkg/response"
)

type CommunityHandler struct {
	svc services.CommunityService
	log *zap.Logger
}

func NewCommunityHandler(svc services.CommunityService, log *zap.Logger) *CommunityHandler {
	return &CommunityHandler{svc: svc, log: log}
}

// GET /communities
func (h *CommunityHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	mine := c.Query("mine") == "true"
	search := c.Query("search")
	typeFilter := c.Query("type")
	sort := c.DefaultQuery("sort", "rating")

	userID := middleware.GetUserID(c)

	result, meta, err := h.svc.List(c.Request.Context(), services.ListCommunitiesParams{
		UserID:   userID,
		Mine:     mine,
		Search:   search,
		Type:     typeFilter,
		Sort:     sort,
		Page:     page,
		PageSize: limit,
	})
	if err != nil {
		h.log.Error("list communities", zap.Error(err))
		response.Internal(c)
		return
	}

	response.Paginated(c, result, meta)
}

// GET /communities/nearby
func (h *CommunityHandler) Nearby(c *gin.Context) {
	var input models.NearbyCommunityInput
	if err := c.ShouldBindQuery(&input); err != nil {
		response.ValidationErr(c, err)
		return
	}

	communities, err := h.svc.Nearby(c.Request.Context(), input.Latitude, input.Longitude, input.RadiusKm)
	if err != nil {
		h.log.Error("nearby communities", zap.Error(err))
		response.Internal(c)
		return
	}

	response.Success(c, communities)
}

// POST /communities
func (h *CommunityHandler) Create(c *gin.Context) {
	var input models.CreateCommunityInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.ValidationErr(c, err)
		return
	}

	ownerID := middleware.GetUserID(c)
	community, err := h.svc.Create(c.Request.Context(), ownerID, &input)
	if err != nil {
		h.log.Error("create community", zap.Error(err))
		response.Internal(c)
		return
	}

	response.Created(c, community)
}

// GET /communities/:id
func (h *CommunityHandler) Get(c *gin.Context) {
	id := c.Param("id")
	community, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		response.NotFound(c, "Community not found")
		return
	}
	response.Success(c, community)
}

// PATCH /communities/:id
func (h *CommunityHandler) Update(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	var input models.UpdateCommunityInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.ValidationErr(c, err)
		return
	}

	community, err := h.svc.Update(c.Request.Context(), id, userID, &input)
	if err != nil {
		response.Forbidden(c)
		return
	}

	response.Success(c, community)
}

// GET /communities/:id/members
func (h *CommunityHandler) GetMembers(c *gin.Context) {
	id := c.Param("id")
	members, err := h.svc.GetMembers(c.Request.Context(), id)
	if err != nil {
		response.Internal(c)
		return
	}
	response.Success(c, members)
}

// POST /communities/:id/apply
func (h *CommunityHandler) Apply(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	var body struct {
		PropertyID string `json:"property_id" binding:"required,uuid"`
		Message    string `json:"message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.ValidationErr(c, err)
		return
	}

	membership, err := h.svc.Apply(c.Request.Context(), id, userID, body.PropertyID, body.Message)
	if err != nil {
		response.Conflict(c, "Already applied or member")
		return
	}

	response.Created(c, membership)
}

// POST /communities/:id/members/:userId/approve
func (h *CommunityHandler) ApproveMember(c *gin.Context) {
	communityID := c.Param("id")
	targetUserID := c.Param("userId")
	adminID := middleware.GetUserID(c)

	if err := h.svc.ApproveMember(c.Request.Context(), communityID, adminID, targetUserID); err != nil {
		response.Forbidden(c)
		return
	}

	response.Success(c, gin.H{"message": "Member approved"})
}

// POST /communities/:id/members/:userId/reject
func (h *CommunityHandler) RejectMember(c *gin.Context) {
	communityID := c.Param("id")
	targetUserID := c.Param("userId")
	adminID := middleware.GetUserID(c)

	if err := h.svc.RejectMember(c.Request.Context(), communityID, adminID, targetUserID); err != nil {
		response.Forbidden(c)
		return
	}

	response.Success(c, gin.H{"message": "Application rejected"})
}

// POST /communities/:id/leave
func (h *CommunityHandler) Leave(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	if err := h.svc.Leave(c.Request.Context(), id, userID); err != nil {
		response.Err(c, http.StatusBadRequest, "Cannot leave community: "+err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Left community"})
}

// POST /communities/:id/fund/distribute
func (h *CommunityHandler) DistributeIncome(c *gin.Context) {
	id := c.Param("id")
	adminID := middleware.GetUserID(c)

	if err := h.svc.DistributeIncome(c.Request.Context(), id, adminID); err != nil {
		response.Forbidden(c)
		return
	}

	response.Success(c, gin.H{"message": "Income distributed"})
}

// GET /communities/:id/fund/summary
func (h *CommunityHandler) FundSummary(c *gin.Context) {
	id := c.Param("id")
	summary, err := h.svc.FundSummary(c.Request.Context(), id)
	if err != nil {
		response.Internal(c)
		return
	}
	response.Success(c, summary)
}

// GET /communities/:id/fund/transactions
func (h *CommunityHandler) FundTransactions(c *gin.Context) {
	id := c.Param("id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	txs, meta, err := h.svc.FundTransactions(c.Request.Context(), id, page, limit)
	if err != nil {
		response.Internal(c)
		return
	}
	response.Paginated(c, txs, meta)
}

// POST /communities/:id/waiting-list
func (h *CommunityHandler) JoinWaitingList(c *gin.Context) {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	entry, err := h.svc.JoinWaitingList(c.Request.Context(), id, userID)
	if err != nil {
		response.Conflict(c, "Already on waiting list")
		return
	}

	response.Created(c, entry)
}

// POST /communities/:id/transfer-request
func (h *CommunityHandler) RequestTransfer(c *gin.Context) {
	fromID := c.Param("id")
	userID := middleware.GetUserID(c)

	var body struct {
		ToCommunityID string `json:"to_community_id" binding:"required,uuid"`
		Message       string `json:"message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.ValidationErr(c, err)
		return
	}

	tr, err := h.svc.RequestTransfer(c.Request.Context(), fromID, body.ToCommunityID, userID, body.Message)
	if err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	response.Created(c, tr)
}
