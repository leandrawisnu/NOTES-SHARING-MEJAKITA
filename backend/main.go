package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Image struct {
	gorm.Model
	URL    string `json:"url"`
	NoteID uint   `json:"note_id"` // Foreign key ke Note
}

type Note struct {
	gorm.Model
	Title   string  `json:"title"`
	Content string  `json:"content"`
	UserID  uint    `json:"user_id"`
	Images  []Image `json:"images"`
}

type User struct {
	gorm.Model
	Name     string `json:"name" gorm:"not null"`
	Email    string `json:"email" gorm:"unique;not null"`
	Password string `json:"password" gorm:"not null"`
	Notes    []Note
}

type Log struct {
	gorm.Model
	Method   string
	Endpoint string
	Headers  string
	Payload  string
	Response string
	Code     string
}

var (
	jwtKey = []byte("keripiktempe")
	db     *gorm.DB
)

type JWTClaim struct {
	ID    uint   `json:"id"`
	Email string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateJWT(email string, id uint) (string, error) {
	claims := &JWTClaim{
		ID:    id,
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func ValidateToken(signedToken string) (*JWTClaim, error) {
	token, err := jwt.ParseWithClaims(signedToken, &JWTClaim{}, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*JWTClaim)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization header"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.ID)
		c.Next()
	}
}

func LogRequestResponse(c *gin.Context, code int, response interface{}) {
	// Salin body request (karena body stream bisa dibaca cuma sekali)
	var bodyBytes []byte
	if c.Request.Body != nil {
		bodyBytes, _ = io.ReadAll(c.Request.Body)
	}
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// Simpan header & payload
	headers, _ := json.Marshal(c.Request.Header)
	payload := string(bodyBytes)
	respStr, _ := json.Marshal(response)

	db.Create(&Log{
		Method:   c.Request.Method,
		Endpoint: c.Request.URL.Path,
		Headers:  string(headers),
		Payload:  payload,
		Response: string(respStr),
		Code:     fmt.Sprint(code),
	})
}

func main() {
	dsn := "host=localhost user=postgres password=leandra dbname=notessharing port=5432 sslmode=disable TimeZone=Asia/Jakarta"
	var err error

	// Retry connection biar gak panik kalau DB belum ready
	for i := 0; i < 5; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			fmt.Println("✅ Connected to database")
			break
		}
		fmt.Println("⏳ Waiting for database...")
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		panic("❌ Failed to connect database: " + err.Error())
	}

	db.AutoMigrate(&User{}, &Note{}, &Image{}, &Log{})
	fmt.Println("🗄️ Database migrated")

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // atau ganti * jadi domain Next.js kamu
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// --- Auth ---
	r.POST("/register", func(c *gin.Context) {
		var user User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}
		user.Password, _ = HashPassword(user.Password)
		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register"})
			return
		}
		resp := gin.H{"message": "User registered successfully"}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	r.POST("/login", func(c *gin.Context) {
		var credentials struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&credentials); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}
		var user User
		db.Where("email = ?", credentials.Email).First(&user)
		if user.ID == 0 || !CheckPasswordHash(credentials.Password, user.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
		token, _ := GenerateJWT(user.Email, user.ID)
		resp := gin.H{"token": token}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	// --- Notes (GET bebas, POST/DELETE pakai JWT) ---
	r.GET("/notes", func(c *gin.Context) {
		var notes []Note
		db.Preload("Images").Find(&notes)
		resp := gin.H{"notes": notes}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	r.GET("/notes/:id", func(c *gin.Context) {
		var note Note
		if err := db.Preload("Images").First(&note, c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
			return
		}
		resp := gin.H{"note": note}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	auth := r.Group("/notes").Use(AuthMiddleware())

	auth.POST("", func(c *gin.Context) {
		var note Note
		userID := c.MustGet("userID").(uint)
		if err := c.ShouldBindJSON(&note); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}
		note.UserID = userID
		db.Create(&note)
		resp := gin.H{
			"message": "Note created",
			"id":      note.ID,
		}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	auth.POST("/image", func(c *gin.Context) {
		noteID := c.PostForm("note_id") // ambil note_id dari form
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File not found"})
			return
		}

		// Buat folder upload kalau belum ada
		uploadDir := "../frontend/public/uploads"
		os.MkdirAll(uploadDir, os.ModePerm)

		filename := fmt.Sprintf("%d_%s", time.Now().Unix(), file.Filename)
		filePath := fmt.Sprintf("%s/%s", uploadDir, filename)

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		fileURL := fmt.Sprintf("%s/uploads/%s", "http://localhost:3000", filename)

		// simpan ke database
		var image Image
		if noteID != "" {
			var note Note
			if err := db.First(&note, noteID).Error; err == nil {
				image = Image{URL: fileURL, NoteID: note.ID}
				db.Create(&image)
			}
		}

		resp := gin.H{
			"message":   "Upload success",
			"image_url": fileURL,
		}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	auth.DELETE("/image/:id", func(c *gin.Context) {
		userID := c.MustGet("userID").(uint)

		var image Image
		// Cari image berdasarkan id, tapi pastikan dia milik user yang sama lewat join ke note
		if err := db.Joins("JOIN notes ON notes.id = images.note_id").
			Where("images.id = ? AND notes.user_id = ?", c.Param("id"), userID).
			First(&image).Error; err != nil {

			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found or unauthorized"})
			return
		}

		// 🧹 Hapus file dari sistem lokal (optional)
		if strings.HasPrefix(image.URL, "http") {
			path := strings.TrimPrefix(image.URL, "frontend:3000/") // sesuaikan URL kamu
			_ = os.Remove(path)
		}

		db.Delete(&image)
		resp := gin.H{"message": "Image deleted"}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	auth.PUT("/:id", func(c *gin.Context) {
		userID := c.MustGet("userID").(uint)
		var note Note
		if err := db.Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&note).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
			return
		}
		if err := c.ShouldBindJSON(&note); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}
		db.Save(&note)
		resp := gin.H{"message": "Note updated"}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	auth.DELETE("/:id", func(c *gin.Context) {
		userID := c.MustGet("userID").(uint)
		var note Note
		if err := db.Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&note).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
			return
		}
		db.Delete(&note)
		resp := gin.H{"message": "Note deleted"}
		LogRequestResponse(c, 200, resp)
		c.JSON(http.StatusOK, resp)
	})

	r.Run(":8080")
}
